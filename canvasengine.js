/*
Copyright (C) 2012 by WebCreative5 - Samuel Ronce

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


// Erik Möller
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
// --

Class.create("ModelClientClass", {
	create: function(name, events, model) {
		if (!(events instanceof Array)) {
			model = events;
			events = false;
		}
		model.events = events;
		Class.create(name, model);
	},
	"new": function(name) {
		var _class = Class["new"](name).extend({
			_methods: {},
			emit: function(name, data, callback) {
				
				if (!data) {
					data = [];
				}
				if (typeof data == "function") {
					callback = data;
				}
				if (callback) {
					this.on(name, callback);
				}
				
				if (this[name]) {
					if (!(data instanceof Array)) {
						var new_a = [];
						for (var key in data) {
							new_a.push(data[key]);
						}
						data = new_a;
					}
					var ret = this[name].apply(this, data);
					this.call(name, ret);
					
				}
				
			},
			on: function(name, callback) {
				if (!this._methods[name]) {
					this._methods[name] = {};
				}
				this._methods[name].callback = callback;
			},
			call: function(name, data) {
				if (this._methods[name]) this._methods[name].callback(data);
			}
		});
		if (this.events) {
			for (var key in this.events) {
				obj = _class[events[key]];
				if (obj) {
					obj.on(this.events[key], function(data) {
						if (!data) {
							data = {};
						}
						obj.call(_class, data);
					});
				}
			}
		}
		return _class;
	}
});

var Model = Class["new"]("ModelClientClass");

var old;

/**
	@class CanvasEngine
	@static
	@details
		
	See "defines" method
			
*/
 /**
	@method CanvasEngine.defines Initialize CanvasEngine  by setting the canvas 
	@param {String} canvas canvas ID
	@param {Object} params (optional) additional parameters
	@return CanvasEngineClass
	@example
	"CE"  is equivalent to "CanvasEngine"
	<code>
		var canvas = CE.defines("canvas_id").
					 ready(function() {
						// DOM is ready
					 });
	</code>
 */
