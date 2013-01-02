exports.Class = function(Class, CE) {
	var io = CE.io;
/**
@doc server
@class ModelServer Model used for the server. Socket.io resumes with a notion of class

1. Import CanvasEngine
2. Listen a port
3. Initialize the model with a main class

	var CE = require("canvasengine").listen(8336);

	CE.Model.init("Main", {

		initialize: function() {
			// Code
		}
	});

*/
	Class.create("ModelServer", {
		/**
			@doc server/
			@property socket The socket user (socket.io)
			@type Object
			@default null
		*/
		socket: null,
		_models: {},
/**
@doc server/
@method init Initializes the connection and call the class
@params {String} name Class name
@params {Array} name (optional) Name of the methods that can be called by the client
@params {Object} model (optional) Properties and methods of this class

* the "initialize" method is called automatically when the connection
* the "disconnect" method is called when the user logs out

@example

	var CE = require("canvasengine").listen(8336);

	CE.Model.init("Main", {

		initialize: function() {
			// Code
		}
	});

@return {ModelServer}
*/
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
/**
@doc server/
@method create Create a model
@params {String} name Class name
@params {Array} name (optional) Name of the methods that can be called by the client
@params {Object} model (optional) Properties and methods of this class
@example

Module in "/mods/myclass.js" :

	exports.Class = function(CE) {
		return CE.Model.create("MyClass", {

			initialize: function() {
				// Code
			}
			
		});
	}	

In main JS file :

	var CE = require("canvasengine").listen(8336);
	CE.Model.init("Main", {

		initialize: function() {
			var Class = require('./mods/myclass').Class(CE),
				myclass = Class.new("MyClass");
		}
	});

@return {Class}
*/
		create: function(name, events, model) {
			if (!(events instanceof Array)) {
				model = events;
				events = false;
			}
			var self = this;
			this._models[name] = events;
			return Class.create(name, model).extend({
/**
@doc server/
@property scene Sends data to the scene
@type Object
@example

Server :
	
		var CE = require("canvasengine").listen(8336);
		CE.Model.init("Main", {
			initialize: function() {
				 this.scene.emit("foo", "Hello");
			}
		});
	

Client :
	var Model = io.connect('http://127.0.0.1:8333');

	var canvas = CE.defines("canvas").
		ready(function() {
			canvas.Scene.call("MyScene");
		});

	canvas.Scene.new({
	  name: "MyScene",
	  model: Model,
	  events: ["foo"], 
	  ready: function(stage) {
		
	  },
	  foo: function(text) {
		 console.log(text);
	  }
	});
*/
				scene: {
					/**
						@doc server/
						@method scene.emit (View Socket.io)
					*/
					emit: function(name, value) {
						self.socket.emit(name, value);
					},
					/**
						@doc server/
						@method scene.broadcast.emit (View Socket.io)
					*/
					/**
						@doc server/
						@method scene.broadcast.to (View Socket.io)
					*/
					broadcast: {
						emit: function(name, value) {
							self.socket.broadcast.emit(name, value);
						},
						to: function(room, name, value) {
							self.socket.broadcast.to(room).emit(name, value);
						}
					},
					/**
						@doc server/
						@method scene.join (View Socket.io)
					*/
					join: function(room) {
						self.socket.join(room);
					},
					/**
						@doc server/
						@method scene.leave (View Socket.io)
					*/
					leave: function(room) {
						self.socket.leave(room);
					},
					/**
						@doc server/
						@method scene.disconnect (View Socket.io)
					*/
					disconnect: function(data) {
						io.sockets.emit(data);
					}
				}
			});
			
		},
/**
@doc server/
@method new Instantiating a model
@params {String} name Class name
@example

Module in "/mods/myclass.js" :

	exports.Class = function(CE) {
		var Class = CE.Model.create("MyClass", {

			initialize: function() {
				// Code
			},
			
			foo: function() {
				console.log("Hello World");
			}
			
		});
		return Class.new("MyClass");
	}	

In main JS file :

	var CE = require("canvasengine").listen(8336);
	CE.Model.init("Main", {

		initialize: function() {
			var myclass = require('./mods/myclass').Class(CE);
			myclass.foo();
		}
	});
@return {Class}
*/
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
	return Class.new("ModelServer");
}