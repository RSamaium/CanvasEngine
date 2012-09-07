var app = require('http').createServer(), 
	io = require('socket.io').listen(app),
	obj = require('./engine-common'),
	Class = obj.Class,
	CE = obj.CanvasEngine;


global.Class = Class;
global.CE = CE;
global.Marshall = require('./core/Marshall');

Class.create("ModelServer", {
	socket: null,
	_models: {},
	init: function(name, events, model) {
		if (!(events instanceof Array)) {
			model = events;
			events = false;
		}
		if (!events) {
			events = [];
		}
		var self = this;
		events.push("disconnect");
		this.create(name, events, model);
		io.sockets.on('connection', function (socket) {
			self.socket = socket;
			self.new(name);
		});
		return this;
	},
	create: function(name, events, model) {
		if (!(events instanceof Array)) {
			model = events;
			events = false;
		}
		var self = this;
		this._models[name] = events;
		return Class.create(name, model).extend({
			scene: {
				emit: function(name, value) {
					self.socket.emit(name, value);
				},
				broadcast: {
					emit: function(name, value) {
						self.socket.broadcast.emit(name, value);
					},
					to: function(room, name, value) {
						self.socket.broadcast.to(room).emit(name, value);
					}
				},
				join: function(room) {
					self.socket.join(room);
				},
				leave: function(room) {
					self.socket.leave(room);
				},
				disconnect: function(data) {
					io.sockets.emit(data);
				}
			}
		});
		
	},
	new: function(name) {
		var self = this;
		var _class = Class.new(name);
		var events = this._models[name];
		if (events) {
			for (var key in events) {
				obj = _class[events[key]];
				if (obj) {
					setEvent.call(this, _class, key, obj);
				}
			}
		}
		
		function setEvent(_class, key, obj) {
			this.socket.on(events[key], function(data) {
				if (!data) {
					data = {};
				}
				if (obj) obj.call(_class, data);
			});
		}
		
		return _class;
	}
});

global.ModelServer = Class.new("ModelServer");

exports.listen = function(port) {
	app.listen(port);
	return ModelServer;
};