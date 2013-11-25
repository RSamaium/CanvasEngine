/*
Copyright (C) 2012 by WebCreative5, Samuel Ronce

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
@doc window
@class Window Displays a dialog box
@param {CanvasEngine.Scene} scene Current scene
@param {Integer} width Width
@param {Integer} height Height
@param {String} border (optional) Identifier of the image to the border. The image must contain the four corners and four sides to have 9 tiles. The width and height should be divisible by three
@example

	canvas.Scene.New({
		name: "MyScene",

		materials: {
			images: {
				"border": "images/window.png"
			}
		},
		
		ready: function(stage) {
			var box;
			this.window = canvas.Window.new(this, 230, 200, "border");
		   
			box =  this.window.getBox();
			box.x = 50;
			box.y = 50;
			
			this.window.open(stage);
	
		}
	});
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
		if (border) {
			this.border_img = Global_CE.Materials.get(border);
			this._construct();
		}
		else {
			this.el = this.scene.createElement(this.width, this.height);
			this._content = this.scene.createElement();
			this.el.append(this._content);
		}
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
    
/**
	@doc window/
	@method size Change the size of the window and rehabilitates borders depending on the size
	@param {Integer} width Width
	@param {Integer} height Height
	@return {CanvasEngine.Window}
*/
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

/**
@doc window/
@method position Sets position to the window. If no parameter is assigned, the method returns the current position of the element in an object : {x: , y:}
@param {String|Integer} x (optional) Position X. If the parameter is a string, the window is positioned at a specific location :

* middle : The window is centered
* bottom : The position of window is in bottom with 3% margin
* top : The position of window is in top with 3% margin
* bottom-X : The position of window is in bottom with X margin (px) (eq: "bottom-20")
* top+X : The position of window is in top with X margin (px) (eq: "top+20")

@param {Integer} y (optional) Position Y
@example

In `ready` method

	var _window = canvas.Window.new(this, 230, 200, "border");
		   
	_window.position(50, 100);
	_window.position(); // returns {x: 50, y: 100}
	_window.position("middle"); // Center of the window
	
	_window.open(stage);

@return {CanvasEngine.Window}
*/	
    position: function(typeOrX, y) {
        var canvas = this.scene.getCanvas(), margin;
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
			else if (typeOrX == "bottom") {
                this.el.x = canvas.width / 2 - this.width / 2;
                this.el.y = canvas.height - this.height - (canvas.height * 0.03);
            }
			else if (typeOrX == "top") {
                this.el.x = canvas.width / 2 - this.width / 2;
                this.el.y = canvas.height * 0.03;
            }
			else if (margin = typeOrX.match(/top+([0-9]+)/)) {
				this.el.x = canvas.width / 2 - this.width / 2;
                this.el.y = margin[1];
			}
			else if (margin = typeOrX.match(/bottom-([0-9]+)/)) {
				this.el.x = canvas.width / 2 - this.width / 2;
                this.el.y = canvas.height - margin[1];
			}
        }
        else {
            this.el.x = typeOrX;
            this.el.y = y;
        }
        return this;
    },
    
/**
@doc window/
@method setBackground Sets the color and opacity of the background
@param {String} color Background color in hexadecimal
@param {Integer} padding (optional) Inner margin below border (0 by default)
@param {Integer} opacity (optional) Opacity (1 by default)
@example

In `ready` method

	var _window = canvas.Window.new(this, 230, 200, "border");
		   
	_window.setBackground("#ff0000", 10, .5);
	
	_window.open(stage);

@return {CanvasEngine.Window}
*/	
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
    
/**
	@doc window/
	@method getBox Get the element representing the entire window
	@return {CanvasEngine.Element}
*/	
    getBox: function() {
        return this.el;    
    },
    
/**
	@doc window/
	@method getContent Retrieves the element representing the content (the center)
	@return {CanvasEngine.Element}
*/	
    getContent: function() {
        return this._content;
    },
    
