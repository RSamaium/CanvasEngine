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
	_content: null,
	_borders: {},
	_border_size: {
		width: 0,
		height: 0
	},
	initialize: function(scene, width, height, border) {
		this.width = width;
		this.height = height;
		this.border = border;
		this.scene = scene;
		this.border_img = Global_CE.Materials.get(border);
		this._construct();
	},
	_construct: function() {
		if (!Global_CE.Spritesheet) {
			throw "Add Spritesheet class to use windows";
		}
		var borders = ["corner_upleft", "up", "corner_upright", "left", "center", "right", "corner_bottomleft", "bottom", "corner_bottomright"],
			el, b;
		this.el = this.scene.createElement(this.width, this.height);
		this._border_size.width = this.border_img.width / 3;
		this._border_size.height = this.border_img.height / 3;
		this.spritesheet = Global_CE.Spritesheet['new'](this.border, {
		  grid: [{
			size: [3, 3],
			tile: [this._border_size.width, this._border_size.height],
			set: borders
		  }]
		});
		this._content = this.scene.createElement();
		for (var i=0 ; i < borders.length ; i++) {
			b = borders[i];
			el = this._borders[b] = this.scene.createElement();
			if (/^corner/.test(b)) {
				this.spritesheet.draw(el, b);
			}
			else {
				this.spritesheet.pattern(el, b);
			}
			this.el.append(el);
		}
		this._borders["center"].zIndex(0);
		this.el.append(this._content);
		this.size(this.width, this.height);
	},
	
	size: function(width, height) {
		var bw = this._border_size.width,
			bh = this._border_size.height;
			
		function unsigned(cal) {
			return (cal < 0 ? 0 : cal);
		}
		

		// corner_upleft
			// x = 0, y = 0 by default
		// up
		this._borders["up"].x = bw-1;
		this._borders["up"].fillRect(0, 0, width+1 - bw*2 , bh);
		// corner_upright
		this._borders["corner_upright"].x = width - bw;
		// left
		this._borders["left"].y = bh;
		this._borders["left"].fillRect(0, 0, bw, unsigned(height - bh*2));
		// right
		this._borders["right"].x = width - bw;
		this._borders["right"].y = bh;
		this._borders["right"].fillRect(0, 0, bw, unsigned(height - bh*2));
		// corner_bottomleft
		this._borders["corner_bottomleft"].y = height - bh;
		// bottom
		this._borders["bottom"].x = bw-1;
		this._borders["bottom"].y = height - bh;
		this._borders["bottom"].fillRect(0, 0, unsigned(width+1 - bw*2), bh);
		// corner_bottomright
		this._borders["corner_bottomright"].x = width - bw;
		this._borders["corner_bottomright"].y = height - bh;
		// center
		this._borders["center"].x = this._content.x = bw-1;
		this._borders["center"].y = this._content.y = bh;
		this._borders["center"].fillRect(0, 0, unsigned(width+3 - bw*2), unsigned(height - bh*2));
		this.el.width = width;
		this.el.height = height;
		this.el.setOriginPoint("middle");
		return this;
	},
	
	position: function(typeOrX, y) {
		var canvas = this.scene.getCanvas();
		if (typeOrX === undefined) {
			return {
				x: this.el.x,
				y: this.el.y
			};
		}
		if (y === undefined) {
			if (typeOrX == "middle") {
				this.el.x = canvas.width / 2 - this.width / 2;
				this.el.y = canvas.height / 2 - this.height / 2;
			}
		}
		else {
			this.el.x = typeOrX;
			this.el.y = y;
		}
		return this;
	},
	
	setBackground: function(color, padding, opacity) {
		var background;
		if (!padding) padding = 0;
		opacity = opacity || 1;
		background = this._borders["center"];
		background.x = padding;
		background.y = padding;
		background.fillStyle = color;
		background.opacity = opacity;
		background.fillRect(0, 0, this.width - padding*2, this.height - padding*2);
		return this;
	},
	
	getBox: function() {
		return this.el;	
	},
	
	getContent: function() {
		return this._content;
	},
	
	open: function(parent) {
		parent.append(this.el);
	}
}); 
	
var Window = {
	Window: {
		"new": function(scene, width, height, border) {
			return Class["new"]("Window", [scene, width, height, border]);
		}
	}
};

 