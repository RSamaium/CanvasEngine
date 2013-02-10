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
		text = ""+text;
		this.scene = scene;
		this.el = this.scene.createElement();
		this.text = text.split("\n");
	},
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
	effect : 
	
	{
		line: "fade"
	}
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
				testWidth = canvas.measureText(text).width;
				if (testWidth < s.lineWidth) {
					drawLine(pos, text);
				}
				else {
					words = text.split(" "), pos = 0;
					for(var n = 0; n < words.length; n++) {
					  testLine = text_line + words[n] + " ";
					  metrics = canvas.measureText(testLine);
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
				}
			}
			else {
				drawLine(i, text);
			}	
		}
		
		displayLines.call(this, 0);
		
		parent.append(this.el);
		return this;
	},
	getNumberLines: function() {
		return this.lines.length;
	}
}); 
	
var Text = {
	Text: {
		"new": function(scene, text) {
			return Class["new"]("Text", [scene, text]);
		}
	}
};

 