CanvasEngine.defines = function(canvas, params) {
	params = params || {};
	if (typeof canvas == "string") {
		canvas = [canvas];
	}
	var CanvasEngine;
	/**
		@doc engine
		@class CanvasEngineClass Main class to use Canvas Engine
			<code>
				var canvas = CE.defines("canvas_id"); // CanvasEngine object
			
				canvas.ready(function(ctx) {
					canvas.Scene.call("MyScene");
				});
			</code>
			
	*/
	Class.create("CanvasEngineClass", {
		_noConflict: false,
		initialize: function(element) {
			this.canvas = canvas;
			this.el_canvas = [];
		},
		 /**
			@doc engine/
			@method ready Calls the function when DOM is ready. The method uses "window.load" or SoundManager callback if it is present
			@param {Function} callback
			@return CanvasEngineClass
			@example
			<code>
				var canvas = CE.defines("canvas_id").
							 ready(function() {
								// DOM is ready
							 });
			</code>
		 */
		ready: function(callback) {
			var self = this;
			CanvasEngine.Sound._manager = typeof(soundManager) !== "undefined";
			if (CanvasEngine.Sound._manager) {
				soundManager.setup({
					  url: params.swf_sound ? params.swf_sound : "swf/",
					  onready: onReady  
				});
			}
			else {
				window.onload = onReady;
			}
			
			function onReady() {	
				for (var i=0 ; i < self.canvas.length ; i++) {
					self.el_canvas.push(self.Canvas["new"](self.canvas[i]));
				}
				callback();
				
				
				
			}
			return this;
		},
		plugins: function() {
		
		},
		mouseover: false,
		noConflict: function() {
			this._noConflict = true;
		},
		
		/**
		@doc materials
		@class Materials Resource management game
			The class is used with the properties "materials" in the scene but you can still use it for loading external resources to the scene
		@example
			Using Sound :
			<code>
			var canvas = CE.defines("canvas_id").
				ready(function() {
					canvas.Scene.call("MyScene");
				});
						
			canvas.Scene.new({
				name: "MyScene",
				ready: function(stage) {
					canvas.Materials.load("images", [
						{img1: "path/to/img1.png"},
						{img2: "path/to/im2.png"}
					], function(img) {
						console.log("Image is loaded");
					}, function() {
						console.log("All images are loaded");
					});
				}
			});
			</code>
		*/
		Materials: {
			images: {},
			sounds: {},
			fonts: {},
			/**
				@doc materials/
				@method get Get the picture or sound according to its identifier
				@param {String} id
				@return {HTML5Audio|Images}
			*/
			get: function(id) {
				if (this.images[id]) {
					return this.images[id];
				}
				else if (this.sounds[id]) {
					return this.sounds[id];
				}
			},
			transparentColor: function(img, color) {
				var canvas =  document.createElement('canvas'), ctx, imageData, data, rgb;
				canvas.width = img.width;
				canvas.height = img.height;
				ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);
				imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				data = imageData.data;
				rgb = _CanvasEngine.hexaToRGB(color);
				for(var i = 0, n = data.length; i < n; i += 4) {
					var red = data[i];
				    var green = data[i + 1];
				    var blue = data[i + 2];
					if (red == rgb[0] && green == rgb[1] && blue == rgb[2]) {
						data[i + 3] = 0;
					}
				}
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
			/**
				@doc materials/
				@method load Load a resource
				@param {String} type Type : "images" or "sounds"
				@param {Array|Object} path Paths to resources.
					- If array : Elements are composed of objects where the key is the identifier and value is the path
					<code>
						 [
							{img1: "path/to/img1.png"},
							{img2: "path/to/im2.png"}
						]
					</code>
					- If object, the key is the identifier and value is the path :
					<code>
						{img1: "path/to/img1.png", img2: "path/to/im2.png"}
					</code>
					The value can be an object to give several parameters :
					<code>
						{img1: {path: "path/to/img1.png", transparentcolor: "#ff0000"}, img2: "path/to/im2.png"}
					</code>
					"path" is the path and "transparentcolor" the color that will be transparent image
			*/
			load: function(type, path, onLoad, onFinish) {
				var i=0, self = this, materials, img_data;
				if (path instanceof Array) {
					materials = path;
				}
				else {
					materials = [];
					for (var key in path) {
						img_data = {};
						if (typeof path[key] == "string") {
							img_data.path = path[key];
						}
						else {
							img_data.path = path[key].path;
							img_data.transparentcolor = path[key].transparentcolor;
						}
						materials.push({
							id: key,
							path: img_data.path,
							transparentcolor: img_data.transparentcolor
						});
						
					}
				}
				switch (type) {
					case "images":
						load();
					break;
					case "sounds":
						loadSounds();
					break;
					case "fonts":
						loadFont();
					break;
				}
				
				function load() {
					var img;
					if (materials[i]) {
						img = new Image();
						img.onload = function() {
							var _img;
							if (materials[i].transparentcolor) {
								_img = self.transparentColor(this, materials[i].transparentcolor);
							}
							else {
								_img = this;
							}
							self.images[materials[i].id] = _img;
							i++;
							if(onLoad) onLoad.call(self, _img);
							load();
						};
						img.src = materials[i].path;
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
				
				function loadSounds() {
					var img;
					
					function next() {
						i++;
						if (onLoad) onLoad.call(self, this);
						loadSounds();
					}
					
					if (materials[i]) {
						if (CanvasEngine.Sound._manager) {
							self.sounds[materials[i].id] = soundManager.createSound({
							  id: materials[i].id,
							  url:  materials[i].path,
							  autoLoad: true,
							  autoPlay: false,
							  onload: next
							});
						}
						else {
							var snd = new Audio();
							
							snd.addEventListener('canplaythrough', function() { 
								self.sounds[materials[i].id] = this;
								next();
							}, false);
							
							snd.src = materials[i].path;
						}
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
				
				function loadFont() {
					if (materials[i]) {
						var s = document.createElement('style'), 
						rule = "font-family: '" + materials[i].id + "'; src: url('" + materials[i].path + "');";
						s.type = "text/css";
						s.cssText = "@font-face {" + rule + "}";
						document.getElementsByTagName('head')[0].appendChild(s);
						i++;
						if (onLoad) onLoad.call(self, this);
						loadFont();
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
			}
		},
		
		/**
		@doc sound
		@class Sound Sound management
			The class uses HTML5 audio but you can use SoundManager 2 (http://www.schillmania.com/projects/soundmanager2/). 
			
			Use :
			- Insert the JS script : <script src="soundmanager2.js"></script> (http://www.schillmania.com/projects/soundmanager2/doc/getstarted/#basic-inclusion)
			- Put the swf file to the root of your project. If you want to change the path :
			<code>
			var canvas = CE.defines("canvas_id", {
				swf_sound: 'path/to/swf/'
			}).ready(function() {
			
			});
			</code>
			Assign the path with the property "swf_sound"
		@example
			Using Sound :
			<code>
			var canvas = CE.defines("canvas_id").
				ready(function() {
					canvas.Scene.call("MyScene");
				});
						
			canvas.Scene.new({
				name: "MyScene",
				materials: {
					sounds: {
						sound_id: "path/to/music.mp3"
					}
				},
				ready: function(stage) {
					canvas.Sound.get("sound_id").play();
				}
			});
			</code>
		*/
		Sound: {
			_fade: {},
			_manager: false,
			/**
				@doc sound/
				@method get Get the sound. Use API HTML5 Audio or SoundManager (http://www.schillmania.com/projects/soundmanager2/doc/#smsoundmethods)
				@param {String} id Identiant of sound in the preloading
				@return {SMSound or HTMLAudioElement}
			*/
			get: function(id) {
				var snd = CanvasEngine.Materials.sounds[id];
				if (!snd) {
					throw "The sound \"" + id + "\" does not exist";
				}
				return snd;
			},
			/**
				@doc sound/
				@method allStop  Stop all music
				@param {String} sound_id (optional) Except this music (ID)
				@return  {CanvasEngine.Sound}
			*/
			allStop: function(sound) {
				sound = sound || "";
				var sounds = CanvasEngine.Materials.sounds;
				for (var key in sounds) {
					if (key != sound) {
						sounds[key].stop();
					}
				}
				return this;
			},
			/**
				@doc sound/
				@method playOnly Only play a sound (and other stops)
				@param {Integer} id Identifier of the music
				@return  {CanvasEngine.Sound}
			*/
			playOnly: function(id) {
				this.allStop(id);
				this.get(id).play();
				return this;
			},
			/**
				@doc sound/
				@method fadeIn  To fade for unmute
				@param {String} id Identiant of sound in the preloading
				@param {Integer} duration frames
				@param {Function} callback (optional) Callback function when the fade is complete
			*/
			fadeIn: function(id, time, callback) {
				this.fadeTo(id, time, 1, callback);
			},
			/**
				@doc sound/
				@method fadeOut To fade for mute
				@param {String} id Identiant of sound in the preloading
				@param {Integer} duration frames
				@param {Function} callback (optional) Callback function when the fade is complete
			*/
			fadeOut: function(id, time, callback) {
				this.fadeTo(id, time, 0, callback);
			},
			/**
				@doc sound/
				@method fadeTo  Fade to a final value
				@param {String} id Identiant of sound in the preloading
				@param {Integer} duration frames
				@param {Integer} to End value between 0 and 1
				@param {Function} callback (optional) Callback function when the fade is complete
			*/
			fadeTo: function(id, time, to, callback) {
				var sound = this.get(id), 
					volume = this._manager ? sound.volume / 100 : sound.volume;
				this._fade[id] = {
					sound: sound,
					init: volume,
					c_volume: volume,
					f_time: time,
					to: to,
					callback: callback
				};
			},
			_loop: function() {
				var s, finish;
				for (var key in this._fade) {
					s = this._fade[key];
					finish = false;
					if (s) {
						if (s.init < s.to) {
							if (s.c_volume >= s.to) {
								s.c_volume = s.to;
								finish = true;
							}
							else {
								s.c_volume += (Math.abs(s.to - s.init) / s.f_time);
							}
							// Hack to INDEX_SIZE_ERR: DOM Exception 1 
							if (s.c_volume > .999) {
								s.c_volume = 1;
							}
						}
						else {
							if (s.c_volume <= s.to) {
								s.c_volume = s.to;
								finish = true;
							}
							else {
								s.c_volume -= (Math.abs(s.to - s.init) / s.f_time);
							}
							// Hack to INDEX_SIZE_ERR: DOM Exception 1 
							if (s.c_volume < .001) { 
								s.c_volume = 0;
							}
						}
						if (this._manager) {
						  s.sound.setVolume(s.c_volume * 100);
						}
						else {
						  s.sound.volume = s.c_volume;
						}
						if (finish) {
							if (s.callback) s.callback.call(s.sound);
							delete this._fade[key];
							break;
						}
					}
				}
			}
		},
		
		Canvas:  {
			"new": function(id) {
				return Class["new"]("Canvas", [id]);
			}
		},
		
		Element: {
			"new": function(scene, layer, width, height) {
				return Class["new"]("Element", [scene, layer, width, height]).extend("Context");
			}
		},
		
		Context:  {
			"new": function(layer) {
				return Class["new"]("Context", [layer]);
			}
		},
		
		Scene: 	{
				  _scenes: {},
				  _current: null,
				  "new": function(obj) {
					var _class = Class["new"]("Scene", [obj]).extend(obj, false);
					this._scenes[obj.name] = _class;
					return _class;
				  },
				  /**
					@doc scene/
					@method call Called a scene. Call the method "exit" of the current scene (if any) and changes of scene
					@param {String} scene name
					@example
					"canvas" is the variable initialized for CanvasEngine
					<code>
						canvas.Scene.call("SceneName");
					</code>
				 */
				  call: function(name) {
					var _class = this._scenes[name];
					if (_class) {
						if (this._current) {
							this._current._exit.call(this._current);
						}
						this._current = _class;
						_class._load.call(_class);
						
					}
					else {
						throw "Scene \"" + name + "\" doesn't exist";
					}
				  },
				  exit: function(name) {
					var _class = this._scenes[name];
					if (_class) {
						_class._exit.call(_class);
					}
				  },
				  exist: function(name) {
					return this._scenes[name] ? true : false;
				  },
				  get: function(name) {
					return this._scenes[name];
				  }
				}
	});
	
	
	Class.create("Canvas", {
		id: null,
		element: null,
		stage: null,
		ctx: null,
		_ctxMouseEvent: null,
		width: 0,
		height: 0, 
		mouseEvent: false,
		initialize: function(id) {
			var self = this;
			this.id = id;
			this.element = document.getElementById(id);
			this.width = this.element.width;
			this.height = this.element.height;
			this.ctx = this.element.getContext('2d');
			old = this.ctx;
			this._mouseEvent();
			this.element.addEventListener("click", function(e) {
				self._onClick.call(self, e, "click");
			}, false);
			this.element.addEventListener("dblclick", function(e) {
				self._onClick.call(self, e, "dblclick");
			}, false);
			this.element.addEventListener("mousemove", function(e) {
				self._onClick.call(self, e, "mousemove");
			}, false);
		},
		_onClick: function(e, type) {
			this._ctxMouseEvent.clearRect(0, 0, this.width, this.height);
			var mouse = this.getMousePosition(e);
			if (this.stage) this.stage._click(e, mouse, type);
		},
		_mouseEvent: function() {
			var canvas =  document.createElement('canvas');
			canvas.width = this.width;
			canvas.height = this.height;
			this._ctxMouseEvent = canvas.getContext('2d');
			//document.body.appendChild(canvas);
		},
		canvasReady: function() {
		},
		/**
			@method Get the X and Y position of the mouse in the canvas
			@param {Event} event
			@return Object
			@example
			<code>
				var el = this.createElement(), self = this;
				el.on("click", function(e) {
					var pos = self.getCanvas().getMousePosition(e);
					console.log(pos.x, pos.y);
				});
			</code>
		*/
		getMousePosition: function(e) {
			var obj = this.element;
			var top = 0;
			var left = 0;
			while (obj && obj.tagName != 'BODY') {
				top += obj.offsetTop;
				left += obj.offsetLeft;
				obj = obj.offsetParent;
			}
			var mouseX = e.clientX - left + window.pageXOffset;
			var mouseY = e.clientY - top + window.pageYOffset;
			return {x: mouseX, y: mouseY};
		}
	});
	
	/**
		@doc scene
		@class Scene Scene management. Structure of a scene :
			<code>
				canvas.Scene.new({
					name: "MyScene",
					materials: {
						images: {},
						sounds: {}
					},
					preload: function(stage, pourcent) {
					
					},
					ready: function(stage) {
						
					},
					render: function(stage) {
					
					},
					exit: function(stage) {
					
					}
				});
			</code>
			All parameters except "name" are optional. The "new" method created a scene but does not run. To execute:
			<code>
				canvas.Scene.call("MyScene");
			</code>
			The resources defined in "Materials" are loaded and regularly calls the method "preload" with the current percentage. When charging is completed, the method "ready" is executed only once. When the method "ready" is complete, the method "render" is called loop. If you call another scene, the method "exit" of the current scene is triggered
			"stage" is an object of type "Element". This is the main element of the scene containing all child elements to create.
	*/
	Class.create("Scene", {
		_stage: {},
		_events: [],
		_isExit: false,
		_global_elements: {},
		initialize: function(obj) {
			var ev, self = this;
			this._events = obj.events;
		},
		_loop: function() {
			var self = this;
			this._isExit = false;
			
			function loop() {			
				if (self._isExit) {
					return;
				}
				CanvasEngine.Sound._loop();
				if (self.render) self.render.call(self, self._stage);
				requestAnimationFrame(loop);
			}
			
			this._loop_id = requestAnimationFrame(loop);

		},
		emit: function(name, data) {
			this.model.call(name, data);
		},
		getElement: function(name) {
			if (this._global_elements[name]) {
				return this._global_elements[name];
			}
			return this.createElement(name);
		},
		/**
			@doc scene/
			@method getCanvas Get the canvas
			@param {Integer} id (optional) Position in array
			@return {HTMLCanvasElement}
		*/
		getCanvas: function(id) {
			if (!id) id = 0;
			return CanvasEngine.el_canvas[id];
		},
		/**
			@doc scene/
			@method createElement Create an element
			@param {String} name (optional) 
			@param {Integer} width (optional) 
			@param {Integer} height (optional) 
			@example
			In the method "ready" in the scene class :
			<code>
				var el = this.createElement();
			</code>
			--
			<code>
				var el = this.createElement("foo");
			</code>
			--
			<code>
				var el = this.createElement(100, 100);
			</code>
		*/
		 createElement: function(name, width, height) {
			if (typeof name != "string") {
				height = width;
				width = name;
			}
			var el = CanvasEngine.Element["new"](this, null, width, height);
			if (name) {
			  this._global_elements[name] = el;
			}
			return el;
		 },
		_exit: function() {	
			this._isExit = true;
			cancelAnimationFrame(this._loop_id);
			if (this.exit) this.exit.call(this);
		},
		_load: function() {
			var self = this;
			this._stage = CanvasEngine.Element["new"](this);

			
			for (var i=0 ; i < CanvasEngine.el_canvas.length ; i++) {
				CanvasEngine.el_canvas[i].stage = this._stage;
			}
			if (this.model) {		
				if (this._events) {
					CE.each(this._events, function(i, val) {
						self.model.on(val, function(data) {
							self[val].call(self, data);
						});
					});
					
				}
			}
			
			var images_length = materialLength("images"),
				sound_length = materialLength("sounds"),
				font_length = materialLength("fonts"),
				total = images_length + sound_length + font_length,
				current = 0;
			
			if (images_length > 0) {
				materialLoad("images");
			}
			if (sound_length > 0) {
				materialLoad("sounds");
			}
			if (font_length > 0) {
				materialLoad("fonts");
			}
			if (images_length == 0 && sound_length == 0 && font_length == 0) {
				canvasReady();
			}
			
			function materialLoad(type) {
				CanvasEngine.Materials.load(type, self.materials[type], function() {
					preload();
				});
			}
			
			function preload() {
				current++;
				if (self.preload) self.preload(self._stage, current / total * 100);
				if (total == current) {
					canvasReady();
				}
			}
			
			function materialLength(type) {
				var i=0;
				if (!self.materials) {
					return 0;
				}
				if (self.materials[type]) {
					for (var key in self.materials[type]) {
						i++;
					}
				}
				return i;
			}
			
			function canvasReady() {
				if (self.ready) self.ready(self._stage, self.getElement);
				if (self.model && self.model.ready) self.model.ready.call(self.model);
				self._loop();
			}
		}
	});
	
	/**
		@class Context
		@extend Element Uses the HTML5 Canvas context of the element. The drawing is stored in an array and is not displayed as the item is not attached to the scene
			<code>
				canvas.Scene.new({
					name: "MyScene",
					ready: function(stage) {
						var element = this.createElement();
						element.fillStyle = #ff0000;
						element.fillRect(20, 20, 100, 100);
						stage.append(element);
					}
				});
			</code>
	*/
	Class.create("Context", {
			_cmd: {},
			img: {},
			alpha: function(opacity) {
				this.globalAlpha = opacity;
			},
			/**
				@doc draw/
				@method fillRect. See http://www.w3schools.com/html5/canvas_fillrect.asp
			*/
			fillRect: function(x, y, w, h) {
				this._addCmd("fillRect", [x, y, w, h], ["fillStyle"]);
			},
			/**
				@doc draw/
				@method fill See http://www.w3schools.com/html5/canvas_fill.asp
			*/
			fill: function() {
				this._addCmd("fill", [], ["fillStyle"]);
			},
			/**
				@doc draw/
				@method fillText See http://www.w3schools.com/html5/canvas_filltext.asp
			*/
			fillText: function(text, x, y) {
				this._addCmd("fillText", [text, x, y], ["fillStyle", "font", "textBaseline"]);
			},
			/**
				@doc draw/
				@method strokeText See http://www.w3schools.com/html5/canvas_stroketext.asp
			*/
			strokeText: function(text, x, y) {
				this._addCmd("strokeText", [text, x, y], ["strokeStyle", "font", "textBaseline"]);
			},
			/**
				@method strokeRect See http://www.w3schools.com/html5/canvas_strokerect.asp
			*/
			strokeRect: function(x, y, w, h) {
				this._addCmd("strokeRect", [x, y, w, h], ["strokeStyle"]);
			},
			/**
				@doc draw/
				@method stroke See http://www.w3schools.com/html5/canvas_stroke.asp
			*/
			stroke: function() {
				this._addCmd("stroke", [], ["strokeStyle"]);
			},
			/**
				@doc draw/
				@method createLinearGradient See http://www.w3schools.com/html5/canvas_createlineargradient.asp
			*/
			createLinearGradient: function(x0, y0, x1, y1) {
				this._addCmd("createLinearGradient", [x0, y0, x1, y1]);
			},
			/**
				@doc draw/
				@method addColorStop See http://www.w3schools.com/html5/canvas_addcolorstop.asp
			*/
			addColorStop: function(i, color) {
				this._addCmd("addColorStop", [i, color]);
			},
			/**
				@doc draw/
				@method drawImage Draws the image or part of the image
				@param {String|Image|Canvas} img If this is a string, this is the identifier of the preloaded image
				@param {Integer} sx (optional) 
				@param {Integer} sy (optional) 
				@param {Integer} sw (optional) 
				@param {Integer} sh (optional) 
				@param {Integer} dx (optional) 
				@param {Integer} dy (optional) 
				@param {Integer} dw (optional) 
				@param {Integer} dh (optional) 
				@example
				In the method "ready" in the scene class :
				<code>
					var el = this.createElement();
					el.drawImage("img");
				</code>
				--
				<code>
					el.drawImage("img", 10, 30);
				</code>
				--
				<code>
					el.drawImage("img", 10, 30, 100, 100, 0, 0, 100, 100);
				</code>
				--
				<code>
					el.drawImage("img", 0, 0, "30%");
				</code>
				@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
			*/
			drawImage: function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
				var array, _img = img;
				if (!sx) sx = 0;
				if (!sy) sy = 0;
				if (typeof img === "string") {
					_img = CanvasEngine.Materials.images[img];
					if (!_img) {
						throw "Cannot to draw the image \"" + img + "\" because it does not exist";
						return;
					}
					this.img.width = _img.width;
					this.img.height = _img.height;
				}
				if (/%$/.test(sw)) {
					dx = sx;
					dy = sy;
					sx = 0;
					sy = 0;
					sw = _img.width * parseInt(sw) / 100;
					sh = _img.height;
					dw = sw;
					dh = sh;
				}
				if (sw !== undefined) {
					array = [_img, sx, sy, sw, sh, dx, dy, dw, dh];
				}
				else {
					array = [_img, sx, sy];
				}
				this._addCmd("drawImage", array);
			},
			/**
				@doc draw/
				@method arc See http://www.w3schools.com/html5/canvas_arc.asp
			*/
			arc: function(x, y, w, h, radius, b) {
				this._addCmd("arc", [x, y, w, h, radius, b]);
			},
			/**
				@doc draw/
				@method clip See http://www.w3schools.com/html5/canvas_clip.asp
			*/
			clip: function() {
				this._addCmd("clip");
			},
			/**
				@doc draw/
				@method beginPath See http://www.w3schools.com/html5/canvas_beginpath.asp
			*/
			beginPath: function() {
				this._addCmd("beginPath");
			},
			/**
				@doc draw/
				@method closePath See http://www.w3schools.com/html5/canvas_closepath.asp
			*/
			closePath: function() {
				this._addCmd("closePath");
			},
			/**
				@doc draw/
				@method translate http://www.w3schools.com/html5/canvas_translate.asp
			*/
			translate: function(x, y) {
				this.draw("translate", [x , y]);
			},
			/**
				@doc draw/
				@method rotate See http://www.w3schools.com/html5/canvas_rotate.asp
			*/
			rotate: function(rad) {
				this.draw("rotate", [rad]);
			},
			/**
				@doc draw/
				@method rotateDeg Degree rotation
				@param {Integer} deg 
			*/
			rotateDeg: function(deg) {
				this.rotate(deg * Math.PI / 180);
			},
			/**
				@doc draw/
				@method scale See http://www.w3schools.com/html5/canvas_scale.asp
			*/
			scale: function(scaleX, scaleY) {
				this.draw("scale", [scaleX, scaleY]);
			},
			/**
				@doc draw/
				@method clear Erases the content of canvas
			*/
			clear: function() {
				this.setTransform(1, 0, 0, 1, 0, 0);
				this.clearRect(0, 0, this._canvas[0].width, this._canvas[0].height);
			},
			/**
				@doc draw/
				@method clearRect See http://www.w3schools.com/html5/canvas_clearrect.asp
			*/
			clearRect: function(x , y , w , h) {
				this.draw("clearRect", [x , y , w , h]);
			},
			/**
				@doc draw/
				@method setTransform See http://www.w3schools.com/html5/canvas_settransform.asp
			*/
			setTransform: function(a, b, c, d, e, f) {
				this.draw("setTransform", [a, b, c, d, e, f]);
			},
			/**
				@doc draw/
				@method transform See http://www.w3schools.com/html5/canvas_transform.asp
			*/
			transform: function(a, b, c, d, e, f) {
				this.draw("transform", [a, b, c, d, e, f]);
			},
			/**
				@doc draw/
				@method rect See http://www.w3schools.com/html5/canvas_rect.asp
			*/
			rect: function(x, y, w, h) {
				this._addCmd("rect", [x, y, w, h]);
			},
			/**
				@doc draw/
				@method save Saves the state of the current context
				@param {Boolean} cmd (optional) If false, the method applies directly. false by default
			*/
			save: function(cmd) {
				if (cmd) {
					this._addCmd("save");
				}
				else {
					this.draw("save");
				}
			},
			/**
				@doc draw/
				@method restore Returns previously saved path state and attributes
				@param {Boolean} cmd (optional) If false, the method applies directly. false by default
			*/
			restore: function(cmd) {
				if (cmd) {
					this._addCmd("restore");
				}
				else {
					this.draw("restore");
				}
			},
			/**
				@doc draw/
				@method clearPropreties Assigned undefined to all properties HTML5 Canvas element
			*/
			clearPropreties: function() {
				var prop = ["shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalAlpha", "globalCompositeOperation", "lineJoin", "lineWidth", "miterLimit", "fillStyle", "font", "textBaseline", "strokeStyle"];
				for (var k=0 ; k < prop.length ; k++) {
					if (this[prop[k]]) this[prop[k]] = undefined;
				}
				
			},
			draw: function(name, params, propreties) {
				layer = this._layer || "ctx";
				params = params || [];
				propreties = propreties || {};
				
				var cmd, array_cmd = {};
				var cmd_propreties = [];
				var isCmd = true;
				if (name) {
					array_cmd[name] = {params: params, propreties: propreties};
					isCmd = false;
				}
				else {
					array_cmd = this._cmd;
				}
				for (var name in array_cmd) {
					cmd = array_cmd[name];
					for (var j=0 ; j < this._canvas.length ; j++) {
						cmd_propreties = cmd.propreties;
						if (isCmd && name == "restore") {	
							this.clearPropreties();
						}
						if (cmd_propreties) {
							for (var key in cmd_propreties) {
								this._canvas[j][layer][key] = cmd_propreties[key];
							}
						}
						this._canvas[j][layer][name].apply(this._canvas[j][layer], cmd.params);
					}
				}

			},
			_addCmd: function(name, params, propreties) {
				params = params || [];
				propreties = propreties || [];
				
				var prop = ["shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalAlpha", "globalCompositeOperation", "lineJoin", "lineWidth", "miterLimit"];
				propreties = propreties.concat(prop);
				var obj = {};
				for (var k=0 ; k < propreties.length ; k++) {
					if (this[propreties[k]]) obj[propreties[k]] = this[propreties[k]];
				}
				this._cmd[name] = {params: params, propreties: obj};
			}
	});
	
	/**
		@doc element
		@class Element Manipulate elements on the scene.
			1. Create an element with the createElement method :
			<code>
				canvas.Scene.new({
					name: "MyScene",
					ready: function(stage) {
						var element = this.createElement(); // new Element object
					}
				});
			</code>
			2. Add this element in the stage :
			<code>
				canvas.Scene.new({
					name: "MyScene",
					ready: function(stage) {
						var element = this.createElement();
						stage.append(element); // add in the stage
					}
				});
			</code>
	*/
	Class.create("Element", {
		_children: [],
		_attr: {},
		/**
			@doc manipulate/
			@property x Position X relative to the parent
			@type Integer
			@default 0
		*/
		x: 0,
		/**
			@doc manipulate/
			@property y Position Y relative to the parent
			@type Integer
			@default 0
		*/
		y: 0,
		real_x: 0,
		real_y: 0,
		/**
			@doc manipulate/
			@property scaleX Scale in X. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		scaleX: 1,
		/**
			@doc manipulate/
			@property scaleY Scale in Y. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		scaleY: 1,
		/**
			@doc manipulate/
			@property skewX Shew in X.
			@type Integer
			@default 0
		*/
		skewX: 0,
		/**
			@doc manipulate/
			@property skewY Shew in Y.
			@type Integer
			@default 0
		*/
		skewY: 0,
		/**
			@doc manipulate/
			@property opacity Opacity. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		opacity: 1,
		/**
			@doc manipulate/
			@property rotation Rotation.
			@type Integer
			@default 0
		*/
		rotation: 0,
		/**
			@doc manipulate/
			@property width Width. Only if  value has been assigned to the creation of the element
			@type Integer
			@default null
			@example
			<code>
				var foo = this.createElement(10, 20);
					console.log(foo.width) // 10
			</code>
		*/
		width: null,
		/**
			@doc manipulate/
			@property height Height. Only if  value has been assigned to the creation of the element
			@type Integer
			@default null
			@example
			<code>
				var foo = this.createElement(10, 20);
					console.log(foo.height) // 20
			</code>
		*/
		height: null,
		/**
			@doc manipulate/
			@property regX Position X of the point of origin.
			@type Integer
			@default 0
		*/
		regX: 0,
		/**
			@doc manipulate/
			@property regY Position Y of the point of origin.
			@type Integer
			@default 0
		*/
		regY: 0,
		/**
			@doc traversing/
			@property parent Parent element
			@type CanvasEngine.Element
		*/
		parent: null,
		pause: false,
		index: 0,
		_id: null,
		_layer: "ctx",
		_visible: true,
		_listener: {},
		_loop_listener: [],
		_out: 1,
		_over: 0,
		initialize: function(scene, layer, width, height) {
			this._id = _CanvasEngine.uniqid();
			this.width = width;
			this.height = height;
			this.scene = scene;
			this.stage = scene._stage;
			this.layer = layer;
			this._canvas = CanvasEngine.el_canvas;
		},
		/**
			@doc draw/
			@method refresh Refreshes the elements of the scene	
		*/
		refresh: function() {
			this.clear();
			this._refresh(true);
		},
		_refresh: function(init, children) {
			children = children === undefined ? true : children;
			if (!this._visible) return;
			
			if (!this.real_pause) {
			
				this.save();
					
				this.setTransform(1, 0, 0, 1, 0, 0);
				this.real_y = (init ? 0 : this.parent.real_y) + this.y;
				this.real_x = (init ? 0 : this.parent.real_x) + this.x;
				this.real_scale_x = (init ? 1 : this.parent.real_scale_x * this.scaleX);
				this.real_scale_y = (init ? 1 : this.parent.real_scale_y * this.scaleY) ;
				this.real_skew_x = (init ? 0 : this.parent.real_skew_x) + this.skewX;
				this.real_skew_y = (init ? 0 : this.parent.real_skew_y) + this.skewY ;
				this.real_rotate = (init ? 0 : this.parent.real_rotate) + this.rotation ;
				this.real_pause = init ? this.pause : this.parent.pause;
				this.alpha(this.opacity);
				var regX = this.real_x + this.regX;
				var regY = this.real_y + this.regY;
				this.translate(regX, regY);
				if (this.rotation != 0) {
					this.rotateDeg(this.rotation);
				}
				this.scale(this.real_scale_x, this.real_scale_y);
				this.transform(1, this.real_skew_x, this.real_skew_y, 1, 0, 0);
				this.translate( this.real_x,  this.real_y);
				this.translate(-regX, -regY);
			}
			
			this.draw();
			
			this.restore();
			
			if (children) {
				if (!this.real_pause) this._loop();
				for (var i=0 ; i < this._children.length ; i++) {
					
					this._children[i]._refresh();
				}
			}
		},
		/**
			@doc manipulate/
			@method rotateTo A rotation element in a direction
			@param {Integer|String} val In degrees. To select the unit, add the suffix: "deg" or "rad". Example : "10rad" or "90deg"
			@param {Boolean} counterclockwise (optional) Direction of rotation. true: counterclockwise (false by default)
			@return CanvasEngine.Element
		*/
		rotateTo: function(val, counterclockwise) {
			var _val = parseInt(val);
			if (/rad$/.test(val)) {
				_val = _val * 180 / Math.PI;
			}
			
			this.rotation = counterclockwise ? 360 - _val : _val;
			this.refresh();
			return this;
		},
		/**
			@doc manipulate/
			@method setOriginPoint Defining the position of the point of origin. This amounts to assign values to properties regX and regY
			@param {Integer} x position X
			@param {Integer} y position Y
			@return CanvasEngine.Element
		*/
		/**
			@method setOriginPoint Designate the placement of the point of origin. By cons, you must define the size of the element
			@param {String} val Put "middle" position to the midpoint of the element
			@return CanvasEngine.Element
		*/
		setOriginPoint: function(x, y) {
			if (x == "middle") {
				if (this.width && this.height) {
					x = Math.round(this.width / 2);
					y = Math.round(this.height / 2);
				}
				else {
					throw "Width and Height proprieties are not defined";
				}
			}
			if (x !== undefined) this.regX = +x;
			if (y !== undefined) this.regY = +y;
			return this;
		},
		_click: function(e, mouse, type) {
			var el, el_real, imgData, find, _trigger, over;
			for (var i=0 ; i < this._children.length ; i++) {
				el_real = this._children[i];
				if (self.mouseEvent || type == "click") {
					el = el_real.clone();
					el._layer = "_ctxMouseEvent";
					el._refresh(false, false);
					imgData = this._canvas[0][el._layer].getImageData(mouse.x, mouse.y, 1, 1);
					over = imgData.data[3] > 0;
					
				}
				else {	
					over = mouse.x > el_real.real_x && mouse.x < el_real.real_x + el_real.width &&
						mouse.y > el_real.real_y && mouse.y < el_real.real_y + el_real.height;
				}
				if (over) {
					if (type == "click" || type == "dblclick") {
						_trigger = el_real.trigger(type, e);
					}
					else if (type == 'mousemove' && el_real._out == 1) {
						el_real._out++;
						el_real._over = 1;
						_trigger = el_real.trigger("mouseover", e);
					}
					if (_trigger) return;
				}
				else {
					if (type == 'mousemove' && el_real._over == 1) {
						el_real._out = 1;
						el_real._over++;
						_trigger = el_real.trigger("mouseout", e);
					}
				}
				if (self.mouseEvent || type == "click") {
					el.clear();
					el._click(e, mouse, type);
				}
			}
		},
		/**
			@doc manipulate/
			@method clone Creating a clone element
			@return CanvasEngine.Element
		*/
		clone: function() {
			var el = this.scene.createElement();
			for (var key in this) {
				if (typeof key != "function") {
					el[key] = this[key];
				}
			}
			return el;
		},
		/**
			@doc manipulate/
			@method inserts the specified content as the last child of each element in the Element collection
			@param {CanvasEngine.Element} el 
			@return CanvasEngine.Element
		*/
		append: function(el) {
			this._children.push(el);
			el.parent = this;
			el.index++;
			el._refresh();
			return el;
		},
		/**
			@doc manipulate/
			@method remove Removes element in stage
			@return {Boolean} "true" if removed
			@example
				<code>
					var foo = this.createElement(),
						bar = this.createElement();
						
					foo.append(bar);
					stage.append(foo);
					foo.remove();
					// stage is empty
				</code>
		*/
		remove: function() {
			var child;
			for (var i=0 ; i < this.parent._children.length ; i++) {
				child = this.parent._children[i];
				if (this._id == child._id) {
					this.parent._children.splice(i, 1);
					this.stage.refresh();
					return true;
				}
			}
			return false;
		},
		/**
			@doc manipulate/
			@method emtpy Removes the element's children
			@return {Element}
			@example
				<code>
					var foo = this.createElement(),
						bar = this.createElement();
						
					foo.append(bar);
					stage.append(foo);
					foo.empty();
					// "bar" no longer exists
				</code>
		*/
		empty: function() {
			this._children = [];
			//this.stage.refresh();
			return this;
		},
		/**
			@doc manipulate/
			@method attr Get the value of an attribute for the element
			@param  {String} name
			@return {Object}
		*/
		/**
			@method attr Set the value of an attribute for the element
			@param  {String} name
			@param  {Object} value
			@return {Element}
		*/
		attr: function(name, value) {
			if (value === undefined) {
				return this._attr[name];
			}
			this._attr[name] = value;
			return this;
		},
		// TODO
		offset: function() {
			return {
				left: this.x,
				top: this.y
			};
		},
		// TODO
		position: function() {
			return {
				left: this.real_x,
				top: this.real_y
			};
		},
		/**
			@doc manipulate/
			@method scaleTo Resizes the width and height. Equivalent to scaleX=val and scaleY=val
			@params {Integer} val Value of 1 represents 100%.
			@return {Element}
		*/
		scaleTo: function(val) {
			this.scaleX = val;
			this.scaleY = val;
			this.refresh();
			return this;
		},
		/*
			TODO
		*/
		css: function(prop, val) {
			var obj = {};
			var match;
			if (typeof prop == "string") {
				obj[prop] = val;
			}
			else {
				obj = prop;
			}
			if (obj.left) this.x = parseInt(obj.left);
			if (obj.top) this.y = parseInt(obj.top);
			if (obj['box-shadow']) {
				match = /^([0-9]+)(px)? ([0-9]+)(px)? ([0-9]+)(px)? (#[0-9a-fA-F]{6})$/.exec(obj['box-shadow']);
				if (match) {
					this.shadowColor = match[7];
					this.shadowBlur = match[5];
					this.shadowOffsetX = match[1];
					this.shadowOffsetY = match[3];
				}
			}
			if (obj['linear-gradient']) {
				match = /^\(([a-z ]+),[ ]*(.+)\)$/.exec(obj['linear-gradient']);
				if (match) {
					var pos = match[1];
					var gradients = match[2].split(",");
					this.createLinearGradient(0, 0, 0, 0);
					for (var i=0 ; i < gradients.length ; i++) {
						match = /^(#[0-9a-fA-F]{6})[ ]+([0-9]{1,3})%$/.exec(gradients[i]);
						if (match) this.addColorStop(match[2]/100, match[1]);
					}
				}
			}
			if (obj.opacity) this.opacity = obj.opacity;
			this.stage.refresh();
			return this;
		},
		/**
			@doc manipulate/
			@method hide hide element and refresh the stage
		*/
		hide: function() {
			this._visible = false;
			this.stage.refresh();
		},
		/**
			@doc manipulate/
			@method show hide element and refresh the stage
		*/
		show: function() {
			this._visible = true;
			this.stage.refresh();
		},
		/**
			@doc manipulate/
			@method toggle Hide the element if visible or shown if hidden
		*/
		toggle: function() {
			if (this._visible) {
				this.hide();
			}
			else {
				this.show();
			}
		},
		/**
			@doc events/
			@method on The .on() method attaches event handlers to the currently selected set of elements in the CanvasEngine object.
			@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
			@param {Function} callback(event) A function to execute when the event is triggered
		*/
		bind: function(event, callback) { this.on(event, callback); },
		on: function(events, callback) {
			var event;
			events = events.split(" ");
			for (var i=0 ; i < events.length ; i++) {
				event = events[i];
				if (!this._listener[event]) {
					this._listener[event] = [];
				}
				this._listener[event].push(callback);
			}
		},
		/**
			@doc events/
			@method trigger Any event handlers attached with .on() or one of its shortcut methods are triggered when the corresponding event occurs. They can be fired manually, however, with the .trigger() method.
			@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
		*/
		trigger: function(events, e) {
			var event, _trigger = false;;
			events = events.split(" ");
			for (var j=0 ; j < events.length ; j++) {
				event = events[j];
				if (this._listener[event]) {
					for (var i=0 ; i < this._listener[event].length ; i++) {
						 _trigger = true;
						this._listener[event][i].call(this, e);
					}
				}
			}
			return _trigger;
		},
		/**
			@doc events/
			@method click Equivalent to the method .on("click", function)
			@params {Function} callback
		*/
		click: function(callback) {
			this.on("click", callback);
		},
		/**
			@doc events/
			@method dblclick Equivalent to the method .on("dblclick", function)
			@params {Function} callback
		*/
		dblclick: function(callback) {
			this.on("dblclick", callback);
		},
		/**
			@doc events/
			@method mouseover Equivalent to the method .on("mouseover", function)
			@params {Function} callback
		*/
		mouseover: function(callback) {
			this.on("mouseover", callback);
		},
		/**
			@doc events/
			@method mouseout Equivalent to the method .on("mouseout", function)
			@params {Function} callback
		*/
		mouseout: function(callback) {
			this.on("mouseout", callback);
		},
		_loop: function() {
			for (var i=0 ; i < this._loop_listener.length ; i++) {
				this._loop_listener[i].call(this);
			}
		},
		/**
			@doc events/
			@method addLoopListener Adds a function that executes the loop for rendering the element
			@param {Function} callback() Callback
			@example
			In the method "ready" in the scene class :
			<code>
				var el = this.createElement();
				el.addLoopListener(function() {
					this.x += 3;
				});
			</code>
		*/
		addLoopListener: function(callback) {
			this._loop_listener.push(callback);
		}
	});
	
	CanvasEngine = Class["new"]("CanvasEngineClass");
	return CanvasEngine;
}
var CE = CanvasEngine;
