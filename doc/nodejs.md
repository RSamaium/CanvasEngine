# Multiplayer

CanvasEngine implements a multiplayer game using NodeJS and Socket.io

1. Install [Node.js](http://nodejs.org) and [NPM](https://npmjs.org/)
2. Open the Shell :

       npm install canvasengine

3. Create a. Js file in your project for the server

## Example

Here is an example of a client code :

    <!DOCTYPE html>
    <html>
    <head>
	<script src="canvasengine-X.Y.Z.all.min.js"></script>
	<script src="extends/Socket.js"></script>
	
	<script>
		var canvas = CE.defines("canvas").
			ready(function() {
			canvas.Scene.call("MyScene");
		 });

		canvas.Scene.new({
		  name: "MyScene",
		  events: ["load"], 
		  ready: function(stage) {
		       CE.connectServer('http://127.0.0.1', 8333);
               this.loadEvents();
               CE.io.emit("load");
		  },
		  load: function(text) {
			 console.log(text);
		  }
		});

	</script>
    </head>
     <body>
	    <canvas id="canvas" width="675px" height="506px"></canvas>
     </body>
    </html>

And server code :


    var CE = require("canvasengine").listen(8333);
	CE.Model.init("Main", ["start"], {

	  initialize: function(socket) {

	  },
	  start: function() {
		 this.socket.emit("MyScene.load", "Hello");
	  }
	
    });

1. We make a connection with `connectServer()` method
2. Since the scene is already loaded and the connection after,  load events with
1. The client sends data to the server with the `emit` of `CE.io` property `loadEvents()`. If we connect before the opening of the scene, no need to call this method:

        CE.connectServer('http://127.0.0.1', 8333);

        canvas.Scene.new({
		  name: "MyScene",
		  events: ["load"], 
		  ready: function(stage) {
               CE.io.emit("load");
		  },
		  load: function(text) {
			 console.log(text);
		  }
		});


3. Conversely, data is sent to the scene with the `emit` method `CE.Core.io` property. Note that you can call methods of a particular scene, by prefixing the name of the event by the name of the scene
4. Here, the `load` method is executed and defined in the `events` property
	
> `CE.io` and `CE.Core.io` methods are the same as Socket.io

## Create a module

Server side, create a JS file

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

1. Load CanvasEngine. No need to put the port.
2. Create a class with events
3. The function of `export.New()` created a new instance of the `Player` class with two parameters.
4. The socket parameter is essential if you want the user invokes events class. Because here we have a player, we assign the socket of the user class

Our main class :

    var CE = require("canvasengine").listen(8333),
	    Class = CE.Class;

    CE.Model.init("Main", {

	  initialize: function(socket) {
		 var player = require("./player").New(1, "Foo", socket);
	  },
	  
   });

If the class is common to all the world (a map by example)

    var Map = require("./map").New(null); // socket is null. It indicates that not assign an event to sockets
    
    CE.Model.init("Main", {

         enterMap: function() {
    		 CE.Model.assignEvents(Map, this.socket);
    	 }

    });

Here we take into account that the `Map` object is global. In addition, it refers to a previously instantiated class (not written in the code above, imagine). Since the class has already been instantiated, we assign events to the user of the class when he gets on the map



