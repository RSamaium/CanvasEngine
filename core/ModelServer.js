/**
@doc server/
@method requireExtend `(>= 1.3.0)` Load a class
@static
@return {Class} 
@examples

   var CE = require("canvasengine").listen(8333),
	   Tiled = CE.Core.requireExtend("Tiled").Class,
	   Class = CE.Class;

*/

/**
@doc server/
@method io `(>= 1.3.0)` Reference Socket.io. To call an event on a stage, you must prefix the name of the event by the name of the scene
@static
@return {Socket.io} 
@examples

   var CE = require("canvasengine").listen(8333),
		Class = CE.Class;
	
	CE.Model.init("Main", {

		initialize: function(socket) {
			CE.Core.io.emit("MyScene.load", {foo: bar});	
		}
	});

*/



exports.Class = function(Class, CE, Users) {
	var io = CE.io;
/**
@doc server
@class ModelServer Model used for the server. Socket.io resumes with a notion of class

1. Import CanvasEngine
2. Listen a port
3. Initialize the model with a main class

	var CE = require("canvasengine").listen(8336);

	CE.Model.init("Main", {

		initialize: function(socket) {
			// Code
		}
	});

*/
	Class.create("ModelServer", {
		_models: {},
		_socket: null,
/**
@doc server/
@method init Initializes the connection and call the class
@params {String} name Class name
@params {Array} name (optional) Name of the methods that can be called by the client
@params {Object} model (optional) Properties and methods of this class

* the "initialize" method is called automatically when the connection with socket parameter
* the "disconnect" method is called when the user logs out

@example

	var CE = require("canvasengine").listen(8336);

	CE.Model.init("Main", {

		initialize: function(soçcket) {
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
				var _class;
				self._socket = socket;
				Users.add(socket);
				Users._Model = _class = self.new(name, [socket], socket);	
				_class.socket = socket;
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

	 var CE = require("canvasengine").listen(),
	    Class = CE.Class;

    CE.Model.create("Player", ["start"], {

        initialize: function(user_id, username) {

        },

        start: function() {

        }

    });

    exports.New = function(socket, user_id, username) {
       return CE.Model.new("Player", [user_id, username], socket);
    };
	
In main JS file :

	var CE = require("canvasengine").listen(8333),
	    Class = CE.Class;

    CE.Model.init("Main", {

	  initialize: function(socket) {
		 var player = require("./player").New(1, "Foo", socket);
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
CanvasEngine < 1.3.0

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
						@method scene.emit (View Socket.io)
					*/
					emit: function(name, value) {
						self._socket.emit(name, value);
					},
					/**
						@method scene.broadcast.emit (View Socket.io)
					*/
					/**
						@method scene.broadcast.to (View Socket.io)
					*/
					broadcast: {
						emit: function(name, value) {
							self._socket.broadcast.emit(name, value);
						},
						to: function(room, name, value) {
							self._socket.broadcast.to(room).emit(name, value);
						}
					},
					/**
						@method scene.join (View Socket.io)
					*/
					join: function(room) {
						self._socket.join(room);
					},
					/**

						@method scene.leave (View Socket.io)
					*/
					leave: function(room) {
						self._socket.leave(room);
					},
					/**
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
@method new (alias `New`) Instantiating a model
@params {String} name Class name
@params {Array} params Class params
@params {Boolean|Null|Object} socket (optional) Assign events of a class to a user

- `false` : The class takes the socket from a **single user** connected (by default)
- `null` : does not assign events
- an object : The socket assigned to the class to load events

@example

Module in "/mods/myclass.js" :

	 var CE = require("canvasengine").listen(),
	    Class = CE.Class;

    CE.Model.create("Player", ["start"], {

        initialize: function(user_id, username) {

        },

        start: function() {

        }

    });

    exports.New = function(socket, user_id, username) {
       return CE.Model.new("Player", [user_id, username], socket);
    };
	
In main JS file :

	var CE = require("canvasengine").listen(8333),
	    Class = CE.Class;

    CE.Model.init("Main", {

	  initialize: function(socket) {
		 var player = require("./player").New(1, "Foo", socket);
	  }
	  
   });
   
@return {Class}
*/
		New: function() { return this["new"].apply(this, arguments); },
		new: function(name, params, socket) {
		
			socket = socket == null ? false : this._socket;
		
			var _class = Class.new(name, params);
			_class._events_ =  this._models[name];
			if (socket) this.assignEvents(_class, [socket]);
			return _class;
		},
		
/**
@doc server/
@method assignEvents (>= 1.3.0) Assign events of a class to a user
@params {String} name Class name
@params {Object} socket Socket
@example

	var Map = require("./map").New(null); // socket is null. It indicates that not assign an event to sockets
    
    CE.Model.init("Main", {

         enterMap: function() {
    		 CE.Model.assignEvents(Map, this.socket);
    	 }

    });
   
@return {Class}
*/
		assignEvents: function(_class, clients) {
			
			var self = this, socket;
			var events = _class._events_;
			var setEvent = function (method) {
				obj = _class[method];
				if (obj) {
					if (!(clients instanceof Array)) {
						clients = [clients];
					}
					for (var i=0 ; i < clients.length ; i++) {
						socket = clients[i];
						socket.on(method, function(data) {
							if (!data) {
								data = {};
							}
							obj = _class[method];
							if (obj) obj.call(_class, data, this);
						});
					}
				}
				
			}

			if (events) {
				for (var key in events) {
					setEvent.call(this, events[key]);
				}
			}
			return this;
		}
	});
	return Class.new("ModelServer");
}