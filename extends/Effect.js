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

Class.create("Effect", {
	scene: null,
	el: null,
	canvas: null,
	initialize: function(scene, el) {
		this.scene = scene;
		this.el = el;
		this.canvas = this.scene.getCanvas();
		if (!Global_CE.Timeline) {
			throw "Add Timeline class to use effects";
		}
		return this;
	},

/**
@doc effect/
@method screenFlash Perform a flash on the screen
@param {String} color Hexadecimal color value. Example : ff0000 for red
@param {Integer} speed Speed of the flash.
@param {Function} callback (optional) Callback when the flash is completed
*/	
	screenFlash: function(color, speed, callback) {
		var flash = this.scene.createElement(),
			canvas = this.scene.getCanvas();
			
		flash.fillStyle = color;
		flash.fillRect(0, 0, canvas.width, canvas.height);
		flash.opacity = .8;
		
		this.scene.getStage().append(flash);
		
		flash.zIndex(-1);
		
		var timeline = Global_CE.Timeline['new'](flash);
		timeline.to({opacity: "0"}, speed).call(function() {
			flash.remove();
			if (callback) callback();
		});

	},

/**
@doc effect/
@method blink Blink element on a period with a specified frequency
@param {Integer} duration Duration in frames
@param {Integer} frequence Blinking frequency (the higher the frequency is High, more the blinking is low)
@param {Function} callback (optional) Callback when the blink is completed
*/		
	blink: function(duration, frequence, callback) {
	
		var current_freq = 0;
	
		var render = function() {
			
				duration--;
				
				current_freq++;
			
				if (current_freq >= frequence) {
					current_freq = 0;
					this.toggle();
				}
				
				if (duration <= 0) {
					
					this.off("canvas:render", render);
					this.show();
					if (callback) callback();
				}
		};
		
		this.el.on("canvas:render", render);
	
	},
	
/**
@doc effect/
@method shake  Shakes the screen
@param {Integer} power Intensity of the shake. The higher the value, the greater the shaking is strong
@param {Integer} speed Speed of the shake.
@param {Integer} duration Duration of shake in frame
@param {String} axis (optional) The axis where there will shake : "x", "y" or "xy". "x" by default
@param {Function} callback (optional) Callback when the shake is completed
@example

	canvas.Scene.new({
		name: "MyScene",

		materials: {
			images: {
				"img": "images/foo.png"
			}
		},
		
		ready: function(stage) {
			var el = this.createElement();
				el.drawImage("img");
				
			stage.append(el);
			
			var effect = canvas.Effect.new(this, el);
			effect.screenShake(3, 5, 24);
		}
	});
	
Other example :

	effect.screenShake(3, 5, 24, "xy");
	
or :

	effect.screenShake(3, 5, 24, "xy", function() { // You can omit the parameter "axis" if you do a shake on the X axis
		alert("finish"); 
	});
*/
	shake: function(power, speed, duration, axis, callback) {
		
		if (typeof axis == "function") {
			callback = axis;
			axis = false;
		}
		
		var current = 0, direction = 1;
		axis = axis || "x";
		
		var render = function() {
			
				var delta = (power * speed * direction) / 10.0;
				if (duration <= 1 && current * (current + delta) < 0) {
					current = 0;
				}
				else {
					current += delta;
				}
				if (current > power * 2) {
					direction = -1;
				}
				if (current < -power * 2) {
					direction = 1;
				}
				if (duration >= 1) {
					duration -= 1;
				}
				if (/x/.test(axis)) {
					this.x = current;
				}
				if (/y/.test(axis)) {
					this.y = current;
				}
				if (duration == 0) {
					this.off("canvas:render", render);
					if (callback) callback();
				}
				
				console.log(delta);
			
		};
		
		this.el.on("canvas:render", render);
		
	},
	
/**
@doc effect/
@method changeScreenColorTone Change the tone of the screen
@param {String} color Hexadecimal color value. Example : 000000 for black. You can put "reset" to reset the tone of the screen :
	
	var effect = canvas.Effect.new(this, el);
	effect.changeScreenColorTone("reset");
	
@param {Integer} speed Speed of the tone color.
@param {String} composite lighter|darker Darken or lighten the screen
@param {Integer} opacity Change the tone to the opacity assigned. Value between 0 and 1
@param {Function} callback (optional) Callback when the tone color is completed
*/
	changeScreenColorTone: function(color, speed, composite, opacity, callback) {
	
		var exist_tone = false;
	
		if (this.tone) {
			this.tone.remove();
			delete this.tone;
			exist_tone = true;
			if (color == 'reset') return;
		}
		
		this.tone = this.scene.createElement(),
			canvas = this.scene.getCanvas();
			
		this.tone.fillStyle = color;
		this.tone.fillRect(0, 0, canvas.width, canvas.height);
		
		this.tone.opacity = 0;
		this.tone.globalCompositeOperation = composite;
			
		this.scene.getStage().append(this.tone);
		
		this.tone.zIndex(-1);

		if (!exist_tone) {
			this.tone.opacity = 0;
			if (speed > 0) {
				 Global_CE.Timeline['new'](this.tone).to({opacity: opacity}, speed).call(callback);
			}
			else {
				this.tone.opacity = opacity;
			}
		}
	}
	
}); 

/**
@doc effect
@class Effect Performs effects on the screen or an element
@example

<jsfiddle>WebCreative5/FmuvM</jsfiddle>

*/
var Effect = {
	Effect: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(scene, el) {
			return Class["new"]("Effect", [scene, el]);
		}
	}
};

 