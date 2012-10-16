# Multiplayer

CanvasEngine implements a multiplayer game using NodeJS and Socket.io

1. Install [Node.js](http://nodejs.org) and [NPM](https://npmjs.org/)
2. Open the Shell :

       npm install canvasengine

3. Create a. Js file in your project for the server

---

Here is an example of a client code :

    <!DOCTYPE html>
    <html>
    <head>
	<script src="canvasengine-X.Y.Z.all.min.js"></script>
	<script src="extends/Socket.js"></script>
	
	<script>
		var Model = io.connect('http://127.0.0.1:8333');

		var canvas = CE.defines("canvas").
			ready(function() {
			canvas.Scene.call("MyScene");
		 });

		canvas.Scene.new({
		  name: "MyScene",
		  model: Model,
		  events: ["load"], 
		  ready: function(stage) {
			this.model.emit("start");
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

	  initialize: function() {

	  },
	  start: function() {
		this.scene.emit("load", "Hello");
	  }
	
    });

1. The client sends data to the server with the `emit` method `model` property
2. The method defined in the array is performed (method name sent by the client)
3. Conversely, data is sent to the scene with the `emit` method `scene` property
4. Here, the `load` method is executed and defined in the `events` property
	
> The methods are the same as Socket.io