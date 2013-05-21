# MultiTouch with Hammer.js #

HammerJS is a javascript library for multi-touch gestures : http://eightmedia.github.com/hammer.js

It has been implemented in CanvasEngine for a greater experience of touchpads and smartphones

The use is very simple, you must use the method `on` an element

    var el = this.createElement();
    el.fillStyle = "red";
    el.fillRect(0, 0, 100, 100);
    
    el.on("drag", function(e, mouse) {
        console.log("is drag");
    });

Of course, this code is in the `ready` method of scene. Here, when the element is moved with the mouse, the callback function is called

Here are all the possibilities : 

* hold
* tap
* doubletap
* drag, dragstart, dragend, dragup, dragdown, dragleft, dragright
* swipe, swipeup, swipedown, swipeleft, swiperight
* transform, transformstart, transformend
* rotate
* pinch, pinchin, pinchout
* touch (gesture detection starts)
* release (gesture detection ends)

> Notice that `touch` is equivalent to the `click` event

See [https://github.com/EightMedia/hammer.js/wiki/Getting-Started](https://github.com/EightMedia/hammer.js/wiki/Getting-Started)

## Full example ##

    var canvas = CE.defines("canvas_id").
		ready(function() {
			canvas.Scene.call("MyScene");
		});
				
	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {

			var el = this.createElement();
			el.fillStyle = "red";
			el.fillRect(0, 0, 100, 100);
			
			el.on("dragright", function(e, mouse) {
				this.x = e.gesture.deltaX;
				this.y = e.gesture.deltaY;
			});
			
			stage.append(el);
		}
	});