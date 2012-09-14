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
 * x: next value
   t: current time
   b: last value
   c: next value - last value
   d: duration
 */
var Ease = {
	linear: function(x, t, b, c, d) {
		return c*(t/=d) + b;
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
} 


Class.create("Timeline", {	
	_timeline: {},
	_frequence: 0,
	_stop: false,
	_propreties: [],
	_key_times: [],
	_onFinish: null,
	_varTime: {},
	initialize: function(el) {
		this._frequence = 0;
		this.el = el;
		this.addProprety(["opacity", "x", "y", "scaleX", "scaleY", "rotation"]);	
		this._loop();
	},
	to: function(attr, frames, ease, _cal) {
		if (ease) {
			attr._ease_ = ease;
		}
		if (!_cal) {
			_cal = "set";
		}
		this._key_times.push(frames);
		this._timeline[frames] = attr;
		this._timeline[frames]._cal = _cal;
		return this;
	},
	wait: function(frame) {
		var last_key = this.getLastKey();
		this.to(last_key, frame, false, "wait");
		return this;
	},
	getLastKey: function() {
		var last_time = this._key_times[this._key_times.length-1];
		if (!last_time) {
			var obj = {};
			for (var i=0 ; i < this._propreties.length ; i++) {
				obj[this._propreties[i]] = this.el[this._propreties[i]];
			}
			return obj;
		}
		return this._timeline[last_time];
	},
	add: function(attr, frames, ease) {
		return this.to(attr, frames, ease, "add");
	},
	addProprety: function(name) {
		if (!(name instanceof Array)) {
			name = [name];
		}
		for (var i=0 ; i < name.length ; i++) {
			this._propreties.push(name[i]);
		}
	},
	loop: function() {
		var self = this;
		this.call(function() {
			self._stop = false;
			return true;
		});
	},
	_initVar: function() {
		this._varTime = {
			freq: this._frequence,
			time: 0,
			time_tmp: 0,
			last_t: 0,
			next_t: 0,
			find_next: false
		};

	},
	_loop: function() {
		var self = this, ret;
		
		this.el.addLoopListener(function() {
		
			if (self._varTime.time === undefined) return;
			
			
			var freq = self._varTime._frequence,
				time = self._varTime.time,
				time_tmp = self._varTime.time_tmp,
				last_t = self._varTime.last_t,
				next_t = self._varTime.next_t,
				find_next = self._varTime.find_next;
				
			function initValue() {
					var obj = {};
					for (var i=0 ; i < self._propreties.length ; i++) {
						obj[self._propreties[i]] = this[self._propreties[i]];
					}
					self._timeline["0"] = obj;
				}
				
				function endValue(type) {
					var _cal, result_val;
					if (!self._timeline[next_t][type]) {
						return this[type];
					}
					_cal = self._timeline[next_t]._cal;
					result_val = self._timeline[next_t][type];
					switch (_cal) {
						case "add": 
							result_val += self._timeline[last_t][type];
						break;
					}
					return result_val;
				}
				
				function newValue(type) {
					var ease, value, _cal, next_val, result_val;
					if (!self._timeline[next_t][type]) {
						return this[type];
					}
					ease = self._timeline[next_t]._ease_;
					_cal = self._timeline[next_t]._cal;
					result_val = self._timeline[next_t][type];
					switch (_cal) {
						case "add": 
							result_val += self._timeline[last_t][type];
						break;
					}
					if (!ease) {
						ease = Ease.linear;
					}
					value = ease(
						result_val,
						(next_t - last_t) - time_tmp,
						self._timeline[last_t][type],
						result_val - self._timeline[last_t][type],
						next_t - last_t
					);
					//console.log(next_t - last_t, time_tmp);
					return value;
				}
				freq = 0;
			
		
		
			var t;
			if (self._stop) {
				return;
			}
			freq++;
			if (freq >= self._frequence) {
				if (time == 0) {
					initValue.call(this);
				}
				if (time_tmp == 0) {
					find_next = false;
					for (var key in self._timeline) {
						if (key > time) {
							last_t = next_t ? next_t : 0;
							next_t = key;
							find_next = true;
							break;
						}
					}
					
					
					
					if (!find_next) {
						self._stop = true;
						time = 0;
						last_t = 0;
						time_tmp = 0;
						if (self._onFinish) {
							ret = self._onFinish.call(this);
						}
						if (!ret) {
							return;
						}
						else {
							initValue.call(this);
							next_t = 0;
						}
					}
				}
				
					
				
				time_tmp = next_t - time;
				if (time_tmp != 0) {
					if (self._timeline[next_t]._cal != "wait") {
						if (time_tmp == 1) {
							for (var i=0 ; i < self._propreties.length ; i++) {
								this[self._propreties[i]] = endValue.call(this, self._propreties[i]);
							}
						}
						else {
							for (var i=0 ; i < self._propreties.length ; i++) {
								this[self._propreties[i]] = newValue.call(this, self._propreties[i]);
							}
						}
					}
				}
				time++;
				
			}	
			
		
			
			self._varTime._frequence = freq;
			self._varTime.time = time;
			self._varTime.time_tmp = time_tmp;
			self._varTime.last_t = last_t;
			self._varTime.next_t = next_t;
			self._varTime.find_next = find_next;
			
			
		});
	},
	call: function(onFinish) {
		this._initVar();
		this._onFinish = onFinish;	
		this._stop = false;
	}
}); 
	
	Class.create("Animation", {	
		_images: [],
		_frames: {},
		_animations: {},
		_frequence: 0,
		_stop: false,
		_timeline: null,
		_onFinish: null,
		_seq: null,
		_loop: false,
		_els: [],
		el: null,
		canvas: null,
		initialize: function(options, canvas) {
			this._images = options.images;
			this._animations = options.animations;
			this._timeline = options.timeline;
			this._els = options.addIn;
			this._onFinish = options.onFinish;
			this.canvas = canvas;
			if (options.addIn) {
				this.el = this._els.scene.createElement();
				this._els.append(this.el);
				this.add();
			}
		},
		add: function(el) {
			
			if (el) this.el = el;
			
			var self = this;
			var i = 0;
			var freq = 0;
			var img_seq = 0;


			this.stop();
			

			this.el.addLoopListener(function() {
				var t;
				var seq = self._animations[self._seq], loop = self._loop == "loop";
				if (self._stop) {
					return;
				}
				freq++;
				if (!seq.frequence) seq.frequence = 0;

				if (freq >= seq.frequence) {
					if (!seq && self._images instanceof Array) {
						
						var img = self._images[img_seq];
						this.drawImage(img, 0, 0);
						img_seq++;
						if (img_seq >= self._images.length) {
							if (loop) {
								img_seq = 0;
							}
							else {
								self._stop = true;
							}
						}
						
					}
					else {
						var img = canvas.Materials.images[self._images], sx = 0, sy = 0;
						var currentSeq;
						var nx = img.width / seq.size.width;
						var ny = img.height / seq.size.height;
						var id;
						var children;
						
						
						function drawImage(_el, id) {
							sy = parseInt(id / Math.round(img.width / seq.size.width));
							sx = (id % Math.round(img.width / seq.size.width));
								
							var w = seq.size.width * sx,
								h = seq.size.height * sy;
						
							_el.drawImage(self._images, w, h, seq.size.width, seq.size.height, 0, 0, seq.size.width, seq.size.height);
						}
						
						function finish() {
							if (self._loop == "stop") {
								self.stop();
								return true;
							}
							else if (self._loop == "remove") {
								self.stop();
								this.empty();
								return true;
							}
							return false;
						}
						
						
						if (seq.frames[0] instanceof Array) {
							if (seq.frames[i] === undefined) {
								i = -1;
								if (finish.call(this)) return;
							}
							this.empty();
							for (var j=0 ; j < seq.frames[i].length ; j++) {
								currentSeq =  seq.frames[i][j];
								if (currentSeq) {
									children = this.scene.createElement(seq.size.width, seq.size.height);
									id = currentSeq.pattern-1;
									children.setOriginPoint("middle");
									children.x = currentSeq.x != undefined ? currentSeq.x : seq.framesDefault.x;
									children.y = currentSeq.y != undefined ? currentSeq.y : seq.framesDefault.y;
									children.scaleX = currentSeq.zoom != undefined ? currentSeq.zoom / 100 : seq.framesDefault.zoom / 100;
									children.scaleY = currentSeq.zoom != undefined ? currentSeq.zoom / 100 : seq.framesDefault.zoom / 100;
									children.opacity = currentSeq.opacity != undefined ? currentSeq.opacity / 255 : seq.framesDefault.opacity / 255;
									children.rotation = currentSeq.rotation != undefined ? currentSeq.rotation : seq.framesDefault.rotation;
									
									drawImage(children, id);
									this.append(children);
								}
							}
							
						}
						else {
							id = seq.frames[0] + i;
							if (id >= seq.frames[1]) {
								i = -1;
								if (finish.call(this)) return;
							}
							drawImage(this, id);
						}
						
						i++;
					}
					freq = 0;
				}
			});
		
		
		},
		stop: function() {
			this._stop = true;
		},
		play: function(seq, type) {
			this._loop = type;
			this._seq = seq;
			this._stop = false;
		}
	});
			
			
		
 
var Animation = {
	/**
		@class Timeline
		Create a temporal animation
		@param {Element} el
		@example
		<code>
			var timeline = canvas.Timeline.new(el);
			timeline.to({x: 100}, 70,  Ease.easeOutElastic).call();
		</code>
	*/
	Timeline: {
		"new": function(el) {
			return Class["new"]("Timeline", [el]);
		}
	},
	Animation: {
		"new": function(options, canvas) {
			return Class["new"]("Animation", [options, canvas]);
		}
	}
};

