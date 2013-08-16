/*
Copyright (C) 2013 by Samuel Ronce

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

Class.create("Text", {
	scene: null,
	text: "",
	el: null,
	_family: null,
	_style: {
		"size": "20px",
		"family": "Arial",
		"weight": "normal",
		"style": "normal",
		"variant": "normal",
		"color": "#000",
		"transform": "none",
		"decoration": "none",
		"border": "none",
		"lineHeight": 25,
		"shadow": null,
		"textBaseline": "alphabetic",
		"lineWidth": null
	},
	lines: [],
	
	initialize: function(scene, text) {
		this.scene = scene;
		this.construct(text);
	},
	
	construct: function(text) {
		text = ""+text;
		this.el = this.scene.createElement();
		text = this._transformHTML(text);
		this.text = text.split("\n");
		this.lines = [];
	},
	
	_transformHTML: function(text) {
		text = text.replace(/<br>/g, "\n");
		return text;
	},
	
	setImageText: function(img_id, letters, size, rowsAndCols) {
		 var el = this.scene.createElement();
		
		if (!Global_CE.Spritesheet) {
            throw "Add Spritesheet class to use setImageText method";
        }
		
		rowsAndCols = rowsAndCols || {rows: 1, cols: 1};
		 
		 
		 var spritesheet = Global_CE.Spritesheet.New(img_id, {

			grid: [{
				size: rowsAndCols,
				tile: [size.width, size.height],
				set: letters
			}]
		 
		 });
		 this._family = spritesheet;
},
	
/**
@doc text/
@method style Applies a style to the text
@param {Object} params Styles parameters

Style: default value

* size: "20px"
* family: "Arial"
* weight: "normal"
* style: "normal"
* variant: "normal"
* color: "#000"
* transform: "none"
* decoration: "none"
* border: "none"
* lineHeight: 25
* shadow: null
* textBaseline: "alphabetic"
* lineWidth: null

@return {CanvasEngine.Text}
*/	
	style: function(params) {
		if (params.size & !params.lineHeight) {
			params.lineHeight = params.size;
		}
		for (var key in params) {
			this._style[key] = params[key];
		}
		return this;
	},

