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

/*
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
/**
@doc timeline/
@method to The properties of the elements will change over a predefined period
@param  {Object} attr Property values :

* opacity 
* x
* y
* scaleX
* scaleY
* rotation

Example : 

	{x: 200, scaleX: 2}

@param {Integer} frames Duration in frames
@param {Function} ease (optional) Effect.

Use `Ease` object that has constants :

* easeInQuad
* easeOutQuad
* easeInCubic
* easeOutCubic
* easeInOutCubic
* easeInQuart
* easeOutQuart
* easeInOutQuart
* easeInQuint
* easeOutQuint
* easeInOutQuint
* easeInSine
* easeOutSine
* easeInOutSine
* easeInExpo
* easeOutExpo
* easeInOutExpo
* easeInCirc
* easeOutCirc
* easeInOutCirc
* easeInElastic
* easeOutElastic
* easeInOutElastic
* easeInBack
* easeOutBack
* easeInOutBack
* easeInBounce
* easeOutBounce
* easeInOutBounce

See example below. You can see the effects on [http://gsgd.co.uk/sandbox/jquery/easing/](http://gsgd.co.uk/sandbox/jquery/easing/)

@example

	var timeline = canvas.Timeline.new(el);
	timeline.to({x: 100}, 70,  Ease.easeOutElastic).call();
	
<jsfiddle>MAdmq/8</jsfiddle>

@return {CanvasEngine.Timeline}
*/
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
/**
@doc timeline/
@method wait Wait a number of frames before you start the next animation
@param {Integer} frames Duration in frames
Example

	var timeline = canvas.Timeline.new(el);
	timeline.wait(10)
			.to({x: 100}, 70,  Ease.easeOutElastic)
			.call();

@return {CanvasEngine.Timeline}
*/
	wait: function(frame) {
		var last_key = this.getLastKey();
		this.to(last_key, frame, false, "wait");
		return this;
	},
	/**
		@doc timeline/
		@method getLastKey Retrieve the properties of the last key
		@return {Object}
	*/
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
/**
@doc timeline/
@method add Adds values to the properties of a period. 
@param  {Object} attr Property values :
	
* opacity 
* x
* y
* scaleX
* scaleY
* rotation

Example : 

	{x: 200, scaleX: 2}

@param {Integer} frames Duration in frames
@param {Function} ease (optional) Effect. See [to()](?p=extends.timeline.to)
@example

	var timeline = canvas.Timeline.new(el);
	timeline.add({x: 100}, 70,  Ease.easeOutElastic).call();

@return {CanvasEngine.Timeline}
*/
	add: function(attr, frames, ease) {
		return this.to(attr, frames, ease, "add");
	},
/**
@doc timeline/
@method addProprety Adds properties to changes
@param  {String|Array} name Property name
@example

	var timeline = canvas.Timeline.new(el);
	tileline.addProprety("foo");
	timeline.to({foo: 100}, 70).call();

*/
	addProprety: function(name) {
		if (!(name instanceof Array)) {
			name = [name];
		}
		for (var i=0 ; i < name.length ; i++) {
			this._propreties.push(name[i]);
		}
	},
