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
			effect.shake(3, 5, 24);
		}
	});
	
Other example :

	effect.shake(3, 5, 24, "xy");
	
or :

	effect.shake(3, 5, 24, "xy", function() { // You can omit the parameter "axis" if you do a shake on the X axis
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
	},

	_weather: function(type, params) {


		if (params.intensity == "stop") {
			clearInterval(this._weather_.timer);
			this._weather_.state = "stop";
			return;
		}

		var intensity = params.intensity || 100;

		var radius = 0;

		var stage = this.scene.getStage(),
			self = this;

		this._weather_ = {
			number: 0,
			numberStop: 0,
			state: "loop"
		};

		var w = this.el.width || this.canvas.width,
			h = this.el.height || this.canvas.height;

		var weatherTimer = setInterval(function() {
			
			if (self._weather_.number == intensity) {
            	clearInterval(weatherTimer);
            	return;
        	}

			var weather = self.scene.createElement();
			weather.x = CanvasEngine.random(0, w);
	        weather.y = -10;
	       
	        var gradient;

	        if (type == "rain") {

	        	weather.attr('drift', 0);
		        weather.attr('speed',  CanvasEngine.random(4, 6)) * 8;
		        weather.width = 
		        weather.height = CanvasEngine.random(2, 6) * 5;

	        	gradient = self.canvas.createRadialGradient(weather.height / 2, weather.height / 2, 0, 
		        	weather.height / 2, weather.height / 2, weather.height);
				gradient.addColorStop(0, 'rgba(125, 125, 255, 1)');
				gradient.addColorStop(1, 'rgba(125, 125, 255, 0)');

				weather.beginPath();
				weather.moveTo(0,0);
				weather.lineTo(radius, weather.height);
				weather.strokeStyle = gradient;
				weather.stroke();
	        }
	        else if (type = "snow") {
	        	
	        	weather.attr('drift', Math.random());
		        weather.attr('speed',  CanvasEngine.random(1, 6));
		        weather.width = 
		        weather.height = CanvasEngine.random(2, 6);

				if (params.use_gradient) {
					gradient = self.canvas.createRadialGradient(0, 0, 0, 0, 0, weather.width);
					gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
					gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
				}
				else {
					gradient = "white";
				}
				

		        weather.fillStyle = gradient;
	            weather.fillCircle();
	        }

	        weather.name = "weather";
	        self.el.append(weather);

	        self._weather_.number++;
		}, 200);

		this._weather_.timer = weatherTimer;

		var refresh = function(el) {

			if (el.name != "weather") return;

			if (self._weather_.state == "finish") {
				self.el.empty();
				self.el.off("canvas:refresh", refresh);
				return;
			}

			if (el.attr('flake_state') == "stop") return;

			if (el.y < h) {
                el.y += el.attr('speed');
            }
            if (el.y > h - 3) {
            	el.y = type == "snow" ? -5 : -30;
            	if (self._weather_.state == "stop") {
            		el.attr("flake_state", "stop");
            		self._weather_.numberStop++;
            		if (self._weather_.number == self._weather_.numberStop) {
            			self._weather_.state = "finish";
            		}
            		return;
            	}
            }

             el.x += el.attr('drift');
            
            if (el.x > w) {
            	el.x = 0;
            }
 
		};
		

		this.el.on("canvas:refresh", refresh);

		return this;

	},

	rain: function(intensity) {
		return this._weather("rain", {
			intensity: intensity
		});
	},

	snow: function(intensity, use_gradient) {
		return this._weather("snow", {
			intensity: intensity,
			use_gradient: use_gradient
		});
	},

	storm: function(intensity, callback, color) {
		var self = this;

		color = color || "#FCFFE6";
		
		this.rain(intensity);

		if (intensity == "stop") return this;

		function flash() {
			var sec = CanvasEngine.random(4, 10);
			setTimeout(function() {
				if (self._weather_.state == "loop") {
					if (callback) callback();
					self.screenFlash(color, 10);
					flash();
				}
			}, sec * 1000);
		}

		flash();
	},

	particles: function() {


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

 