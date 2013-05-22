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

var prop, vendors = ['ms', 'moz', 'webkit', 'o', 'khtml'];
				
for(var x = 0; x < vendors.length && !Element.prototype.requestFullScreen; ++x) {
	Element.prototype.requestFullScreen = Element.prototype[vendors[x]+'RequestFullScreen'];
	document.cancelFullScreen =  document[vendors[x]+'CancelFullScreen'];
}


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

var Model = Class["new"]("ModelClientClass"),
	Global_CE;
	

/**
	@class CanvasEngine
	@static
	@details
		
	See "defines" method
			
*/
 /**
@doc engine/
@method defines Initialize CanvasEngine  by setting the canvas 
@static
@param {String} canvas canvas ID
@param {Object} params (optional) additional parameters

* swf_sound : see Sound class
* cocoonjs : Object indicating the size of the canvas. Use this property if you want to compile your project with CocoonJS (http://ludei.com)
	
	Example : 
		
		{width: 640, height: 480}

* render : Do not rendering (true by default)
* contextmenu `(>= 1.2.6)` : Show right-click menu (false by default)

		
@return CanvasEngineClass
@example
"CE"  is equivalent to "CanvasEngine"

	var canvas = CE.defines("canvas_id").
				 ready(function() {
					// DOM is ready
				 });
				 
View `ready` method
 */