/**
@doc text/
@method draw Draws the text given by the style. If an effect is assigned, consider integrating extension Timelines
@param {CanvasEngine.Element} parent Element parent where the text will be displayed
@param {Integer} x (optional) Position X (0 by default)
@param {Integer} y (optional) Position Y (0 by default)
@param {Object} effect (optional) Effect to apply on line or text letters

* line: {}
	* frames : Duration in frames before the line is displayed
	* onFinish : Call the function when the lines were displayed
	* onEffect : Call function when a line has been displayed. Two parameters:
		* text_line {String} The text line
		* el_line {CanvasEngine.Element} the corresponding element in line
* _char: {}
	* frames : Duration in frames before the character is displayed
	* onFinish : Call the function when the characters were displayed
	* onEffect : Call function when a character has been displayed. Two parameters:
		* text_char {String} The text character
		* el_char {CanvasEngine.Element} the corresponding element in character
		
@example

In `ready` method :

	var text = RPGJS.Text.new(this, "Hello World");
		text.style({
			size: "18px",
			lineWidth: 300,
			color: "white"
		}).draw(content, 20, 20, {
			line: {	// Animation
				frames: 20,
				onFinish: function() {
					console.log("Effect is finished");
				},
				onEffect: function(text_line, el_line) {
					console.log(text_line);
				}
			}
		});

@return {CanvasEngine.Text}
*/	
	draw: function(parent, x, y, effect) {
	
		if (effect && !Global_CE.Timeline) {
			throw "Add Timeline class to use effects";
		}
		
		if (!effect) effect = {};
	
		if (!x) x = 0;
		if (!y) y = 0;
	
		var s =  this._style, border, text, metrics, line_y = 0, line_h, text_line = "", shadow;
		var canvas = this.scene.getCanvas(), self = this;
		this.el.x = x;
		this.el.y = y;
		
		function setProperties(pos, line, text) {
			line_h = parseInt(s.lineHeight);
			line_h *= parseInt(s.size) / 20;
			line_y = line_h * pos;
			line.font = s.style + " " + s.weight + " " + s.variant + " " + s.size + " " + s.family;
			line.fillStyle = s.color;
			line.textBaseline = s.textBaseline;
			
			if (s.shadow) {
				shadow = s.shadow.match(/(-?[0-9]+) (-?[0-9]+) ([0-9]+) ([#a-zA-Z0-9]+)/);
				if (shadow) {
					line.shadowOffsetX = shadow[1];
					line.shadowOffsetY = shadow[2];
					line.shadowBlur = shadow[3];
					line.shadowColor = shadow[4];
				}
			}
			
			line.fillText(text, 0, line_y);
		
			if (s.border != "none") {
				border = s.border.match(/([0-9]+)px ([#a-zA-Z0-9]+)/);
				line.font = s.style + " " + s.weight + " " + s.variant + " " + (s.size + border[1]) + " " + s.family;
				line.strokeStyle = border[2];
				line.strokeText(text, 0, line_y);
			}
			
			return line;
		}
		
		function drawLine(pos, text) {
			var line = self.scene.createElement();
			
			setProperties(pos, line, text);
			
			self.lines.push({
				text: text,
				el: line,
				chars: []
			});
			
			line.opacity = 0;
			
		}
		
		function displayChar(i_line, i_char, finish) {
			var line = this.lines[i_line].el;
			if (i_char >= this.lines[i_line].text.length) {
				finish();
				for (var i=0 ; i < this.lines[i_line].chars.length ; i++) {
					this.lines[i_line].chars[i].el.remove();
				}
				this.el.append(line);
				line.opacity = 1;
				this.lines[i_line].el.opacity = 1;
				if (effect._char.onFinish) effect._char.onFinish();
				return;
			}
			
			var  el = this.scene.createElement(), 
				_char = this.lines[i_line].text[i_char],
				width = canvas.measureText(_char).width,
				self = this;

			setProperties(i_line, el, _char);
			

			el.x = i_char * width;
			el.opacity = 0;
			this.el.append(el);
			
			this.lines[i_line].chars.push({
				_char: _char,
				el: el
			});
			
			Global_CE.Timeline['new'](el).to({opacity: 1}, effect._char.frames).call(function() {
				if (effect._char.onEffect) effect._char.onEffect(_char, el);
				displayChar.call(self, i_line, i_char+1, finish);
			});
			
			
		}
		
		function displayLines(i_line) {
			var self = this, el;
			if (i_line >= this.lines.length) {
				if (effect.line && effect.line.onFinish) effect.line.onFinish();
				return;
			}
			el = this.lines[i_line].el;
			
			if (effect.line) {
				this.el.append(el);
				Global_CE.Timeline['new'](el).to({opacity: 1}, effect.line.frames).call(function() {
					if (effect.line.onEffect) effect.line.onEffect(self.lines[i_line].text, el);
					displayLines.call(self, i_line+1);
				});
			}
			else if (effect._char) {
				displayChar.call(this, i_line, 0, function() {
					displayLines.call(self, i_line+1);
				});
			}
			else {
				el.opacity = 1;
				this.el.append(el);
				displayLines.call(this, i_line+1);
			}
		}
		var metrics, testLine, testWidth, words, pos = 0;
		for (var i=0 ; i < this.text.length ; i++) {
			text = this.text[i];
			if (s.lineWidth) {
				testWidth = canvas.measureText(text, s.size, s.family).width;
				text_line = "";
				words = text.split(" ");
				for(var n = 0; n < words.length; n++) {
				  testLine = text_line + words[n] + " ";
				  metrics = canvas.measureText(testLine, s.size, s.family);
				  testWidth = metrics.width;
				  if (testWidth > s.lineWidth) {
					drawLine(pos, text_line);
					text_line = words[n] + " ";
					pos++;
				  }
				  else {
					text_line = testLine;
				  }
				}
				if (testWidth < s.lineWidth) {
					drawLine(pos, text_line);
					pos++;
				}
			}
			else {
				drawLine(i, text);
			}	
		}
		
		displayLines.call(this, 0);
		
		parent.append(this.el);
		this.parent = parent;
		this.pos = {x:x, y:y};
		return this;
	},

/**
@doc text/
@method refresh Refreshed element and changing the text
@param {String} text New text
@return {CanvasEngine.Text}
*/		
	refresh: function(text) {
		if (!this.parent) {
			throw "Use 'draw' method before";
		}
		this.parent.empty();
		this.construct(text);
		this.draw(this.parent, this.pos.x, this.pos.y);
		return this;
	},
	
	// TODO
	getNumberLines: function() {
		return this.lines.length;
	}
}); 
	

/**
@doc text
@class Text Draw a text with effects
@example

<jsfiddle>WebCreative5/AP6BX</jsfiddle>

*/
var Text = {
	Text: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(scene, text) {
			return Class["new"]("Text", [scene, text]);
		}
	}
};

 