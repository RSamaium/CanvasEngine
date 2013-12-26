# Create a scene

Scenes can prepare the elements and display them on the screen

    var canvas = CE.defines("canvas_id").
	ready(function() {
		canvas.Scene.call("MyScene");
	});
			
    canvas.Scene.New({
	  name: "MyScene", // Obligatory
	  materials: {
		images: {
			img_id: "path/to/img.png"
		}
	  },
      called: function(stage) {

      },
	  preload: function(stage, pourcent, material) {
	
	  },
	  ready: function(stage, params) {
		
	  },
	  render: function(stage) {
		
	  },
	  exit: function(stage) {
	
	  }
    });

The `materials` property loads images, sounds, videos, etc.. See [Materials.load()](http://canvasengine.net/doc/?p=core.materials.load) for more details

The scene is composed of several methods. All methods are optional.

* `called` : `(>=1.3.2)` Method called when the scene is called. The images are not loaded. It is impossible to use methods such as `drawImage` an element
* `preload` : Method called at each resource loaded  in the `materials` property
* `ready`: Method called when resources are loaded. To use custom parameters :

        canvas.Scene.call("MyScene", {
			params : "foo"
		});

    and in `ready` method :
    
        ready: function(stage, params) {
		    console.log(params); // displays foo
	    }
        

* `render` : Method called at each render (60 FPS, defined by `requestAnimationFrame()`. Unchangeable)
* `exit` :Method called when this scene is quitted (or another scene is called)

To call the scene:

    canvas.Scene.call("MyScene");

The name of the scene is set in the `name` parameter. See [Scene.call()](http://canvasengine.net/doc/?p=core.scene.call) for more details

The `stage` parameter is the main element. Child elements will be added to the `stage` element

## Quick Example ##

<jsfiddle>WebCreative5/4hySx</jsfiddle>

