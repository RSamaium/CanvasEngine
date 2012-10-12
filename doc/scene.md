# Create a scene

Scenes can prepare the elements and display them on the screen

    var canvas = CE.defines("canvas_id").
	ready(function() {
		canvas.Scene.call("MyScene");
	});
			
    canvas.Scene.new({
	  name: "MyScene", // Obligatory
	  materials: {
		images: {
			img_id: "path/to/img.png"
		}
	  },
	  preload: function(stage, pourcent) {
	
	  },
	  ready: function(stage) {
		
	  },
	  render: function(stage) {
		
	  },
	  exit: function(stage) {
	
	  }
    });

The scene is composed of several methods. All methods are optional.

* `preload` : Method called at each resource loaded  in the `materials` property
* `ready`: Method called when resources are loaded
* `render` : Method called at each render (60 FPS)
* `exit` :Method called when this scene is quitted (or another scene is called)

To call the scene:

    canvas.Scene.call("MyScene");

The name of the scene is set in the `name` parameter.

The `stage` parameter is the main element. Child elements will be added to the `stage` element