/**
	@doc window/
	@method open Adds the dialog on a parent element and displays the window on the screen
	@param {CanvasEngine.Element} parent Parent element
	@return {CanvasEngine.Window}
*/
    open: function(parent) {
        parent.append(this.el);
		return this;
    },

/**
	@doc window/
	@method remove `(>= 1.3.0)` Removes the window
	@return {CanvasEngine.Window}
*/
	remove: function() {
		this.el.remove();
		return this;
	},
	
/**
@doc cursor
@class cursor Adds the cursor in the window
@example

	var canvas = CE.defines("canvas_id").
	extend([Animation, Spritesheet, Window]).
	ready(function() {
		canvas.Scene.call("MyScene");
	});

	canvas.Scene.new({
		name: "MyScene",
		materials: {
			images: {
				img_id: "border_window.png"
			}
		},
		ready: function(stage) {
		   var box = canvas.Window.new(this, 500, 300, "img_id"),
			el, array_el, text;
			
			var array  = ["Text1", "Text2", "Text3"];
			
			for (var i=0 ; i < array.length ; i++) {
				el = this.createElement(480, 35);
				el.y = i * 35;
				el.attr('index', i);
				text = canvas.Text.new(this, array[i]); // Text extend
				text.style({
					size: "18px",
					color: "white"
				}).draw(el, 0, 10);
				array_el.push(el);
				box.getContent().append(el);
			}
		
			var cursor = this.createElement();
			cursor.fillStyle = "#7778AA";
			cursor.fillRect(-10, -10, 480, 30);
			cursor.opacity = .5;
		
			box.cursor.init(cursor, array_el);
			
			box.cursor.select(function(el) {
				console.log(el.attr('index'));
			});
			
			box.cursor.change(function(el) {
				
			});
		
			box.open(this.stage);
			this.stage.append(cursor);
			
			box.cursor.setIndex(0);
			box.cursor.enable(true);
		}
	});

*/
	cursor: {
	
		array_elements: null,
		el: null,
		index: 0,
		params: {},
		_enable: true,
	
/**
@doc cursor/
@method init Initializes functionality cursors.
@param {CanvasEngine.Element} element (optional) Element corresponding to the cursor
@param {Array} array_elements Array containing all the elements that can be selected by the cursor
@param {Object} params (optional) Additional parameters for the cursor

* reverse (Boolean) When the cursor reaches an extreme, it goes through the extreme opposite

@return {CanvasEngine.Window.Cursor}
*/
		init: function(element, array_elements, params) {
			if (element instanceof Array) {
				array_elements = element;
				element = null;
			}
			this.params = CanvasEngine.extend(this.params, params);
			this.array_elements = array_elements;
			this.el = element;
			this.update();
			return this;
		},
	
/**
@doc cursor/
@method refresh Refreshes the table containing the items that can be selected. Updated visual cursor
@param {Array} array_elements Array containing all the elements that can be selected by the cursor
@param {Boolean} change (optional) Calls the callback method assigned with the "change"
@return {CanvasEngine.Window.Cursor}
*/	
		refresh: function(array_elements, change) {
			this.array_elements = array_elements;
			this.setIndex(this.index, change);
			this.update();
			return this;
		},
		
/**
@doc cursor/
@method remove Removes the cursor visually
@param {Array} array_elements Array containing all the elements that can be selected by the cursor
@param {Boolean} change (optional) Calls the callback method assigned with the "change"
@return {CanvasEngine.Window.Cursor}
*/	
		remove: function() {
			this.el.remove();
			return this;
		},

/**
@doc cursor/
@method assignKeys Assigns keyboard events : Up, Bottom and Enter. Also assigns the click on elements for touch and mouse. Elements must, in this case, have values set for the width and height attributesr
@param {Boolean} reset (optional) Resets all keys
@return {CanvasEngine.Window.Cursor}
*/			
		assignKeys: function(reset) {
			var self = this;
			if (reset) {
				Global_CE.Input.reset();
			}
			Global_CE.Input.press([Input.Up], function() {
				if (!self._enable) {
					return;
				}
				self.setIndex(self.index-1);
			});
			Global_CE.Input.press([Input.Bottom], function() {
				if (!self._enable) {
					return;
				}
				self.setIndex(self.index+1);
			});
			
			
			function enter() {
				if (!self._enable) {
					return;
				}
				var el = self.array_elements[self.index];
				if (self._select && el) self._select.call(self, el);
			}
			
			Global_CE.Input.press(this.params.enter, enter);
			
			function assignTap(index) {
				var el = this.array_elements[index];
				
				if (el.width && el.height && this._enable) {
					el.forceEvent();
					el.on("touch", function() {
						self.setIndex(index);
						self.update();
						enter();
					});
				}
			}
			for (var i=0 ; i < this.array_elements.length ; i++) {
				assignTap.call(this, i);
			}
			return this;
		},
		
/**
@doc cursor/
@method getCurrentElement Fetches the current element where the cursor is positioned
@return {CanvasEngine.Element}
*/	
		getCurrentElement: function() {
			return this.array_elements[this.index];
		},
	
/**
@doc cursor/
@method setIndex Sets the index of the cursor on an element. The index starts at 0. The cursor is updated visually
@param {Integer} index new index of cursor
@param {Boolean} change (optional) Calls the callback method assigned with the "change"
@return {CanvasEngine.Window.Cursor}
*/		
		setIndex: function(index, change) {
			var h = this.array_elements.length;
			if (index < 0) {
				index = this.params.reverse ? h-1 : 0;
			}
			else if (index >= h) {
				index = this.params.reverse ? 0 : h-1;
			}
			this.index = index;
			this.update(true);
			return true;
		},
	
/**
@doc cursor/
@method update The cursor is updated visually. If there is any item, the cursor is hidden
@param {Boolean} change (optional) Calls the callback method assigned with the `change`
@return {CanvasEngine.Window.Cursor}
*/	
		update: function(call_onchange) {
			if (this.el) {
				if (this.array_elements.length == 0) {
					this.el.hide();
					return;
				}
				else {
					this.el.show();
				}
			}
			var el = this.getCurrentElement(),
				pos;
			if (el) {
				pos = el.position();
				if (this.el) {
					this.el.x = pos.left;
					this.el.y = pos.top;
				}
				if (call_onchange && this._onchange && this.array_elements.length > 0) this._onchange.call(this, el);
			}	
		},
		
/**
@doc cursor/
@method enable Active cursor or not. If it is off, pressing Up, Bottom and Enter are reset. If it is enabled, the method `assignKeys` is called
@param {Boolean} enable (optional) Enable or disable the cursor. If no value, the current `enable` value is sent
@return {Boolean}
*/	
		enable: function(enable) {
			if (enable != undefined) {
				this._enable = enable;
				if (enable) {
					this.assignKeys();
				}
				else {
					Global_CE.Input.reset([Input.Enter, Input.Up, Input.bottom]);
				}
			}
			return this._enable;
		},

/**
@doc cursor/
@method change Assigns a callback function when the cursor changes element
@param {Function} callback Callback
@return {CanvasEngine.Window.Cursor}
*/			
		change: function(_onchange) {
			this._onchange = _onchange;
			return this;
		},

/**
@doc cursor/
@method select Assigns a callback when the element is selected (Enter key pressed)
@param {Function} callback Callback
@return {CanvasEngine.Window.Cursor}
*/			
		select: function(_select) {
			this._select = _select;
			return this;
		}
	
	}
}); 
    
var Window = {
    Window: {
		New: function() { return this["new"].apply(this, arguments); },
        "new": function(scene, width, height, border) {
            return Class["new"]("Window", [scene, width, height, border]);
        }
    }
};