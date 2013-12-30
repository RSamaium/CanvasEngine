/*
Copyright (C) 2012 by Samuel Ronce

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

Class.create("Scrolling", {
	main_el: null,
	scroll_el: [],
	scene: null,
	freeze: false,
	initialize: function(scene, tile_h, tile_w) {
		this.scene = scene;
		this.tile_h = tile_h;
		this.tile_w = tile_w;
	},
	 /**
		@doc scrolling/
		@method setMainElement Defined the main element that will set the scrolling
		@params {CanvasEngine.Element} main_el
	 */
	setMainElement: function(main_el) {
		this.main_el = main_el;
	},
/**
@doc scrolling/
@method addScroll Add a layer scroll as the main element
@params {Object} params Parameters :

* element {CanvasEngine.Element}
* speed {Integer} Scrolling speed
* block {Boolean} (optional) Block scrolling on the edges of the map
* width {Integer} Width of element
* height {Integer} Height of element

@return {Object}
*/
	addScroll: function(scroll_el) {
		if (!scroll_el.screen_x) scroll_el.screen_x = 0;
		if (!scroll_el.screen_y) scroll_el.screen_y = 0;
		if (!scroll_el.parallax_x) scroll_el.parallax_x = 0;
		if (!scroll_el.parallax_y) scroll_el.parallax_y = 0;
		this.scroll_el.push(scroll_el);
		if (this.main_el) this.setScreen(scroll_el);
		return this.scroll_el[this.scroll_el.length-1];
	},
	/**
		@doc scrolling/
		@method setScreen Center the camera on the X and Y positions assigned
		@params {Object} scroll Scrolling settings. Identical to "addScroll" method
		@params {Integer} x Position X (pixels)
		@params {Integer} y Position Y (pixels)
	 */
	setScreen: function(scroll, real_x, real_y) {
		var width, height;
		if (!real_x && this.main_el) {
			real_x = this.main_el.x;
			real_y = this.main_el.y;
		}
		var canvas = this.scene.getCanvas();
		if (real_x <= canvas.width/2) {
			width = 0;
		}
		else if (real_x + canvas.width/2 >= scroll.width) {
			width = -(scroll.width - canvas.width);
		}
		else {
			width = -(real_x - canvas.width/2 + (canvas.width/2 % this.tile_w));
		}

		if (real_y <= canvas.height/2) {
			height = 0;
		}
		else if (real_y + canvas.height/2 >= scroll.height) {
			height = -(scroll.height - canvas.height);
		}
		else {
			height = -(real_y - canvas.height/2 + (canvas.height/2 % this.tile_h));
		}

		scroll.element.x = width;
		scroll.element.y = height;

		var multiple_w = this.tile_w / scroll.speed;
		var multiple_h = this.tile_h / scroll.speed;
		scroll.element.x = Math.floor(scroll.element.x/multiple_w) * multiple_w ; 
		scroll.element.y = Math.floor(scroll.element.y/multiple_h) * multiple_h;

		scroll.screen_x = Math.abs(scroll.element.x);
		scroll.screen_y = Math.abs(scroll.element.y);
		
		var m = this._multipleScreen(scroll.speed, scroll.screen_x, scroll.screen_y);
		scroll.screen_x = m.x;
		scroll.screen_y = m.y;
		this.update();
	},
	
	_multipleScreen: function(speed, x, y) {
		var multiple_w = this.tile_w / speed;
		var multiple_h = this.tile_h / speed;

		x = Math.floor(x/multiple_w) * multiple_w ; 
		y = Math.floor(y/multiple_h) * multiple_h;

		return {x: x, y: y};
	},
	/**
		@doc scrolling/
		@method update Update scrolling. A call loop
	*/
	update: function() {

		var scroll, container;
		var canvas = this.scene.getCanvas();
		
		if (this.freeze) {
			return;
		}
		
		if (!this.main_el) {
			return;
		}
		
		for (var i=0 ;  i < this.scroll_el.length ; i++) {

			scroll = this.scroll_el[i];
			container = {x: scroll.element.x, y: scroll.element.y};
			
			scroll.screen_x = this.main_el.x - canvas.width/2 + (canvas.width/2 % this.tile_w);
			scroll.screen_y = this.main_el.y - canvas.height/2 + (canvas.height/2 % this.tile_h);
			
			//container.y -= Math.abs(container.y) == scroll.screen_y ? 0 : Math.floor((scroll.screen_y < Math.abs(container.y) ? -this.tile_h : this.tile_h) / scroll.speed);

			var absx = Math.abs(container.x);
			var absy = Math.abs(container.y);
			var speed_x = scroll.speed;
			var speed_y = scroll.speed;
			
			if (scroll.parallax) {
				if (scroll.screen_x != scroll.parallax_x) {
					if (scroll.screen_x > scroll.parallax_x) {
						container.x -= speed_x;
					}
					else {
						container.x += speed_x;
					}
					scroll.parallax_x = scroll.screen_x;
				}
				if (scroll.screen_y != scroll.parallax_y) {
					if (scroll.screen_y > scroll.parallax_y) {
						container.y -= speed_y;
					}
					else {
						container.y += speed_y;
					}
					scroll.parallax_y = scroll.screen_y;
				}
			}
			else {
				if (absx != scroll.screen_x) {
				

					if (scroll.screen_x > absx) {
						if (absx > scroll.screen_x - speed_x) {
							container.x = -scroll.screen_x;
						}
						else {
							container.x -= speed_x;
						}
					}
					else if (scroll.screen_x < absx) {
						if (absx < scroll.screen_x + speed_x) {
							container.x = -scroll.screen_x;
						}
						else {
							container.x += speed_x;
						}
					}
				
			}
			if (absy != scroll.screen_y) {
					if (scroll.screen_y > absy) {
						if (absy > scroll.screen_y - speed_y) {
							container.y = -scroll.screen_y;
						}
						else {
							container.y -= speed_y;
						}
					}
					else if (scroll.screen_y < absy) {
						if (absy < scroll.screen_y + speed_y) {
							container.y = -scroll.screen_y;
						}
						else {
							container.y += speed_y;
						}
					}
				
				}
			}
			

			if (scroll.block) {
				if (container.x > 0) {
					scroll.screen_x = container.x = 0;
				}
				else if (container.x + scroll.width < canvas.width) {
					container.x = canvas.width - scroll.width;
					container.x = this._multipleScreen(scroll.speed, container.x, 0).x;
					scroll.screen_x = Math.abs(container.x);
				}
				if (container.y > 0) {
					scroll.screen_y = container.y = 0;
				}
				else if (container.y + scroll.height < canvas.height) {
					container.y = canvas.height - scroll.height;
					container.y = this._multipleScreen(scroll.speed, 0, container.y).y;
					scroll.screen_y = Math.abs(container.y);
				}
			}
			
			if (canvas.width <= scroll.width) {
				scroll.element.x = container.x >> 0;
			}
			
			if (canvas.height <= scroll.height) {
				scroll.element.y = container.y >> 0;
			}
			
		}
	},

