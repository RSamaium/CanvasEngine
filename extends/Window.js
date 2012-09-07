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

Class.create("Window", {
	border: null,
	width: 0,
	height: 0,
	bitmap: null,
	el: null,
	initialize: function(scene, width, height, border) {
		this.width = width;
		this.height = height;
		this.border = border;
		this.scene = scene;
		this.border_img = canvas.Materials.get(border);
		this._construct();
	},
	_construct: function() {
		if (!canvas.Spritesheet) {
			throw "Add Spritesheet class to use windows";
			return;
		}
		this.el = this.scene.createElement(this.width, this.height);
		this.spritesheet = canvas.Spritesheet.new(this.border, {
		  grid: [{
			size: [3, 3],
			tile: [this.border_img.width / 3, this.border_img.height / 3],
			set: ["corner_upleft", "up", "corner_upright", "left", "center", "right", "corner_bottomleft", "bottom", "corner_bottomright"]
		  }]
		});
		this.spritesheet.draw(this.el, "corner_upleft");
	},
	open: function(parent) {
		parent.append(this.el);
	}
}); 
	
var Window = {
	Window: {
		new: function(scene, width, height, border) {
			return Class.new("Window", [scene, width, height, border]);
		}
	}
};

 