/**
@doc timeline/
@method loop Run continuously timeline
@example

	var timeline = canvas.Timeline.new(el);
	timeline.add({x: 2}, 60).loop();

*/
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
						obj[self._propreties[i]] = +this[self._propreties[i]];
					}
					self._timeline["0"] = obj;
				}
				
				function endValue(type) {
					var _cal, result_val;
					if (self._timeline[next_t][type] === undefined) {
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
					if (self._timeline[next_t][type] === undefined) {
						return this[type];
					}
					if (self._timeline[last_t][type] === undefined) {
						self._timeline[last_t][type] = self.el[type];
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
/**
@doc timeline/
@method call Run timeline
@param  {Function} onFinish (optional) Calls the function when the animation is completed
@example

	var timeline = canvas.Timeline.new(el);
	timeline.to({x: 20}, 60).call(function() {
		console.log("finish !");
	});

*/
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
		_els: null,
		el: null,
		initialize: function(options) {
			this._animations = options.animations;
			this._images = options.images;
			this._timeline = options.timeline;
			
			this._options = options;
			
			for (var name in this._animations) {
				this.addAnim(name, this._animations[name]);
			}
			if (options.addIn) {
				this.el = options.addIn.scene.createElement();
				options.addIn.append(this.el);
				this.add();
			}
		},

/**
(dev)
@method addAnim `(>=1.4.0)` 
@param 
@return {CanvasEngine.Animation}
*/
		addAnim: function(name, val) {
			this._animations[name] = CanvasEngine.extend(CanvasEngine.clone(this._options), val);
			return this;
		},

/**
@doc animation/
@method remove `(>=1.3.1)` Removes the animation on this element
@param {CanvasEngine.Element} el (optional) The element in question. If absent, takes the element assigned to the class
@return {CanvasEngine.Animation}
*/
		remove: function(el) {
			if (el) this.el = el;
			this.el.off("canvas:render");
			return this;
		},

/**
@doc animation/
@method add Adds a loop listener in a element to perform an animation (with addLoopListener). From the method call, the loop is started on the animation stop. Use the play method to start the animation
@param {CanvasEngine.Element} el
@param {Boolean} uniq (optional) `(>=1.3.1)` Indicates if the element has only an animation. false by default.

Example :

In `ready` method : 
	
	var el = this.createElement();
	var animation = canvas.Animation.New({...});
	
	animation.add(el, true);
	animation.add(el, true);

	// Despite that adds twice the animation element, only the second assignment will be considered

@event animation:draw Call each sequence. Id parameter sequence
*/
		add: function(el, uniq) {
			
			if (el) this.el = el;
			
			var self = this;
			var i = 0;
			var freq = null;
			var img_seq = 0;
			var prevSeq;

			if (uniq) this.remove();
			
			this.stop();

			function getOption() {
				this._options
			}
			
			this.el.addLoopListener(function() {
				// Catch when we're interrupted and haven't had a chance to reset
				if (self._seq !== prevSeq) {
					prevSeq = self._seq;
					i = 0;
					freq = null;
				}

				
				var seq = self._animations[self._seq],
						loop = self._loop == "loop";

				function seqSize(img) {
					if (seq.size) return seq.size;
					var data_img = Global_CE.Materials.get(img);
					seq.size = {
						width: data_img.width,
						height: data_img.height
					};
				}
				
				if (seq && !seq.frequence) seq.frequence = 0;
				
				if (freq == null && seq) {
					freq = seq.frequence;
				}
				
				if (self._stop) {
					if (seq) freq = seq.frequence;
					i = 0;
					return;
				}
				freq++;
				
				if (freq >= seq.frequence) {

					if (self._images instanceof Array) {	
						var img = self._images[img_seq];
						seqSize(img);
						this.drawImage(img);
						img_seq++;
						if (img_seq >= self._images.length) {
							img_seq = 0;
							if (!loop) {
								self._stop = true;
							}
						}
						
					}
					else {
						var img = Global_CE.Materials.get(self._images), sx = 0, sy = 0;
						seqSize(self._images);
						var currentSeq;
						var nx = img.width / seq.size.width;
						var ny = img.height / seq.size.height;
						var id;
						var children;
						
						function drawImage(_el, id) {
							var _img = self._images;
							if (seq.patternSize) {
								seq.size = {
									width: img.width / seq.patternSize.width,
									height: img.height / seq.patternSize.height
								};
							}
							
							sy = parseInt(id / Math.round(img.width / seq.size.width));
							sx = (id % Math.round(img.width / seq.size.width));
								
							var w = seq.size.width * sx,
								h = seq.size.height * sy;
							
							_el.trigger("animation:draw", id);
							if (seq.image) {
								_img = seq.image;
							}
							if (!seq.position) seq.position = {};
							if (!seq.position.left) seq.position.left = 0;
							if (!seq.position.top) seq.position.top = 0;

							_el.drawImage(_img, w, h, seq.size.width, seq.size.height, seq.position.left, seq.position.top, seq.size.width, seq.size.height);
						}
						
						function finish() {
							if (/stop/.test(self._loop)) {
								if (seq.finish) seq.finish.call(self);
								self.stop();
								return true;
							}
							else if (self._loop == "remove") {
								if (self._options.addIn) {
									this.empty();
								}
								else {
									this.remove();
								}
								if (seq.finish) seq.finish.call(self);
								self.stop();
								return true;
							}
							return false;
						}
						
				
						if (seq.frames[0] instanceof Array) {

							if (seq.frames[i] === undefined) {
								i = 0;
								if (finish.call(this)) return;
							}
							this.empty();
							
							seq.framesDefault = seq.framesDefault || {};
							if (!seq.framesDefault.x) seq.framesDefault.x = 0;
							if (!seq.framesDefault.y) seq.framesDefault.y = 0;
							if (!seq.framesDefault.zoom) seq.framesDefault.zoom = 100;
							if (!seq.framesDefault.opacity) seq.framesDefault.opacity = 255;
							if (!seq.framesDefault.rotation) seq.framesDefault.rotation = 0;
							
							if (!seq.frames[i]) {
								i++;
								return;
							}
							
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
							var left = seq.frames[0] < seq.frames[1]; // animation left->right or top->bottom> 
						
							id = seq.frames[0] + (left ? i : -i);
							if (left ? id > seq.frames[1] : id < seq.frames[1]) {
								i = 0;
								finish.call(this);
								if (!/no_restart/.test(self._loop)) {
									drawImage(this, seq.frames[left ? 0 : 1]);
								}	
							}
							else {
								drawImage(this, id);
							}

						}

						i++;
					}
					freq = 0;
				}
			});
		
		
		},

/**
@doc animation/
@method isStopped `(1.3.1)` Whether the animation is stopped
@return {Boolean}
*/
		isStopped: function() {
			return this._stop;
		},

/**
@doc animation/
@method stop Stop animation
@return {CanvasEngine.Animation}
*/
		stop: function() {
			this._stop = true;
			return this;
		},
/**
@doc animation/
@method play Adds a loop listener in a element to perform an animation (with addLoopListener). From the method call, the loop is started on the animation stop. Use the play method to start the animation
@param {String} seq Name of the sequence corresponding to the key in the initialization of the class
@param {String} type (optional) Choose from :

* loop : Animation loop
* stop : The animation is done once and stops
* remove : The animation is done once and removed at the end
@return {CanvasEngine.Animation}
*/
		play: function(seq, type) {
			this._loop = type;
			this._seq = seq;
			this._stop = false;
			return this;
		}
	});
			
			
		
 
var Animation = {
/**
@doc timeline
@class Timeline Create a temporal animation. See [to()](?p=extends.timeline.to)
@param {Element} el
@example

	var timeline = canvas.Timeline.new(el);
	timeline.to({x: 100}, 70,  Ease.easeOutElastic).call();

*/
	Timeline: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(el) {
			return Class["new"]("Timeline", [el]);
		}
	},

/**

@doc animation
@class Animation View an animation from an image
@param {Object} options

* images {String|Array} : identifying the image. If the value is an array. The different images are chained
* addIn {CanvasEngine.Element} : allows you to add animation to an existing element
* animations {Object} : Includes all animations. The key is the identifier of the animation. The value parameters (view example)
	* frames {Array} : Array with two elements: the first is to play the first frame, the second frame is the arrival
	* size {Object} : Set the width and height of the sequence (`width` and `height` keys )
	* patternSize {Object} `(>= 1.2.5)` : Number of patterns :
	
	    Example :
    		
            patternSize: {
    			width: 4,
    			height: 4
    		}
    		
    	If the image measurement 100*100px, this amounts to:
    		
    		size: {
    			width: 100 / 4,
    			height: 100 / 4
    		}
		
		
	* frequence {integer} : Frequency display. The higher the value the more high frequency is low
	* finish {Function} : Callback when the animation is finished
	* image {String} :  identifying the image specific to this animation
	* position {Object} : offset of the animation display ("left" and "top" keys)
	
@example

In method `ready` of the scene :

	var el = this.createElement();
	var animation = canvas.Animation.new({
	   images: "chara",
	   animations: {
		run: {
			frames: [0, 5],
			 size: {
				width: 42,
				height: 42
			  },
			 frequence: 3,
			 finish: function() {
			 
			 }
		  }
	   }
	});
	stage.append(el);
	animation.add(el);
	animation.play("run", "loop");


<jsfiddle>WebCreative5/77wUh/3</jsfiddle>

You can also chaining multiple different images:

	var el = this.createElement(),
		animation = canvas.Animation.new({
			images: ["foo", "bar"],
			animations: {
				_default: {
					frequence: 7
				}
			}
		});
	animation.add(el);
	animation.play("_default", "loop");


<jsfiddle>WebCreative5/E2vVW</jsfiddle>

## Example of an image with several sequences

Here is the picture:

![](http://canvasengine.net/examples/img/fire.png)

You can retrieve sequences and create a particular animation :

    canvas.Animation.New({
			images: "fire",
			addIn: stage,
			animations: {
				_default: {
					position: {
						top: 75/2,
						left: 74/2
					},
                    frequence: 8,
					frames: [
                        [{"pattern":7}],
                        [{"pattern":8}],
                        [{"pattern":9}]
                    ],
					size: {
						width: 75,
						height: 74
					}
				}
			}
		});

* position : Position of the point of origin
* frequence : Frequency
* frames : Different sequences for each frame. A frame is composed of an array with several sequences
    * pattern : Identifying the pattern. The identifier starts at 1 and increments in the direction of West Reading
    * x : Position X
    * y : Position Y
    * zoom : Scaling between 0 and 100
    * opacity : Opacity between 0 and 255
    * rotation : Rotation between 0 and 360

<jsfiddle>WebCreative5/ePwtq</jsfiddle>

It is possible to provide default values width `framesDefault` that will apply to all sequences that do not have the property :

    canvas.Animation.New({
			images: "fire",
			addIn: stage,
			animations: {
				_default: {
                    framesDefault: {
                        rotation: 20
                    },
					frames: [
                        [{"pattern":7}],
                        [{"pattern":8}],
                        [{"pattern":9}]
                    ],
					size: {
						width: 75,
						height: 74
					}
				}
			}
		});


*/
	Animation: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(options) {
			return Class["new"]("Animation", [options]);
		}
	}
};

