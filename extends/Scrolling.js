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
	initialize: function(scene, tile_h, tile_w) {
		this.scene = scene;
		this.tile_h = tile_h;
		this.tile_w = tile_w;
	},
	setMainElement: function(main_el) {
		this.main_el = main_el;
	},
	/**
		{
			element: 
			speed:
			block:
			width:
			height:
		}
	
	*/
	addScroll: function(scroll_el) {
		if (!scroll_el.screen_x) scroll_el.screen_x = 0;
		if (!scroll_el.screen_y) scroll_el.screen_y = 0;
		if (!scroll_el.parallax_x) scroll_el.parallax_x = 0;
		if (!scroll_el.parallax_y) scroll_el.parallax_y = 0;
		this.scroll_el.push(scroll_el);
		return this.scroll_el[this.scroll_el.length-1];
	},
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
	update: function() {
		var scroll, container;
		var canvas = this.scene.getCanvas();
		
		if (!this.main_el) {
			return;
		}
		
		for (var i=0 ;  i < this.scroll_el.length ; i++) {

			scroll = this.scroll_el[i];
			container = {x: scroll.element.x, y: scroll.element.y};
			
			scroll.screen_x = this.main_el.x - canvas.width/2 + (canvas.width/2 % this.tile_w);
			scroll.screen_y = this.main_el.y - canvas.height/2 + (canvas.height/2 % this.tile_h);
			
			container.y -= Math.abs(container.y) == scroll.screen_y ? 0 : Math.floor((scroll.screen_y < Math.abs(container.y) ? -this.tile_h : this.tile_h) / scroll.speed);

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
				scroll.element.x = container.x;
			}
			
			if (canvas.height <= scroll.height) {
				scroll.element.y = container.y;
			}
			
		}
	}
});

var Scrolling = {
	Scrolling: {
		new: function(scene, tile_h, tile_w) {
			return Class.new("Scrolling", [scene, tile_h, tile_w]);
		}
	}
};