/**
@doc scrolling/
@method mouseScroll Performs the scrolling with the mouse.
@param {CanvasEngine.Element} clip Element containing the main element in the second parameter of this method. Indicate the dimensions of the element
@param {CanvasEngine.Element} content Element with the content to scroll. Indicate the dimensions of the element
@param {Object} callbacks (optinal) Different callbacks

* dragstart : When the user starts to scroll
* drag : When the user scrolls 
* onTop : When the scroller reaches the top of the element
* onBottom : When the scroller reaches the bottom of the element

return {CanvasEngine.Scrolling}
@example

In method `ready`

	var clip = this.createElement(300, 350), // Dimensions of the element
		content = this.createElement(300, 800); // Dimensions of the element
		
	var scroll = canvas.Scrolling.New(this);
	scroll.mouseScroll(clip, content);
	
	stage.append(clip);

*/
	mouseScroll: function(clip, content, callbacks) {
	
		callbacks = callbacks || {};
		
		if (content.height < clip.height) {
			clip.append(content);
			return this;
		}
	
		var  scroll_start = {};
		var self = this;
		
		content._forceEvent = true;
	
		clip.beginPath();
		clip.rect(0, 0, clip.width, clip.height);
		clip.clip();
		clip.closePath();
		
		content.rect(0, 0, content.width, content.height);

		 content.on("dragstart", function(ev) {
            scroll_start = this.offset();
            scroll_start.time = new Date().getTime();
			if (callbacks.dragstart) callbacks.dragstart.call(this, ev);
         });


         content.on("drag", function(ev) {
            if(ev.direction == 'up' || ev.direction == 'left') {
                ev.distance = -ev.distance;
            }

            var delta = 1, y;
            y = scroll_start.top + ev.distance * delta;
			
			if (y >= 0) {
                y = 0;
				if (callbacks.onTop) callbacks.onTop.call(this, ev);
            }
            else if (clip.height >= (y + this.height)) {
                y = -this.height + clip.height;
				if (callbacks.onBottom) callbacks.onBottom.call(this, ev);
            } 
			
			this.y = y;
			
			if (callbacks.drag) callbacks.drag.call(this, ev);
        });


        content.on("dragend", function(ev) {
            if (callbacks.dragend) callbacks.dragend.call(this, ev);
        });
		
		clip.append(content);
		
		return this;
		
	}
});

/**
@doc scrolling
@class Scrolling A side-scrolling game or side-scroller is a video game in which the gameplay action is viewed from a side-view camera angle, and the onscreen characters generally move from the left side of the screen to the right

http://en.wikipedia.org/wiki/Side-scrolling_video_game

@param {CanvasEngine.Scene} scene
@param {Integer} tile_h Height of the tile
@param {Integer} tile_w width of the tile
@example

	var canvas = CE.defines("canvas_id").
		extend(Scrolling).
		ready(function() {
			canvas.Scene.call("MyScene");
		});
		
	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			this.scrolling = canvas.Scrolling.new(this, 32, 32);
			
			var player = this.createElement();
			this.scrolling.setMainElement(player);

			var map = this.createElement();
			this.scrolling.addScroll({
			   element: map, 
			   speed: 3,
			   block: true,
			   width: 120,
			   height: 50
			});
		},
		render: function(stage) {
			this.scrolling.update();
			stage.refresh();
		}
	});

*/
var Scrolling = {
	Scrolling: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(scene, tile_h, tile_w) {
			return Class["new"]("Scrolling", [scene, tile_h, tile_w]);
		}
	}
};

