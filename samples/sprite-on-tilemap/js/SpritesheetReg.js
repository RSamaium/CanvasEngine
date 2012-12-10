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



Class.create("SpritesheetReg", {
	image: null,
	_set: {},
	initialize: function(image, set) {
		this.image = image;
		if (set) this.set(set);
	},
	/**
		@doc spritesheet/
		@method set Assigns an identifier to an area of the spritesheet. A grid can be defined to be faster.
		@param {Object} set : If the key is called "grid", the image is cut from a grid. Set the grid with
			- size: [Line number, column number]
			- tile : [Width of the box, Height of the box]
			- set : Each identifier in array starting from the firt case in top left of the grid
		If the key is not "grid", we assign a zone identifier: [x, y, width, height]
		@example :
			<code>
			var spritesheet = canvas.SpritesheetReg.new("my_spritesheet");
			spritesheet.set({
				grid: [{
					size: [4, 5],
					tile: [107, 107],
					set: ["play", "player_hover", "zoom_p", "zoom_m"]
				}],
				btn_play: [433, 33, 215, 188]
			});
			</code>
		Here, there is a grid of rows and 5 columns of 107px width and height. The first box is called "play". We have another area placed at positions (433, 33), width is 215px and height is 188px. The ID of this area is "btn_play"
	*/
	set: function(set) {
		var gridset, gridname, x, y;
		for (var id in set) {
			if (id === "grid") {
				for (var i=0 ; i < set.grid.length ; i++) {
					for (var j=0 ; j < set.grid[i].set.length ; j++) {
						gridname = set.grid[i].set[j];
						gridset = set.grid[i];
						
						y = gridset.tile[1] * parseInt(j / Math.round(gridset.size[1]), 10);
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
	/**
		@doc spritesheet/
		@method draw Draw a Sprite on the element
		@param {CanvasEngine.Element} el
		@param {String} id Sprite identifier defined with the method "set" (or the constructor)
		@param {Object} (optional) dest Positions and dimensions of the final destination :
			- x {Integer} Position X
			- y {Integer} Position Y
			- w {Integer} Width
			- h {Integer} Height
		Equivalent to
			<code>
				el.drawImage(--, --, --, --, --, x, y, w, h);
			</code>
	*/
	draw: function(el, id, dest) {
		dest = dest || {};
		var tile =  this._set[id];
		if (!tile) {
			throw "SpritesheetReg " + id + " don't exist";
		}
		var dest_x = +(dest.x || "0")-tile[5],
			dest_y = +(dest.y || "0")-tile[6],
			dest_w = dest.w || tile[2],
			dest_h = dest.h || tile[3];
		
		el.drawImage(this.image, tile[0], tile[1], tile[2], tile[3], dest_x, dest_y, dest_w, dest_h);
	},

	/**
		@doc spritesheet/
		@method pattern Repeat an image of SpriteSheet. Do not forget to draw the pattern with "fillRect" or "fill"
		@param {CanvasEngine.Element} el
		@param {String} id Sprite identifier defined with the method "set" (or the constructor)
		@param {String} (optional) repeatOption Type of repetition (repeat (default), no-repeat, repeat-x, repeat-y)
		@example
			In "ready" method of the current scene :
			<code>
				var spritesheet = canvas.SpritesheetReg.new("my_spritesheet"),
					el = this.createElement();
				spritesheet.set({
					grid: [{
						size: [3, 1],
						tile: [32, 32],
						set: ["border", "foo", "bar"]
					}]
				});
				spritesheet.pattern(el, "border");
				el.fillRect(0, 0, 300, 32);
				stage.append(el);
			</code>
	*/
	pattern: function(el, id, repeatOption) {
		var tile =  this._set[id],
			img = Global_CE.Materials.cropImage(this.image, tile[0], tile[1], tile[2], tile[3]),
			pattern = el.getScene().getCanvas().createPattern(img, repeatOption);
		el.fillStyle = pattern;
	}
});

/**
	@doc spritesheet
	@class SpritesheetReg SpritesheetReg is a Sprites collection in an image. This class aims to crop the image, retrieve each Sprite by assigning an identifier
	@param {String} image ID image
	@param {Object} params See the method "set"
	@example
	
	<code>
	var canvas = CE.defines("canvas_id").
		extend(SpritesheetReg).
		ready(function() {
			canvas.Scene.call("MyScene");
		});
			
		canvas.Scene.new({
			name: "MyScene",
			materials: {
				images: {
					my_spritesheet: "path/to/spritesheet.png"
				}
			},
			ready: function(stage) {
				 var el = this.createElement();
				 var spritesheet = canvas.SpritesheetReg.new("my_spritesheet", {
 
					grid: [{
						size: [4, 5],
						tile: [107, 107],
						set: ["play", "player_hover", "zoom_p", "zoom_m"]
					}],
					btn_play: [433, 33, 215, 188]
				 
				 });
				 spritesheet.draw("play", el);
				 stage.append(el);
			}
		});
		</code>
*/
var SpritesheetReg = {
	SpritesheetReg: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(image, set) {
			return Class["new"]("SpritesheetReg", [image, set]);
		}
	}
};