CanvasEngine.defines = function(canvas, params) {
	params = params || {};
	if (params.render === undefined) params.render = true;
	if (typeof canvas == "string") {
		canvas = [canvas];
	}
	var CanvasEngine;
/**
@doc engine
@class CanvasEngineClass Main class to use Canvas Engine
		
	var canvas = CE.defines("canvas_id"); // CanvasEngine object

	canvas.ready(function(ctx) {
		canvas.Scene.call("MyScene");
	});
		
*/
	Class.create("CanvasEngineClass", {
		_noConflict: false, 
		initialize: function(element) {
			this.canvas = canvas;
			this.el_canvas = [];
		},
/**
@doc engine/
@method ready Calls the function when DOM is ready. The method uses "window.load" or SoundManager callback if it is present. If the DOM is already loaded (with jquery by example). Do not put the callback function
@param {Function} callback
@return CanvasEngineClass
@example

	var canvas = CE.defines("canvas_id").
				 ready(function() {
					// DOM is ready
				 });
				 
With jQuery :

	$(function() {
		var canvas = CE.defines("canvas_id").ready();
	});
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
			else if (!callback) {
				onReady();
			}
			else {
				window.onload = onReady;
			}
			
			function onReady() {	
				for (var i=0 ; i < self.canvas.length ; i++) {
					self.el_canvas.push(self.Canvas["new"](self.canvas[i]));
				}
				if (params.render) CanvasEngine.Scene._loop(self.el_canvas);
				if (callback) callback();	
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
@class Materials Resource management game. The class is used with the properties "materials" in the scene but you can still use it for loading external resources to the scene
@example
Using Sound :

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
*/
		Materials: {
			images: {},
			_buffer: {},
			_cache_canvas: {},
			sounds: {},
			fonts: {},
/**
@doc materials/
@method get Get the picture or sound according to its identifier
@param {String} id
@param {String} type (optional) If two identical identifier is several types, specify the type: "image" or "sound"
@return {HTML5Audio|Image}
*/
			get: function(id, type) {
			
				if (type) {
					return this[type + "s"][id];
				}	
			
				if (this.images[id]) {
					return this.images[id];
				}
				else if (this.sounds[id]) {
					return this.sounds[id];
				}
				else if (id instanceof Image || id instanceof HTMLCanvasElement) {
					return id;
				}
				throw "Cannot to draw the image or sound \"" + id + "\" because it does not exist";
			},
			
/**
@doc materials/
@method imageToCanvas Converts an image (Image) in Canvas. The returned object is :
	{
		canvas: {HTML5CanvasElement},
		ctx: {Context2d}
	}
@param {String} id Image id
@param {Boolean} cache Image id
@return {Object}
*/
			imageToCanvas: function(id, cache) {
				if (this._cache_canvas[id] && cache) {
					return this._cache_canvas[id];
				} 
				var img = this.get(id), canvas, ctx;
				
				canvas =  document.createElement('canvas');		
				canvas.width = img.width;
				canvas.height = img.height;
				ctx = canvas.getContext('2d');
				
				ctx.drawImage(img, 0, 0);

				this._cache_canvas[id] = {
					canvas: canvas,
					ctx: ctx
				};
				
				return this._cache_canvas[id];
			},
			
			// obsolete
			createBuffer: function(id, color) {
				
				if (this._buffer[color]) {
					return this._buffer[color];
				}
				canvas =  this.get(id) ;
				this._buffer[color] = canvas;
				return canvas;
				
				var _canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;
				canvas.id = color;
				ctx.globalCompositeOperation = 'source-atop';
				ctx.fillStyle = "#" + color;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				this._buffer[color] = canvas;

				return canvas;
			},
			
/**
@doc materials/
@method transparentColor Make a color transparent in the image
@param {String} id Image id
@param {String} color hexadecimal code
@param {Boolean} cache (optional) Puts the canvas generated in cache (false by default)
@return {HTML5Canvas}
*/
			transparentColor: function(id, color, cache) {
				var imageData, data, rgb, 
					_canvas = this.imageToCanvas(id, cache),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;

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
// @method invertColor Inverts the colors of the image
@param {String} id Image id
@param {Boolean} cache (optional) Puts the canvas generated in cache (false by default)
@return {HTML5Canvas}
*/	
			invertColor: function(id, cache) {
				var imageData, data, 
					_canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;
					
				data = imageData.data;

				for(var i = 0; i < data.length; i += 4) {
				  data[i] = 255 - data[i];
				  data[i + 1] = 255 - data[i + 1];
				  data[i + 2] = 255 - data[i + 2];
				}
				
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
			
/**
@doc materials/
@method cropImage Can crop an image to use independently. Useful for creating patterns in HTML5
@param {String} id Image id
@param {Integer} x Position X
@param {Integer} y Position Y
@param {Integer} w Width
@param {Integer} h height
@return {HTML5Canvas}
*/
			cropImage: function(id, x, y, w, h) {
				var imageData, data, rgb, 
					_canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx
				imageData = ctx.getImageData(x, y, w, h);
				canvas.width = w;
				canvas.height = h;
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
			
			// TODO
			// Nearest-neighbor
			
/**
@doc materials/
@method getExtension Gets the file extension
@param {String} filename File name
@return {String}
*/
			getExtension: function(filename) {
				return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
			},
			
/**
@doc materials/
@method getBasePath Retrieves the base of a path
@param {String} path Path
@return {String}
@example

	canvas.Materials.getBasePath("sound/sample.mp3"); // return "sound"

*/
			getBasePath: function(path) {
				return path.substring(0, path.lastIndexOf('/'));
			},

/**
@doc materials/
@method getFilename Gets the file name with or without the extension in a path
@param {String} path Path
@param {Boolean} ext (optional) Show extension if true (false by default)
@return {String}
@example

	canvas.Materials.getFilename("sound/sample.mp3"); // return "sample"

*/			
			getFilename: function(path, ext) {
				var parts = path.replace(/^.*[\\\/]/, '');
				if (!ext) {
					parts = parts.split('.');
				}
				else {
					return parts;
				}
				return parts.slice(0, parts.length - 1).join(".");
			},
			
/**
@doc materials/
@method load Load a resource
@param {String} type Type : "images" or "sounds"
@param {Array|Object} path Paths to resources.
* If array : Elements are composed of objects where the key is the identifier and value is the path
	
		[
			{img1: "path/to/img1.png"},
			{img2: "path/to/im2.png"}
		]
	
* If object, the key is the identifier and value is the path :
	
	{img1: "path/to/img1.png", img2: "path/to/im2.png"}
	
The value can be an object to give several parameters :
	
	{img1: {path: "path/to/img1.png", transparentcolor: "#ff0000"}, img2: "path/to/im2.png"}
	
"path" is the path and "transparentcolor" the color that will be transparent image
*/
			load: function(type, path, onLoad, onFinish) {
				var i=0, p, self = this, materials = [], img_data;
				
				if (!(path instanceof Array)) {
					path = [path]
				}
				
				for (var j=0 ; j < path.length ; j++) {
					p = path[j];
					if (p.id) {
						materials.push(p);
					}
					else {
						for (var key in p) {
							img_data = {};
							if (typeof p[key] == "string") {
								img_data.path = p[key];
							}
							else {
								img_data.path = p[key].path;
								img_data.transparentcolor = p[key].transparentcolor;
							}
							materials.push({
								id: key,
								path: img_data.path,
								transparentcolor: img_data.transparentcolor
							});
							
						}
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
								_img = self.transparentColor(img, materials[i].transparentcolor);
							}
							else {
								_img = img;
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
							var snd = new Audio(), 
								_p = materials[i].path,
								base = self.getBasePath(_p),
								filename = self.getFilename(_p),
								ext = self.getExtension(_p);
								
							var audio_test = {
								"mp3": snd.canPlayType('audio/mpeg'),
								"ogg": snd.canPlayType('audio/ogg; codecs="vorbis"'),
								"m4a": snd.canPlayType('audio/mp4; codecs="mp4a.40.2"')
							};
							

							if (!audio_test[ext]) {
								for (var key_ext in audio_test) {
									if (ext == key_ext) continue;
									if (audio_test[key_ext]) {
										_p = base + "/" + filename + "." + key_ext;
										break;
									}
								}
							}
							
							snd.setAttribute("src", _p);
							snd.addEventListener('canplaythrough', function() { 
								self.sounds[materials[i].id] = this;
								next();
							}, false);
							snd.addEventListener('error', function (e) { 
								
							}, false);
							snd.load();
							snd.pause();
							document.body.appendChild(snd);
							
							// For iOS
							// http://developer.apple.com/library/safari/#documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html
							if (/^i/.test(_CanvasEngine.mobileUserAgent())) {
								self.sounds[materials[i].id] = snd;
								next(); // skip "canplaythrough"
							}
	
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
The class uses HTML5 audio but you can use SoundManager 2 [http://www.schillmania.com/projects/soundmanager2/](http://www.schillmania.com/projects/soundmanager2/). 

Use :

* Insert the JS script : `<script src="soundmanager2.js"></script>` [http://www.schillmania.com/projects/soundmanager2/doc/getstarted/#basic-inclusion](http://www.schillmania.com/projects/soundmanager2/doc/getstarted/#basic-inclusion)
* Put the swf file to the root of your project. If you want to change the path :

		var canvas = CE.defines("canvas_id", {
			swf_sound: 'path/to/swf/'
		}).ready(function() {

		});

Assign the path with the property `swf_sound`
@example
Using Sound :
	
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
	
Here, CanvasEngine fetches the MP3 file in the `sound` folder. If the browser does not support it (like Firefox), it's OGG or M4A file with the same name will be searched.

1. First load : `path/to/music.mp3`
2. If no supported : `path/to/music.ogg`
3. If no supported : `path/to/music.m4a`
	
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
				var snd = CanvasEngine.Materials.get(id, "sound");
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
				return Class["new"]("Element", [scene, layer, width, height]);
			}
		},
		
		Context:  {
			"new": function(layer) {
				return Class["new"]("Context", [layer]);
			}
		},
		
		Scene: 	{
				  _scenes: {},
				  _cacheScene: {},
				  _scenesEnabled: {},
				  _scenesIndex: [],
				  _scenesNbCall: {},
				  _current: null,
				  
				  New: function() { return this["new"].apply(this, arguments); },
				  "new": function(obj) {
					var _class;
					if (typeof obj == "string") {
						if (!this._cacheScene[obj]) {
							throw "Please initialize '" + obj + "' scene with an object before";
						}
						obj = this._cacheScene[obj];
					}
					else {
						this._cacheScene[obj.name] = obj;
					}
					_class = Class["new"]("Scene", [obj]).extend(obj, false);
					this._scenesNbCall[obj.name] = 0;
					this._scenes[obj.name] = _class;
					return _class;
				  },
/**
@doc scene/
@method call Called a scene. Call the method "exit" of the current scene (if any) and changes of scene
@param {String} scene name
@param {Object} (optional) params Display settings of the scene

* overlay {Boolean} : Displays the scene over the previous scenes without leave
* exitScenes {Object} : Parameter to indicate which scene to leave and when
	* allExcept (optional) {Array} : Names of other scenes not to leave
	* when (optional) {String} : When should I leave the scenes calling the scene
		* "afterPreload" : When the scene is called preloaded
	* params (optional) {Object} Other params
@return {CanvasEngine.Scene}
@example

"canvas" is the variable initialized for CanvasEngine

	canvas.Scene.call("SceneName");


Superimposed scenes

	canvas.Scene.call("SceneName", {
		overlay: true
	});


Leaving the other scenes after preloading of the scene called

	canvas.Scene.call("SceneName", {
		exitScenes: {
			when: "afterPreload"
		}
	});
	
With other parameters :

	canvas.Scene.call("SceneName", {
		params: {"foo": "bar"}
	});
	
and, in `ready` method :

	ready: function(stage, el, params) {
		console.log(params.foo) // bar
	}

*/
				  call: function(name, params) {
					if (this._scenesNbCall[name] > 0) {
						this.New(name);
					}
					var _class = this._scenes[name], _allExcept = [name];
					params = params || {};
					if (_class) {
						this._scenesEnabled[name] = _class;
						if (this._scenesIndex.indexOf(name) == -1) this._scenesIndex.push(name);
						if (params.exitScenes) {
							params.exitScenes.allExcept = params.exitScenes.allExcept || [];
							params.exitScenes.allExcept = _allExcept.concat(params.exitScenes.allExcept);
							_class._load.call(_class, params.exitScenes, params.params);
						}
						else {
							if (!params.overlay) this.exitAll(_allExcept);
							_class._load.call(_class, {}, params.params);
						}
						this._scenesNbCall[name]++;
					}
					else {
						throw "Scene \"" + name + "\" doesn't exist";
					}
					return _class;
				  },
/**
@doc scene/
@method exit Leave a scene
@param {String} scene name
@example

	canvas.Scene.exit("SceneName");

*/
				  exit: function(name) {
					var _class = this._scenesEnabled[name];
					if (_class) {
						_class._exit.call(_class);
						for (var i=0 ; i < this._scenesIndex.length ; i++) {
							if (this._scenesIndex[i] == name) {
								delete this._scenesIndex[i];
								break;
							}
						}
						delete this._scenesEnabled[name];
					}
				  },
/**
@doc scene/
@method isEnabled Whether the scene is displayed
@param {String} scene name
@return {Boolean}
@example

	if (canvas.Scene.isEnabled("SceneName")) {}

*/
				   isEnabled: function(name) {
						return this._scenesEnabled[name] ? true : false;
				   },
				   
/**
@doc scene/
@method exitAll Disables all scenes except one or more scene
@param {String|Array} scene name or array of scene name
@example

	canvas.Scene.exitAll("SceneName");

*/
				   exitAll: function(exception) {
						var key;
						if (!(exception instanceof Array)) {
							exception = [exception];
						}
						for (key in this._scenesEnabled) {
							if (_CanvasEngine.inArray(key, exception)) {
								this.exit(key);
							}
						}
				   },
				   
/**
@doc scene/
@method exist Return true if the scene exist
@param {String} scene name
@return {Boolean}
@example

	if (canvas.Scene.exist("SceneName")) {}

*/
				  exist: function(name) {
					return this._scenes[name] ? true : false;
				  },
/**
@doc scene/
@method get Get scene
@param {String} scene name
@return {CanvasEngine.Scene}
@example

	var scene = canvas.Scene.get("SceneName");
	scene.pause(true);

*/
				  get: function(name) {
					return this._scenes[name];
				  },
				  
/**
@doc scene/
@method getEnabled Get activated scenes
@return {Object}
@example

	var scenes = canvas.Scene.getEnabled();
	for (var name in scenes) {
		console.log(name);
	}

*/
				  getEnabled: function() {
					return this._scenesEnabled;
				  },
				  
				  
				 
				  _loop: function(canvas) {
						var self = this, j, s;

						function loop() {	
							var key,  i=0;
							
							CanvasEngine.Sound._loop();
							
							canvas[i].clear();
							canvas[i]._ctxMouseEvent.clearRect(0, 0, canvas[i].width, canvas[i].height);
							for (j=0 ; j < self._scenesIndex.length ; j++) {
								s = self._scenesEnabled[self._scenesIndex[j]];
								if (s) s._loop();
							}
							
							requestAnimationFrame(loop);
						}
						
						requestAnimationFrame(loop);
				 },
			}
	});
	
/**
	@doc canvas
	@class Canvas Manage canvas element
	@example
		
<jsfiddle>WebCreative5/GkUsE</jsfiddle>
*/
	Class.create("Canvas", {
		id: null,
		element: null,
		stage: null,
		ctx: null,
		_globalElements: {},
		_ctxTmp: null,
		_ctxMouseEvent: null,
/**
@doc canvas/
@property width canvas width
@type Integer
@example

<jsfiddle>WebCreative5/GkUsE</jsfiddle>
*/
		width: 0,
/**
@doc canvas/
@property height canvas height
@type Integer
*/
		height: 0, 
/**
@doc canvas/
@property mouseEvent if false, disables `mouseover`, `mouseout` and `mousemove` to improve performance
@type Boolean
@default true
*/
		mouseEvent: true,
		initialize: function(id) {
			var self = this;
			this.id = id;
			this.element = this._getElementById(id);
			this.width = this.element.width;
			this.height = this.element.height;
			this.ctx = this.element.getContext('2d');
			this.hammerExist = typeof(Hammer) !== "undefined";
			old = this.ctx;
			this._mouseEvent();
			var events = ["click", "dbclick", "mousemove", "mousedown", "mouseup"],
				hammer_events = [
					"dragstart", 
					"drag", 
					"dragend", 
					"dragup", 
					"dragdown", 
					"dragleft",  
					"dragright", 
					"swipe",  
					"swipeup", 
					"swipedown", 
					"swipeleft", 
					"swiperight",
					"rotate",
					"pinch", 
					"pinchin", 
					"pinchout",
					"tap", 
					"doubletap", 
					"hold", 
					"transformstart", 
					"transform", 
					"transformend", 
					"release",
					"touch",
					"release"
				];
			
			var hammer = null, val;
			if (this.hammerExist) {
				hammer = new Hammer(this.element);
			}
			
			function bindEvent(type) {
				this.element.addEventListener(type, function(e) {
					callback(e, type);
				}, false);
			}
			
			function bindHammer(type) {
				hammer.on(type, function(e) { 
					callback(e, type);
				});
			}
			
			function callback(e, type) {
				var touches, mouse, scenes = CanvasEngine.Scene.getEnabled(), stage;
				if (e.gesture) {
					touches = e.gesture.touches;
				}
				else {
					touches = [self.getMousePosition(e)];
				}
				for (var name in scenes) {
					stage = scenes[name].getStage();
					for(var t=0; t < touches.length; t++) {
						val = touches[t];
						if (val.pageX !== undefined) {
							val = self.getMousePosition(val);
						}
						if (type == "mousemove") {
							if (self.mouseEvent) stage._mousemove(e, val);
							else continue;
						}	
						stage.trigger(type, [e, val]);
						stage._select(val, function(el_real) {
							el_real.trigger(type, [e, val]);	
						});
						
					}
				}
			}
			
			if (hammer) {
				for (var i=0 ; i < hammer_events.length ; i++) {
					bindHammer.call(this, hammer_events[i]);
				}
			}
			for (var i=0 ; i < events.length ; i++) {
				bindEvent.call(this, events[i]);
			}
			
			if (!params.contextmenu) {
				this.element.addEventListener('contextmenu', function (event) {
					event.preventDefault();
				});
			}
		},
		_elementsByScene: function(name, key, val) {
			if (!this._globalElements[name]) this._globalElements[name] = {};
			if (!val) {
				if (key) {
					return this._globalElements[name][key];
				}
				return this._globalElements[name];
			}
			this._globalElements[name][key] = val;
		},
		_getElementById: function(id) {
			var canvas;
			
			if (params.cocoonjs) {
				canvas = document.createElement("canvas");
				canvas.width = params.cocoonjs.width;
				canvas.height = params.cocoonjs.height;
				canvas.id = id;
				document.body.appendChild(canvas);
			}
			else {
				canvas = document.getElementById(id);
			}
			
			return canvas;
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
@doc canvas/
@method getMousePosition Get the X and Y position of the mouse in the canvas
@param {Event} event
@return Object
@example

	var el = this.createElement(), self = this;
	el.on("click", function(e) {
		var pos = self.getCanvas().getMousePosition(e);
		console.log(pos.x, pos.y);
	});
	
<jsfiddle>WebCreative5/KqH3L/1</jsfiddle>

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
			
			if (e.clientX == undefined) e.clientX = e.pageX;
			if (e.clientY == undefined) e.clientY = e.pageY;
			
			if (!window.pageXOffset) window.pageXOffset = 0;
			if (!window.pageYOffset) window.pageYOffset = 0;
			
			var mouseX = e.clientX - left + window.pageXOffset;
			var mouseY = e.clientY - top + window.pageYOffset;
			return {x: mouseX, y: mouseY};
		},
/**
@doc canvas/
@method measureText Returns an object that contains the width of the specified text
@param {String} txt Text
@param {String} font_size (optional) Font Size (default 12px);
@param {String} font_family (optional) Font Family (default Arial);
@return Object
@example
	
In method "ready" of the scene : 
	
		var _canvas = this.getCanvas();
		_canvas.measureText("Hello World").width;
	
*/
		measureText: function(txt, font_size, font_family) {
			var val;
			font_family = font_family || "Arial";
			font_size = font_size || "12px";
			this.ctx.font = "normal " + font_size + " " + font_family;
			val = this.ctx.measureText(txt);
			this.ctx.font = null;
			return val;
		},
		
/**
@doc canvas/
@method createPattern Returns a pattern
@param {String|Image|HTML5CanvasElement|HTML5VideoElement} img Identifier of the preloaded image, image, video or canvas
@param {Sring} repeatOption (optional) repeat (default), no-repeat, repeat-x or repeat-y
@return CanvasPattern
@example
	
In method "ready" of the scene : 
	
		var _canvas = this.getCanvas(),
			pattern = _canvas.createPattern("my_img");
		
		var el = this.createElement();
		el.fillStyle = pattern;
		el.fillRect(0, 0, 100, 100);
		stage.append(el);
	
*/
		createPattern: function(img, repeatOption) {
			repeatOption = repeatOption || "repeat";
			return this.ctx.createPattern(CanvasEngine.Materials.get(img), repeatOption);
		},
		
/**
	@doc canvas/
	@method createLinearGradient View http://www.w3schools.com/tags/canvas_createlineargradient.asp
*/
		createLinearGradient: function(x0, y0, x1, y1) {
			return this.ctx.createLinearGradient(x0, y0, x1, y1);
		},
		
/**
	@doc canvas/
	@method createRadialGradient View http://www.w3schools.com/tags/canvas_createradialgradient.asp
*/
		createRadialGradient: function(x0,y0,r0,x1,y1,r1) {
			return this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
		},
		
/**
	@doc canvas/
	@method addColorStop View http://www.w3schools.com/tags/canvas_addcolorstop.asp
*/
		addColorStop: function(stop, color) {
			return this.ctx.addColorStop(stop, color);
		},
		
/**
	@doc canvas/
	@method clear Erases the content of canvas
*/
		clear: function() {
			return this.ctx.clearRect(0, 0, this.width, this.height);
		},
	
/**
	TODO
*/	
		cursor: function() {
		
			function handleMouseDown(evt) {
			  evt.preventDefault();
			  evt.stopPropagation();
			  evt.target.style.cursor = 'move';
			}

			document.addEventListener('mousemove', handleMouseDown, false);
					
		},
		
/** 
@doc canvas/
@method isFullscreen `(>=1.2.6)` Tests if the canvas is full screen (HTML5 only)
@return {Boolean}
*/
		isFullscreen: function() {
			return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen;
		},

/**
@doc canvas/
@method setSize `(>=1.2.6)` Change the size of the canvas or put in full screen

> Tested on :

> * Windows 7 - Chrome 26, Firefox 20, Internet Explorer 9 and 10, Opera 12.15, Safari 5.1.7 
> * iPad ; iOS 6.1.2 - Safari, Google Chrome
> * Android 2.3.4 - Default Android Browser, Firefox

@param {Integer|String} width Width in pixels or indicating the size of the expansion : 

* `fullscreen` : Put in full screen (HTML5 Fullscreen)

	Support Fullscreen :

	* Chrome 15+
	* Firefox 10+
	* Safari 5.1+
	* Opera 12.50+

	> For browsers that do not support full screen, we do a full screen in the browser

* `browser` : Put the canvas in full screen in the browser. The canvas is the `fixed` position in CSS

* `reset` : Resets the size of the canvas (the hands and departure)

@param {Integer} height (optional) Height in pixels
@param {String} scale (optional) type of scale : `stretch` or `fit`
	
@example

In `ready` method.

	var _canvas = this.getCanvas(); // "this" is current scene.

Example 1

	_canvas.setSize(400, 300, "fit");
	
Example 2

	_canvas.setSize("browser");
	
Example 3

	_canvas.setSize("browser", "stretch");
	
	
Example 4

	stage.click(function(e, mouse) {
		_canvas.setSize("fullscreen", "fit");
	});
	
Example 5

	_canvas.setSize("reset");
	
@return {CanvasEngine.Canvas}
*/
		setSize: function(width, height, scale) {
			var ratio, self = this,
				old_w = this.element.width,
				old_h = this.element.height, 
				type = width;
			if (width == "reset") {
				width = this._oldSize.width;
				height = this._oldSize.height;
				this.element.style.width =
				this.element.style.height = null;
				if (this._oldSize.type == "browser") {
					this.element.style.position = 
					this.element.style.top = 
					this.element.style.left = null;
				}
				else if (this._oldSize.type == "fullscreen") {
					document.cancelFullScreen();
				}
				
			}
			else if (width == "fullscreen") {
				scale = height;
				width = screen.width;
				height = screen.height;
				
				if (this.element.requestFullScreen) {
					this.element.requestFullScreen(); // Element.ALLOW_KEYBOARD_INPUT
				}
				else {
					width = 
					type = "browser"; 
				}
				
			}
			
			if (width == "browser") {
				scale = height;
				width = window.innerWidth;
				height = window.innerHeight;
				this.element.style.position = "fixed";
				this.element.style.top =
				this.element.style.left = 0;
				window.onresize = function(event) {
					if (type == "browser") self.setSize("browser", scale);
				};
			}
			

			if (scale == "fit") {
				ratio = old_w / old_h;
				width = height * ratio;
				
				this.element.style.width = width + 'px';
				this.element.style.height = height + 'px';

			}
			else if (scale == "stretch") {
				this.element.style.width = width + 'px';
				this.element.style.height = height + 'px';
			}
			else {
				this.element.width = width;
				this.element.height = height;
			}
			this._oldSize = {width: old_w, height: old_h, type: type};
			this.width = width;
			this.height = height;
			return this;
		}
	});
	
/**
@doc scene
@class Scene Scene management. Structure of a scene :

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

All parameters except "name" are optional. The "new" method created a scene but does not run. To execute:

	canvas.Scene.call("MyScene");

The resources defined in "Materials" are loaded and regularly calls the method "preload" with the current percentage. When charging is completed, the method "ready" is executed only once. When the method "ready" is complete, the method "render" is called loop. If you call another scene, the method "exit" of the current scene is triggered
"stage" is an object of type "Element". This is the main element of the scene containing all child elements to create.
*/
	Class.create("Scene", {
		_stage: {},
		_events: [],
		_pause: false,
		_isReady: false,
		_index: 0,
/**
@doc scene/
@property model Model reference. The methods of this property are the same as scoket.io
@type Object
@default null
@example

<script src="extends/Socket.js"></script>/code>

	
	var Model = io.connect('http://127.0.0.1:8333');

	var canvas = CE.defines("canvas").
		ready(function() {
		canvas.Scene.call("MyScene");
	 });

	canvas.Scene.new({
	  name: "MyScene",
	  model: Model,
	  events: ["load"], 
	  ready: function(stage) {
		this.model.emit("start");
	  },
	  load: function(text) {
		 console.log(text);
	  }
	});



*/
		model: null,
		//_isExit: false,
		initialize: function(obj) {
			var ev, self = this;
			this._events = obj.events;
		},
		_loop: function() {
			if (this._isReady) {
				if (this._pause) {
					this._stage.refresh();
				}
				else {
					if (this.render) {
						this.render.call(this, this._stage);
					}
					else {
						this._stage.refresh();
					}
				}
			}
		},
		// deprecated
		emit: function(name, data) {
			this.model.call(name, data);
		},
		// deprecated
		getElement: function(name) {
			if (this._global_elements[name]) {
				return this._global_elements[name];
			}
			return this.createElement(name);
		},
		
/**
@doc scene/
@method pause Pause the scene. method "render" is not called however, but the scene is refreshed (except the event "canvas: render")
@param {Boolean} val (optional) The scene is paused if the value is "true". Put "false" to turn pause off. If the parameter is not specified, the current value is returned.
@return {Boolean|Scene}
@example
	
	In "ready" method of the scene :
	
		this.pause(true); // return this Scene Class
		console.log(this.pause()); // return true
	
*/
		pause: function(val) {
			if (val === undefined) {
				return this._pause;
			}
			this._pause = val;
			return this;
		},
		
/**
@doc scene/
@method togglePause Pauses if the game is not paused, and vice versa. View pause method
@return {Scene}
@example
	
	In "ready" method of the scene :
	
		console.log(this.pause()); // return false
		this.togglePause(); // return this Scene Class
		console.log(this.pause()); // return true
	
*/
		togglePause: function() {
			return this.pause(!this._pause);
		},
		
/**
	@doc scene/
	@method getStage Return the highest element
	@return {CanvasEngine.Element}
*/
		getStage: function() {
			return this._stage;
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
@method zIndex Change or get the index of the scene. The index used to define the superposition. By default, the first scene has index 0. If a scene is created at the same level, it will overlay the previous element and its index will be 1
@param {Integer|Scene}  index (optional) If the value is not specified, the current index of the scene is returned. If the value is negative, you change the index from the end. If the value is a scene, that scene is placed after the scene indicated
@example

	var scene = canvas.Scene.call("Scene_Title");
	scene.zIndex(0);
	
----------

	var scene = canvas.Scene.call("Scene_Title");
	scene.zIndex(); // return current position
	scene.zIndex(-1); // last position
		
----------

	var scene_title = canvas.Scene.get("Scene_Title"),
		scene_map = canvas.Scene.get("Scene_Map")
	scene_map.zIndex(scene_title);

@return {Integer|CanvasEngine.Scene}
*/
		zIndex: function(index) {
			var l;
			if (index === undefined) {
				return this._index;
			}
			if (index instanceof Class) {
				index = index.zIndex();
			}
			l = CanvasEngine.Scene._scenesIndex.length;
			if (Math.abs(index) >= l) {
				index = -1;
			}
			if (index < 0) {
				index = l + index;	
			}
			_CanvasEngine.moveArray(CanvasEngine.Scene._scenesIndex, this._index, index);
			this._index = index;
			return this;
		 },
		
/**
@doc scene/
@method createElement Create an element
@param {String} name (optional) 
@param {Integer} width (optional) 
@param {Integer} height (optional) 
@example

In the method "ready" in the scene class :

	var el = this.createElement();

--

	var el = this.createElement("foo");

--

	var el = this.createElement(100, 100);
	
--
Create two elements : 

	var els = this.createElement(["foo", "bar"]);
	stage.append(els.foo, els.bar);

*/
		 createElement: function(name, width, height) {
			if (name instanceof Array) {
				var obj = {};
				for (var i=0 ; i < name.length ; i++) {
					obj[name[i]] = this.createElement(name[i]);
				}
				return obj;
			}
			if (typeof name != "string") {
				height = width;
				width = name;
			}
			var el = CanvasEngine.Element["new"](this, null, width, height);
			el.name = name;
			return el;
		 },
		 
		_exit: function() {	
			this.getCanvas()._elementsByScene[this.name] = {};
			if (this.exit) this.exit.call(this);
		},
		loadEvents: function() {
			var self = this;
			if (_CanvasEngine.io && this._events) {
				_CanvasEngine.each(this._events, function(i, val) {
					_CanvasEngine.io.on(self.name + "." + val, function(data) {
						if (self[val] && CanvasEngine.Scene.isEnabled(self.name)) self[val].call(self, data);
					});
				});
			}
		},
		_load: function(params, options) {
			var self = this;
			params = params || {};
			options = options || {};
			this._stage = CanvasEngine.Element["new"](this);
			this._index = CanvasEngine.Scene._scenesIndex.length-1;
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

			//this.loadEvents();
			
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
				if (params.when == "afterPreload") {
					CanvasEngine.Scene.exitAll(params.allExcept);
				}
				if (self.ready) self.ready(self._stage, self.getElement, options);
				self._stage.trigger("canvas:readyEnd");
				if (self.model && self.model.ready) self.model.ready.call(self.model);
				self._isReady = true;
			}
		}
	});
	
/**
@class Context
@extend Element Uses the HTML5 Canvas context of the element. The drawing is stored in an array and is not displayed as the item is not attached to the scene

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement();
			element.fillStyle = #ff0000;
			element.fillRect(20, 20, 100, 100);
			stage.append(element);
		}
	});

*/
	Class.create("Context", {
			_cmd: {},
			img: {},
			globalAlpha: 1,
			// private ; read only
			_PROPS: ["shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalAlpha", "globalCompositeOperation", "lineJoin", "lineWidth", "miterLimit", "fillStyle", "font", "textBaseline", "strokeStyle"],
			
			alpha: function(opacity) {
				//this.globalAlpha = opacity;
			},
			
/**
@doc draw/
@method addMethod Adds methods for 2d context
@param {String|Array} names Method(s) Name(s)
@param {String} type (optional) Type of the method:

* cmd (by default) : Command that applies after a refresh
* draw : The method runs directly

@example

	var el = this.createElement();
	el.addMedthod("newMethodCanvas");
	el.newMethodCanvas(foo, bar);
	stage.append(el);

*/
			addMethod: function(names, type) {
				var self = this;
				type = type || "cmd";
				if (!(names instanceof Array)) {
					names = [names];
				}
				
				function addCmd(name) {
					self[name] = function() {
						var method = type == "cmd" ? "_addCmd" : "draw";
						self[method](name, arguments);
					};
				}
				
				for (var i=0 ; i < names.length ; i++) {
					addCmd(names[i]);
				}
				
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
				@method addColorStop See http://www.w3schools.com/html5/canvas_addcolorstop.asp
			*/
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

	var el = this.createElement();
	el.drawImage("img");

--

	el.drawImage("img", 10, 30);

--

	el.drawImage("img", 10, 30, 100, 100, 0, 0, 100, 100);

--

	el.drawImage("img", 0, 0, "30%");

@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
*/
			drawImage: function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
				var array, array_buffer, buffer, _img = img;
				if (!sx) sx = 0;
				if (!sy) sy = 0;
				if (typeof img === "string") {
					_img = CanvasEngine.Materials.get(img);
					if (!_img) {
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
				
				
				//buffer = CanvasEngine.Materials.createBuffer(img, this.color_key);
		
				
				function f(t) {
					for (var i=1 ; i < t.length ; i++) {
						t[i] = Math.round(t[i]);
					}
					return t;
				}
				
				if (sw !== undefined) {
					array = [_img, sx, sy, sw, sh, dx, dy, dw, dh];
					this._buffer_img = {
						x: dx,
						y: dy,
						width: dw,
						height: dh
					};
					//array_buffer = f([buffer, sx, sy, sw, sh, dx, dy, dw, dh]);
				}
				else {
					array = [_img, sx, sy];
					this._buffer_img = {
						x: sx,
						y: sy,
						width: _img.width,
						height: _img.height
					};
					
					//array_buffer = f([buffer, sx, sy]);
				}
				
				this._addCmd("drawImage", array);
			},
			/**
				@doc draw/
				@method arc See http://www.w3schools.com/html5/canvas_arc.asp
			*/
			/**
				@doc draw/
				@method clip See http://www.w3schools.com/html5/canvas_clip.asp
			*/
			/**
				@doc draw/
				@method beginPath See http://www.w3schools.com/html5/canvas_beginpath.asp
			*/
			/**
				@doc draw/
				@method moveTo See http://www.w3schools.com/html5/canvas_beginpath.asp
			*/
			/**
				@doc draw/
				@method closePath See http://www.w3schools.com/html5/canvas_closepath.asp
			*/
			/**
				@doc draw/
				@method translate http://www.w3schools.com/html5/canvas_translate.asp
			*/
			/**
				@doc draw/
				@method rotate See http://www.w3schools.com/html5/canvas_rotate.asp
			*/


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
			
			/**
				@doc draw/
				@method clearRect See http://www.w3schools.com/html5/canvas_clearrect.asp
			*/
			/**
				@doc draw/
				@method setTransform See http://www.w3schools.com/html5/canvas_settransform.asp
			*/
			/**
				@doc draw/
				@method transform See http://www.w3schools.com/html5/canvas_transform.asp
			*/
			/**
				@doc draw/
				@method rect See http://www.w3schools.com/html5/canvas_rect.asp
			*/
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
				var prop = this._PROPS;
				for (var k=0 ; k < prop.length ; k++) {
					if (this[prop[k]]) this[prop[k]] = undefined;
				}
				
			},
			draw: function(name, params, propreties) {
			
				//CE.benchmark("draw method");
				layer =  "ctx";
				params = params || [];
				propreties = propreties || {};

				var ctx = this.getScene().getCanvas()._ctxTmp;
				var cmd, array_cmd = {};
				var cmd_propreties = [];
				var isCmd = true, applyBuffer = 1, bufferEventForce = false;
				
				var bufferEvent = function(name, _params) {
					var ctx_mouse = this._canvas[0]["_ctxMouseEvent"];
					if (this.hasEvent() || this.hasCmd("clip")) {
						ctx_mouse[name].apply(this._canvas[0]["_ctxMouseEvent"], _params);
						if (name == "drawImage") {
							ctx_mouse.globalCompositeOperation = 'source-atop';
							ctx_mouse.fillStyle = '#' + this.color_key;
							ctx_mouse.fillRect(this._buffer_img.x, this._buffer_img.y, this._buffer_img.width, this._buffer_img.height);
						}
					}
				};
				
				var bufferProp = function(cmd_propreties, key, value) {
					if (cmd_propreties[key] || this.forceEvent) {
						this._canvas[0]["_ctxMouseEvent"][key] = value;
						return 0;
					}
					return 1;
				};
				
				if (name && typeof name != "string") {
					ctx = name;
					name = null;
				}
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
								applyBuffer = 1;
								
								if (key == "globalAlpha") {
									cmd_propreties[key] = this.real_opacity;
								}
								
								if (ctx) {
									ctx[key] = cmd_propreties[key];
								}
								else {
									this._canvas[j][layer][key] = cmd_propreties[key];
								}
								
								applyBuffer &= bufferProp.call(this, cmd_propreties, "globalAlpha", 1);
								applyBuffer &= bufferProp.call(this, cmd_propreties, "strokeStyle", '#' + this.color_key);
								applyBuffer &= bufferProp.call(this, cmd_propreties, "fillStyle", '#' + this.color_key);
								
								if (applyBuffer) {
									bufferProp.call(this, cmd_propreties, key, cmd_propreties[key]);
								}
								
							}
						}
						if (ctx) {
							ctx[name].apply(ctx, cmd.params);
						}
						else {
							this._canvas[j][layer][name].apply(this._canvas[j][layer], cmd.params);
							if (this.forceEvent) {
								if (name == "rect") {
									bufferEvent.call(this, "fillRect", cmd.params);
								}
							}
							bufferEvent.call(this, name, cmd.params);
						}
					}
				}
				//CE.benchmark("draw method");

			},
			_addCmd: function(name, params, propreties) {
				params = params || [];
				propreties = propreties || [];
				
				var prop = this._PROPS;
				propreties = propreties.concat(prop);
				var obj = {};
				for (var k=0 ; k < propreties.length ; k++) {
					if (this[propreties[k]]) obj[propreties[k]] = this[propreties[k]];
				}
				obj["globalAlpha"] = 1;
				this._cmd[name] = {params: params, propreties: obj};
			},
			
			hasCmd: function(name) {
				return this._cmd[name];
			},
/**
@doc draw/
@method removeCmd Deletes a saved command element
@param {String} name Name of the drawing method
@example

In `ready` method :

	var el = this.createElement();
	el.drawImage("foo");
		
	el.removeCmd("drawImage");
	stage.append(el); // Image "foo" is not displayed

*/
			removeCmd: function(name) {
				delete this._cmd[name];
			}
	});
	
	
/**
@doc element
@class Element Manipulate elements on the scene.

1. Create an element with the createElement method :

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement(); // new Element object
		}
	});

2. Add this element in the stage :

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement();
			stage.append(element); // add in the stage
		}
	});
	
@example
<jsfiddle>cUEJ7/1</jsfiddle>
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

	var foo = this.createElement(10, 20);
		console.log(foo.width) // 10

*/
		width: null,
/**
@doc manipulate/
@property height Height. Only if  value has been assigned to the creation of the element
@type Integer
@default null
@example

	var foo = this.createElement(10, 20);
		console.log(foo.height) // 20

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
		// TODO
		pause: false,
		_index: 0,
		_id: null,
		_visible: true,
		_listener: {},
		_buffer_img: null,
		_out: 1,
		_over: 0,
		_pack: null,
/**
	@doc manipulate/
	@property forceEvent Force applying an event on the element even if it is invisible. Assign the height and width or use the rect method before
	@type Boolean
	@default false
*/
		forceEvent: false,
/**
	@doc manipulate/
	@property propagationOpacity If false, does not take into account the opacity of parent elements
	@type Boolean
	@default true
*/
		propagationOpacity: null,
		initialize: function(scene, layer, width, height) {
			this._id = _CanvasEngine.uniqid();
			this.width = width;
			this.height = height;
			this.scene = scene;
			this.stage = scene._stage;
			this.layer = layer;
			
			var key, elements = this.scene.getCanvas()._elementsByScene(this.scene.name);
			do {
				key = _CanvasEngine._getRandomColorKey();
			}
			while (key in elements);
			
			
			this.addMethod([
				"moveTo",
				"lineTo",
				"quadraticCurveTo",
				"bezierCurveTo",
				"clip",
				"beginPath",
				"closePath",
				"rect",
				"arc",
				"addColorStop"
			], "cmd");
			
			this.addMethod([
				"rotate",
				"translate",
				"transform",
				"setTransform",
				"resetTransform",
				"scale",
				"clearRect"
			], "draw");
			
			this.color_key = key;
			this.scene.getCanvas()._elementsByScene(this.scene.name, key, this);
			this._canvas = CanvasEngine.el_canvas;
		},
/**
@doc draw/
@method refresh Refreshes the elements of the scene	
@event canvas:refresh Calling the event only "stage" to each refresh of an element :

	stage.on("canvas:refresh", function(el) { // stage is defined in the scene
		console.log(el);
	});

*/
		refresh: function() {
			//this.clear();
			this._refresh(true);
			this._canvas._event_mouse = null;
		},
		/**
			Private
			init : is parent ? default : false
			children : refresh children ? default : true
		
		*/
		_refresh: function(init, children, ctx) {
			children = children === undefined ? true : children;
			

			if (this.stage.trigger) this.stage.trigger("canvas:refresh", this);
			
			if (!this._visible) {
				this._loop();
				return;
			}

			if (!this.real_pause) {

				if (init || !this.parent) {
					this.parent = {
						scaleX: 1,
						scaleY: 1,
						real_x: 0,
						real_y: 0,
						real_scale_x: 1,
						real_scale_y: 1,
						real_rotate: 0,
						real_skew_x: 0,
						real_skew_y: 0,
						real_opacity: 1,
						real_propagation: true
					};
				}
				
				this.real_propagation = this.parent.propagationOpacity == null ? true : this.parent.propagationOpacity;
			
				this.save();
					
				this.setTransform(1, 0, 0, 1, 0, 0);
				
				this.real_scale_x = this.parent.real_scale_x * this.scaleX;
				this.real_scale_y = this.parent.real_scale_y * this.scaleY;
				this.real_y = (this.parent.real_y + this.y) * (this.parent.scaleY == 1 ? 1 : this.parent.real_scale_x);
				this.real_x = (this.parent.real_x + this.x) * (this.parent.scaleX == 1 ? 1 : this.parent.real_scale_y);
				
				this.real_skew_x = this.parent.real_skew_x + this.skewX;
				this.real_skew_y = this.parent.real_skew_y + this.skewY ;
				this.real_rotate = this.parent.real_rotate + this.rotation ;
				if (this.real_propagation) {	
					this.real_opacity = this.parent.real_opacity * this.opacity;
				}
				else {
					this.real_opacity = this.opacity;
				}
				
				this.real_pause = init ? this.pause : this.parent.real_pause;
				
				this.globalAlpha = this.real_opacity;
				if (this.parent) {
					if (this.parent.regX) {
						this.regX = this.parent.regX;
					}
					if (this.parent.regY) {
						this.regY = this.parent.regY;
					}
				}
				var regX = this.real_x + this.regX;
				var regY = this.real_y + this.regY;
				this.translate(regX, regY);
				if (this.rotation != 0) {
					this.rotateDeg(this.rotation);
				}
				this.scale(this.real_scale_x, this.real_scale_y);
				this.transform(1, this.real_skew_x, this.real_skew_y, 1, 0, 0);
				this.translate(this.real_x,  this.real_y);
				this.translate(-regX, -regY);
			}
			
			
			this.draw(ctx);
			
			if (!this.hasCmd("clip")) {
				this.restore();
			}
		
			
			if (children) {
				// if (!this.real_pause) this._loop();
				if (!this.getScene()._pause) this._loop();
				for (var i=0 ; i < this._children.length ; i++) {
					this._children[i]._refresh(false, true, ctx);
				}
			}
			
			if (this.hasCmd("clip")) {
				this.restore();
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
			this._stageRefresh();
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
		/**
			@doc traversing/
			@method getScene Get the scene where the element is attached
			@return Scene
		*/
		getScene: function() {
			return this.scene;
		},
		
		_stageRefresh: function() {
			this.stage.refresh();
		},
		
		_mousemove: function(e, mouse) {
			var el_real, over;
			for (var i=0 ; i < this._children.length ; i++) {
				el_real = this._children[i];
				over = mouse.x > el_real.real_x && mouse.x < el_real.real_x + el_real.width &&
						mouse.y > el_real.real_y && mouse.y < el_real.real_y + el_real.height;	
				if (over) {
					if (el_real._out == 1) {
						el_real._out++;
						el_real._out++;
						el_real._over = 1;
						_trigger = el_real.trigger("mouseover", e);
					}
					if (_trigger) return;
				}
				else {
					if (el_real._over == 1) {
						el_real._out = 1;
						el_real._over++;
						_trigger = el_real.trigger("mouseout", e);
					}
				}
					
			}
		},

		_select: function(mouse, callback) {
			var el_real, imgData;
			var canvas = this.scene.getCanvas();
			imgData = this._canvas[0]["_ctxMouseEvent"].getImageData(mouse.x, mouse.y, 1, 1).data;
			if (imgData[3] > 0) {
				el_real = canvas._elementsByScene(this.scene.name, _CanvasEngine.rgbToHex(imgData[0], imgData[1], imgData[2]));
				if (el_real) callback(el_real);
			}
		},
		
		_click: function(e, mouse, type) {
			this._select(mouse, function(el_real) {
				 el_real.trigger("click", e, mouse);
			});
		},
		
		_cloneRecursive: function(el) {
			var sub_el, new_el;
			if (el._children.length > 0) {
				for (var i=0 ; i < el._children.length ; i++) {
					sub_el = el._children[i];
					new_el = this.scene.createElement();
					for (var key in sub_el) {
						if (typeof key != "function") {
							new_el[key] = sub_el[key];
						}
					}
					new_el.parent = el;
					this._cloneRecursive(sub_el);
				
					el._children[i] = new_el;
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
			this._cloneRecursive(el);
			return el;
		},
		
/**
	@doc manipulate/
	@method append inserts the specified content as the last child of each element in the Element collection
	@param {CanvasEngine.Element} el 
	@return CanvasEngine.Element
	@example

In method ready :

	var el = this.createElement();
	stage.append(el);
	
--

	var el1 = this.createElement(),
		el2 = this.createElement(),
		el3 = this.createElement();
	stage.append(el1, el2, el3);
	
--
	
	var el = this.createElement(["a", "b", "c"]);
	stage.append(el.a, el.b, el.c);
*/
		append: function() {
			var el;
			for (var i=0 ; i < arguments.length ; i++) {
				el = arguments[i];
				this._children.push(el);
				el.parent = this;
				el._index = this._children.length-1;
				el._refresh();				
			}
			return arguments;
		},
		
/**
@doc manipulate/
@method prepend inserts the specified content as the first child of each element in the Element collection
@example

In method ready

	var el = this.createElement();
	stage.prepend(el); // zIndex == 0
	
@param {CanvasEngine.Element} el 
@return CanvasEngine.Element
*/
		prepend: function(el) {
			this._children.push(el);
			el.parent = this;
			el.zIndex(0);
			return el;
		},
		
		// TODO
		/**
			var el1 = this.createElement();
			var el2 = this.createElement();
			el.insertAfter(stage);
		*/
		insertAfter: function(el) {
			var children = el.parent.children();
			children.push(this);
			this._index = children.length-1;
			return this;
		},
		
/**
	@doc traversing/
	@method children Retrieves an array of elements
	@param children (optional) {Array|Element} If the parameter exists, a new array of elements is assigned. You can copy the child of another element.
	@return {Array}
*/
		children: function(children) {
			var _children = [], new_children = [];
			if (children) {
				if (children instanceof Array) _children = children;
				if (children instanceof Class) _children = children.children();
				for (var i=0 ; i < _children.length ; i++) {
					new_children[i] = _children[i].clone();
					new_children[i].parent = this;
				}
				this._children = new_children;
			}
			return this._children;
		},

/**
@doc manipulate/
@method detach The .detach() method is the same as .remove(). This method is useful when removed elements are to be reinserted into the stage at a later time.
@example
In method ready

	var el = this.createElement();
	stage.append(el);
	
	el = el.detach(); // element is removed
	stage.append(el); 
	
@return {CanvasEngine.Element}
*/		
		detach: function() {
			this.remove();
			return this;
		},
		
/**
@doc manipulate/
@method pack Compress all children in an HTML5Canvas
@param {Integer} w Width of the compressed child
@param {Height} h Height of the compressed child
@param {Boolean} free_memory (optional) Do not keep the array in memory of the children if true. Unpack method can no longer be used out. (false by default)
@example
In method ready

	var el = this.createElement(), child;
	for (var i=0 ; i < 1000 ; i++) {
		child = this.createElement();
		child.x = i;
		el.append(child);
	}
	el.pack(10, 1000);
	stage.append(el);

@return {CanvasEngine.Element}
*/
		pack: function(w, h, free_memory) {
			var children = this.children(),
				canvas = document.createElement("canvas"),
				ctx = canvas.getContext('2d'),
				scene = this.getScene(),
				el;
			
			canvas.width = w;
			canvas.height = h;
			
			this.scene.getCanvas()._ctxTmp = ctx;
			for (var i=0 ; i < children.length ; i++) {
				this._children[i]._refresh();
			}
			this.scene.getCanvas()._ctxTmp = null;
			if (!free_memory) this._pack = children;
			this.empty();
			el = scene.createElement();
			el.drawImage(canvas);
			this.append(el);
			return this;
		},

/**
@doc manipulate/
@method unpack Decompress a compressed element with `pack` method
@example
In method ready

	var el = this.createElement(), child;
	for (var i=0 ; i < 1000 ; i++) {
		child = this.createElement();
		child.x = i;
		el.append(child);
	}
	el.pack(10, 1000); 	// transform all children to Canvas element
	el.unpack(); 		// reset as before 
	stage.append(el);

@return {CanvasEngine.Element}
*/		
		unpack: function() {
			if (!this._pack) {
				throw "Use the method pack before or impossible because you release the memory with method pack";
			}
			this._children = this._pack;
			this._pack = null;
			return this;
		},
		
		
		isAppend: function() {
			return this in this.parent.children();
		},
		
		first: function() {
			return this.children()[0];
		},
		
		find: function(name) {
			var children = this.children(),
				_find = [];
			for (var i=0 ; i < children.length ; i++) {	
				c = children[i];
				if (name == c.name) {
					_find.push(c);
				}
			}
			return _find;
		},
		
		findAttr: function(attr, val) {
			var children = this.children(),
				c, attr_val;
			for (var i=0 ; i < children.length ; i++) {
				c = children[i];
				console.log(attr, c.attr(attr));
				attr_val = c.attr(attr);
				if (attr_val) {
					if (val != undefined) {
						if (attr_val == val) {
							return c;
						}
					}
					else {
						return c;
					}
				}
			}
			return false;
		},
		
/**
@doc manipulate/
@method zIndex Change or get the index of the item. The index used to define the superposition. By default, the first element has index 0. If an item is created at the same level, it will overlay the previous element and its index will be 1
@param {Integer|Element}  index (optional) If the value is not specified, the current index of the element is returned. If the value is negative, you change the index from the end. If the value is an element, that element is placed after the element indicated
@example

In method ready

	var el1 = this.createElement(),
		el2 = this.createElement(),
		el3 = this.createElement();
					// Original order : el1 ; el2 ; el3
	el1.zIndex(1);  // New order : el2 ; el1 ; el3
	el2.zIndex(-1); // New order : el1 ; el3 ; el2
	console.log(el3.zIndex()); // return "1"
	
	el1.zIndex(el2); // New order : el3 ; el2 ; el1

@return {Integer|CanvasEngine.Element}
*/
		zIndex: function(index) {
			var l;
			if (index === undefined) {
				return this._index;
			}
			if (index instanceof Class) {
				index = index.zIndex();
			}
			l = this.parent._children.length;
			if (Math.abs(index) >= l) {
				index = -1;
			}
			if (index < 0) {
				index = l + index;	
			}
			_CanvasEngine.moveArray(this.parent._children, this._index, index);
			this._index = index;
			this._stageRefresh();
			return this;
		},
		
/**
@doc manipulate/
@method zIndexBefore Place this element before another element
@param {Element} element
@return {CanvasEngine.Element}
*/
		zIndexBefore: function(el) {
			this.zIndex(el.zIndex()-1);
			return this;
		},
		
/**
@doc manipulate/
@method remove Removes element in stage
@return {Boolean} "true" if removed
@example

	var foo = this.createElement(),
		bar = this.createElement();
		
	foo.append(bar);
	stage.append(foo);
	foo.remove();
	// stage is empty

*/
		remove: function() {
			var child;
			for (var i=0 ; i < this.parent._children.length ; i++) {
				child = this.parent._children[i];
				if (this._id == child._id) {
					this.parent._children.splice(i, 1);
					this._stageRefresh();
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

	var foo = this.createElement(),
		bar = this.createElement();
		
	foo.append(bar);
	stage.append(foo);
	foo.empty();
	// "bar" no longer exists

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
			@return {CanvasEngine.Element}
		*/
		attr: function(name, value) {
			if (value === undefined) {
				return this._attr[name];
			}
			this._attr[name] = value;
			return this;
		},
		
		/**
			@doc manipulate/
			@method removeAttr Removes an attribute
			@param  {String} name
			@return {CanvasEngine.Element}
		*/
		removeAttr: function(name) {
			if (this._attr[name]) delete this._attr[name];
			return this;
		},
		
/**
@doc manipulate/
@method offset Relative positions of the parent. Returns an object with `left` and `top` properties
@return {Object}
@example

In method ready

	var el = this.createElement();
		el2 = this.createElement();
		
	el1.x = 50;
	el2.x = 100
		
	el1.append(el2);
	stage.append(el2);
		
	console.log(el2.offset()); // {left: 100, top: 0}

*/
		offset: function() {
			return {
				left: this.x,
				top: this.y
			};
		},

/**
@doc manipulate/
@method position Absolute positions. Returns an object with `left` and `top` properties
@return {Object}
@example

In method ready

	var el = this.createElement();
		el2 = this.createElement();
		
	el1.x = 50;
	el2.x = 100
		
	el1.append(el2);
	stage.append(el2);
		
	console.log(el2.position()); // {left: 150, top: 0}

*/
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
		},
		/**
			@doc manipulate/
			@method show hide element and refresh the stage
		*/
		show: function() {
			this._visible = true;
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
@method on The `on` method attaches event handlers to the currently selected set of elements in the CanvasEngine object.

## General Event ##

Some names are defined as follows: `namespace:eventname`. For example, there are the following event in CanvasEngine:

	stage.on("canvas:refresh", function(el) { // stage is defined in the scene
		console.log(el);
	});

At each refresh of the scene, to display each element is returned.

* `canvas:refresh` Calling the event *only* `stage` to each refresh of an element
* `canvas:render` Call each rendering the element
* `canvas:readyEnd` Call at the end of the execution of the `ready` method in the scene
* `animation:draw` Call each sequence. Id parameter sequence

        el.on("animation:draw", function(id) {
    		console.log(id);
    	});

## Mouse Events

You can retrieve the mouse events

* click
* dbclick
* mousemove
* mouseup
* mousedown
* mouseout
* mouseover

> For `mouseover` and `mouseout`, you must give size to the element (in `ready` method)

    var el = this.createElement(300, 300);

> or

    var el = this.createElement();
    el.width = 300;
    el.height = 300;
	
<jsfiddle>WebCreative5/Y9Kum</jsfiddle>

Apply on a specific element :

    var el = this.createElement();
    el.on("click", function(e, mouse) {
		this.opacity = 0.5;
	});
	
** Callback parameter **

* event {Event} : a mouse event
* mouse {Object} `(>= 1.2.6)` : Position the mouse on the canvas. `{x: , y: }`

Example :

    stage.on("mousemove", function(e, mouse) {
		console.log(mouse.x, mouse.y);
	});

## Events with Hammer.js  ##

Other events suitable for tablet and smartphone exist available in Hammer.js :

* hold
* tap
* doubletap
* drag, dragstart, dragend, dragup, dragdown, dragleft, dragright
* swipe, swipeup, swipedown, swipeleft, swiperight
* transform, transformstart, transformend
* rotate
* pinch, pinchin, pinchout
* touch (gesture detection starts)
* release (gesture detection ends)


        var el = this.createElement();
	    el.on("drag", function(e, mouse) {
		    this.x = e.distanceX;
		    this.y = e.distanceY;
	    });

> If you use the `click` event, it will be replaced by `touch` for touch devices

See [https://github.com/EightMedia/hammer.js/wiki/Getting-Started](https://github.com/EightMedia/hammer.js/wiki/Getting-Started)

@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
@param {Function} callback(event) A function to execute when the event is triggered
*/
		bind: function(event, callback) { this.on(event, callback); },
		on: function(events, callback) {
			var event;
			events = events.split(" ");
			for (var i=0 ; i < events.length ; i++) {
				event = events[i];
				if (CanvasEngine.mobileUserAgent && event == "click") event = "touch";
				if (!this._listener[event]) {
					this._listener[event] = [];
				}
				this._listener[event].push(callback);
			}
		},
		
/**
@doc events/
@method off The off() method removes event handlers that were attached with .on()
@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
@param {Function} callback (optional) function which was attached in this event
*/
		unbind: function(events, callback) { this.off(events, callback); },
		off: function(events, callback) {
			var event;
			events = events.split(" ");
			for (var i=0 ; i < events.length ; i++) {
				event = events[i];
				if (callback) {
					for (var i=0 ; i < this._listener[event].length ; i++) {
						if (this._listener[event][i] == callback) {
							delete this._listener[event][i];
							break;
						}
					}
				}
				else {
					if (this._listener[event]) {
						this._listener[event] = [];
					}
				}
			}
		},
		
		/**
			@doc events/
			@method eventExist Test whether an event is present on the element. Return true if exist
			@param {String} event event name ("click" per example)
			@param {Boolean}
		*/
		eventExist: function(event) {
			return this._listener[event] && this._listener[event].length > 0;
		},
		
/**
@doc events/
@method hasEvent If the test element at least one event
@param {Boolean}
*/
		hasEvent: function() {
			return _CanvasEngine.objectSize(this._listener) > 0;
		},
		
/**
@doc events/
@method trigger Any event handlers attached with .on() or one of its shortcut methods are triggered when the corresponding event occurs. They can be fired manually, however, with the .trigger() method.
@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
@param {Object|Array} params Params
*/
		trigger: function(events, e) {
			var event, _trigger = false;;
			events = events.split(" ");
			if (!(e instanceof Array)) {
				e = [e];
			}
			for (var j=0 ; j < events.length ; j++) {
				event = events[j];
				if (this._listener[event]) {
					for (var i=0 ; i < this._listener[event].length ; i++) {
						 _trigger = true;
						if (this._listener[event][i]) this._listener[event][i].apply(this, e);
					}
				}
			}
			return _trigger;
		},
		
/**
@doc events/
@method click Equivalent to the method `.on("click", function)`

[More details on here ](?p=core.element.events.on)

@params {Function} callback
*/
		click: function(callback) {
			this.on("click", callback);
		},
/**
@doc events/
@method dblclick Equivalent to the method `.on("dblclick", function)`

[More details on here ](?p=core.element.events.on)

@params {Function} callback
*/
		dblclick: function(callback) {
			this.on("dblclick", callback);
		},
/**
@doc events/
@method mouseover Equivalent to the method `.on("mouseover", function)`. 

[More details on here ](?p=core.element.events.on)

@params {Function} callback
*/
		mouseover: function(callback) {
			this.on("mouseover", callback);
		},
/**
@doc events/
@method mouseout Equivalent to the method `.on("mouseout", function)`

[More details on here ](?p=core.element.events.on)

@params {Function} callback
*/
		mouseout: function(callback) {
			this.on("mouseout", callback);
		},
		_loop: function() {
			/*for (var i=0 ; i < this._loop_listener.length ; i++) {
				this._loop_listener[i].call(this);
			}*/
			this.trigger("canvas:render");
		},
/**
@doc events/
@method addLoopListener Adds a function that executes the loop for rendering the element
@param {Function} callback() Callback
@example
In the method "ready" in the scene class :

	var el = this.createElement();
	el.addLoopListener(function() {
		this.x += 3;
	});

or 

	var el = this.createElement();
	el.on("canvas:render", (function() {
		this.x += 3;
	});

*/
		addLoopListener: function(callback) {
			this.on("canvas:render", callback);
		}
	}).extend("Context");
	
	Global_CE = CanvasEngine = Class["new"]("CanvasEngineClass");
	return CanvasEngine;
}

CanvasEngine.Core = CanvasEngine;
CanvasEngine.Class = Class;

var CE = CanvasEngine;

/*! Hammer.JS - v1.0.3 - 2013-03-02
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
        userSelect: 'none', // this also triggers onselectstart=false for IE
        touchCallout: 'none',
        touchAction: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(document, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(document, Hammer.EVENT_END, Hammer.detection.endDetect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // trigger DOM event
        var event = document.createEvent('Event');
		event.initEvent(gesture, true, true);
		event.gesture = eventData;
		this.element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
		var self = this;
        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouseup/) && touch_triggered) {
                touch_triggered = false;
                return;
            }

            // mousebutton must be down or a touch event
            if(sourceEventType.match(/touch/) ||   // touch events are always on screen
                (sourceEventType.match(/mouse/) && ev.which === 1) ||   // mousedown
                (Hammer.HAS_POINTEREVENTS && sourceEventType.match(/down/))  // pointerevents touch
            ){
                enable_detect = true;
            }

            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }


            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect && !(touch_triggered && sourceEventType.match(/mouse/))) {
                // update pointer
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    Hammer.PointerEvent.updatePointer(eventType, ev);
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(eventType === Hammer.EVENT_END && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }
                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointer after the handler is done
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }


            // on the end we reset everything
            if(sourceEventType.match(/up|cancel|end/)) {
                enable_detect = false;
                last_move_event = null;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // for non pointer events browsers
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timestamp   : ev.timestamp || new Date().getTime(), // for IE
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var pointers = this.pointers;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(pointers).sort().forEach(function(id) {
            touchlist.push(pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            delete this.pointers[pointerEvent.pointerId];
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};

Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
     * @returns {Object}    dest
     */
    extend: function extend(dest, src) {
        for (var key in src) {
            dest[key] = src[key];
        }

        return dest;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getSimpleDistance(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }
    },


    /**
     * end Hammer.gesture detection
     * @param   {Object}    eventData
     */
    endDetect: function endDetect(eventData) {
        this.detect(eventData);
        this.stopDetect();
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timestamp - startEv.timestamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(typeof(options[gesture.name]) == 'undefined') {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timestamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout: 500,
        hold_threshold: 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime  : 250,
        tap_max_distance   : 10,
        doubletap_distance : 20,
        doubletap_interval : 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timestamp - prev.lastEvent.timestamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
                Hammer.detection.current.name = 'doubletap';
            }
            else {
                Hammer.detection.current.name = 'tap';
            }

            inst.trigger(Hammer.detection.current.name, ev);
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(inst.options.drag_lock_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);