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

/**

 Spritesheet.new("img", {
 
	grid: [{
		size: [4, 5],
		tile: [107, 107],
		set: ["play", "player_hover", "zoom_p", "zoom_m"]
	}],
	btn_play: [433, 33, 215, 188]
 
 });

*/

Class.create("Spritesheet", {
	image: null,
	_set: {},
	initialize: function(image, set) {
		this.image = image;
		if (set) this.set(set);
	},
	set: function(set) {
		var gridset, gridname, x, y, grid_w, grid_h;
		for (var id in set) {
			if (id == "grid") {
				for (var i=0 ; i < set.grid.length ; i++) {
					for (var j=0 ; j < set.grid[i].set.length ; j++) {
						gridname = set.grid[i].set[j];
						gridset = set.grid[i];
						
						y = gridset.tile[1] * parseInt(j / Math.round(gridset.size[1]-1));
						x = gridset.tile[0] * (j % Math.round(gridset.size[0]));
							
						this._set[gridname] = [x, y, gridset.tile[0], gridset.tile[1]];
					}
				}
			}
			else {
				this._set[id] = set[id];
			}
		}
	},
	draw: function(el, id, dest) {
		dest = dest || {};
		var tile =  this._set[id];
		if (!tile) {
			throw "Spritesheet " + id + " don't exist";
			return;
		}
		var dest_x = dest.x || "0",
			dest_y = dest.y || "0",
			dest_w = dest.w || tile[2],
			dest_h = dest.h || tile[3];
		
		el.drawImage(this.image, tile[0], tile[1], tile[2], tile[3], +dest_x, +dest_y, dest_w, dest_h);
	}				
});

var Spritesheet = {
	Spritesheet: {
		new: function(image, set) {
			return Class.new("Spritesheet", [image, set]);
		}
	}
};

