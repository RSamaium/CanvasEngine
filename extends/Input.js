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
@doc input
@class Input Keyboard, Gamepad et accelerometer
@example
Keyboard:

	var canvas = 	CE.defines("canvas_id").
					extend(Input).
					ready(function() {
						canvas.Scene.call("Map");
					});
					
	canvas.Scene.new({
		 name: "Map",
		 ready: function(stage) {

			canvas.Input.keyDown(Input.Bottom);
			canvas.Input.keyDown(Input.A, function() {
				console.log("A pressed");
			});
			canvas.Input.keyUp(Input.A, function() {
				console.log("A released");
			});

		 },
		 render: function(stage) {
		 
			if (canvas.Input.isPressed(Input.Bottom)) {
				console.log("Bottom pressed");
			}
		 
			stage.refresh();
		 }
	}); 

Gamepad :

In header (http://www.gamepadjs.com)

	&lt;script src="extends/gamepad.js"></script&gt;


Script :

	
	var canvas = 	CE.defines("canvas_id").
					extend(Input).
					ready(function() {
						canvas.Scene.call("Map");
					});
					
	canvas.Scene.new({
		 name: "Map",
		 ready: function(stage) {

			this.gamepad = canvas.Input.Gamepad.init(function() {
			   console.log("Gamepad connected");
			}, function() {
				console.log("Gamepad disconnected");
			});
			
			this.gamepad.addListener("faceButton0", function() {
			   console.log("A pressed");
			}, function() {
			   console.log("A released");
			});
			
			canvas.Input.keyDown(Input.Right, function() {
			   // Code
			});
			this.gamepad.addListener("dpadRight", Input.Right);

		 },
		 render: function(stage) {
		 
			this.gamepad.update();
		 
			stage.refresh();
		 }
	}); 


*/

var Input = {Input: {

	keyBuffer: [],
	cacheKeyBuffer: [],
	_keyFunctions: {},
	_keyPress: {},
	_keyUp: {},
	_keyType: {},
	_keyPressed: {},
	_lock: {},
	_rules: {},

	_key: function(e, key, callback) {
		if (typeof key == "function") {
			key(e);
		}
		else {
			if (key instanceof Array) {
				for (var i=0 ; i < key.length ; i++) {
					if (e.which == key[i]) {
						if (callback) callback(e);
					}
				}
			}
			else if (e.which == key) {
				if (callback) callback(e);
			}
		}
	},

	/**
		@doc keyboard/
	 	@method press Calling a function when a key is pressed (only once)
		@param {Integer|Array} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
		@param {Function} onPressKey Function called when a key is pressed. One parameter: the event of the button (Event Object)
	*/
	press: function(key, onPressKey) {
		this._press('keyPress', key, onPressKey);
		this.keyUp(key);
	},

	/**
	  @doc keyboard/
	  @method clearKeys  Clears the functions assigned to keys indicated
	  @param {Integer|Array} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	*/
	clearKeys: function(key) {
		this.press(key, function() {});
	},

	/**
@doc keyboard/
@method keyDown  Calling a function when a key is down
@param {Integer} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
@param {Function} onPressKey (optional) Function called. One parameter: the event of the button (Event Object)
@example

To avoid latency before repeating the movement, use `isPressed()` in render method. In the example below, use Left and Right keys :

<jsfiddle>WebCreative5/KCSu3</jsfiddle>
	  
	*/
	keyDown: function(key, onPressKey) {
		this._press('keyDown', key, onPressKey);
	},

	/**
	  @doc keyboard/
	  @method keyUp  Calling a function when a key is up
	  @param {Integer} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	  @param {Function} onKeyUp (optional) Function called. One parameter: the event of the button (Event Object)
	*/
	keyUp: function(key, onKeyUp) {
		var self = this;
		
		if (key instanceof Array) {
			for (var i=0 ; i < key.length ; i++) {
				self._keyUp[key[i]] = onKeyUp;
			}
		}
		else {
			self._keyUp[key] = onKeyUp;
		}
		
		document.onkeyup = function(e) {
			self._keyPress[e.which] = 0;
			self._keyPressed[e.which] = false;
			if (self._keyUp[e.which]) {
				self._keyUp[e.which](e);
			}
		};
	},

	_press: function(type, key, onPressKey) {
		var self = this;
		if (typeof key == "string") {
			key = this._rules[key];
		}
		if (key instanceof Array) {
			for (var i=0 ; i < key.length ; i++) {
				assignKey(key[i], type);
			}
		}
		else {
			assignKey(key, type);
		}
		
		if (this._lock.canvas) {
			var canvas = this._lock.canvas;
			canvas.onkeydown = onkeydown;
			
			canvas.onfocus = function(e) {
				document.onkeydown  = function() {
					return false;
				}
				if (self._lock.onFocus) self._lock.onFocus(e, canvas);
			}
			
			canvas.onblur = function(e) {
				document.onkeydown  = null;
				if (self._lock.onBlur) self._lock.onBlur(e, canvas);
			}
		}
		else {
			document.onkeydown = onkeydown;
		}
		
		function onkeydown(e) {
			var ret;
			if (!self._keyPress[e.which]) self._keyPress[e.which] = 0;
			self._keyPress[e.which]++;
			if (self._keyPress[e.which] > 1 && self._keyType[e.which] == 'keyPress') return;
			self._keyPressed[e.which] = true;
		//	self.keyUp(e.which);
			if (self._keyFunctions[e.which]) ret = self._keyFunctions[e.which](e);
			if (ret !== undefined) {
				return ret;
			}
			else {
				
			}
		}
		
		function assignKey(_key, type) {
			self._keyType[_key] = type;
			self._keyFunctions[_key] = onPressKey;
		}
	},

/**
  @doc keyboard/
  @method reset  Resets all keys. You must assign the buttons (press(), keyDown() and keyUp()) to restore movement and actions
  @param {Array} keys (optional) Reset only the keys assigned in the array
  @example
  
	canvas.Input.reset([Input.Enter, Input.Space]);
*/
	reset: function(keys) {
		this._keyPressed = {};
		if (keys) {
			for (var i=0 ; i < keys.length ; i++) {
				this._keyFunctions[keys[i]] = null;
			}
		}
		else {
			this._keyFunctions = {};
		}
	},

	/**
	  @doc keyboard/
	  @method lock Lock the keys on the canvas and avoid scrolling of the page
	  @param {HTMLCanvasElement} canvas Canvas
	  @param {Boolean} focus_start (optional) Place the focus on the canvas. false by default
	  @param {Function} onFocus (optional) Callback when the canvas is the focus
	  @param {Function} onBlur (optional) Callback when the canvas loses the focus
	*/
	lock: function(canvas, focus_start, onFocus, onBlur) {
		var dom = document.getElementById(canvas);
		dom.setAttribute('tabindex', 1);
		if (focus_start) { 
			dom.focus();
			document.onkeydown  = function() {
				return false;
			}
		}
		this._lock.canvas = dom;
		this._lock.onFocus = onFocus;
		this._lock.onBlur = onBlur;
	},


	/**
	  @doc keyboard/
	  @method isPressed  Whether a key is pressed
	  @param {Integer} key Value of the key. If it's an array, returns true if a key is pressed
	  @return Boolean true if pressed
	*/
	isPressed: function(key) {
		if (!(key instanceof Array)) {
			key = [key];
		}
		for (var i=0 ; i < key.length ; i++) {
			if (this._keyPressed[key[i]]) {
				return true;
			}
		}
		return false;
	},

/**
@doc keyboard/
@method addKey Add key (constant).
@param {String} id ID key
@param {Integer} keycode Key value
@example
	
		canvas.Input.addKey("F", 70);
		canvas.Input.press(Input.F, function(e) {
			// Code
		});
	
*/
	addKey: function(id, keycode) {
		Input[id] = keycode;
	},

	/**
	  deleted
	  @method memorize  Stores the keys pressed
	*/
	memorize: function() {
		this.cacheKeyBuffer = this.keyBuffer;
	},

	/**
	  deleted
	  @method restore Reassigns the keys pressed cached (see "Input.memorize()")
	*/
	restore: function() {
		this.keyBuffer = this.cacheKeyBuffer;
	},

/**
@doc keyboard/
@method trigger Simulates the call of a key
@param {Integer} key Key Code (example: Input.Space)
@param {String} type Type of event key, "down", "up" or "press". "press" is the touch of a key (pressed and then released)
@param {HTMLCanvasElement} canvas (optional) Canvas. Allows to restore the focus to the canvas
@example

	canvas.Input.trigger(Input.A, "press");

@example

	canvas.Input.trigger(Input.Enter, "down", _canvas);

*/
		trigger: function(key, type, canvas) {
			var ev, element, dom;
			if (type == "press") {
				this.trigger(key, "down");
				this.trigger(key, "up", canvas);
				return;
			}
			if (this._lock.canvas) {
				element = this._lock.canvas;
			}
			else {
				element = document;
			}
			if (document.createEventObject) {
				ev = document.createEventObject();
				ev.keyCode = key;
				element.fireEvent("onkey" + type, ev);   
			} 
			else if (document.createEvent) {
				ev = document.createEvent("Events");
				ev.initEvent("key" + type, true, true);
				ev.which = key;
				element.dispatchEvent(ev);
			}
			if (canvas) {
				dom = document.getElementById(canvas.id + '-dom');
				dom.focus();
			}
		},

	  // TODO
	  addRule: function(name, inputs) {
		this._rules[name] = inputs;
	  },
/**
@doc gamepad
@class Gamepad Can play with the gamepad
@example
In method "ready" of the scene :

	var canvas = CE.defines("canvas_id").
	extend(Input).
	ready(function() {
		canvas.Scene.call("MyScene");
	});
		
	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			this.gamepad = canvas.Input.Gamepad.init(function() {
			  console.log("Gamepad connected");
			}, function() {
			  console.log("Gamepad disconnected");
			});
			
			this.gamepad.addListener("faceButton0", function() {
			   console.log("key A down");
			}, function() {
			   console.log("key A up");
			});
		},
		render: function(stage) {
			this.gamepad.update();
		}
	});

*/
	  Gamepad: {
		_listener: {},
		gamepad: null,
		_onConnect: null,
		_onDisconnect: null,
		_connectState: false,
		/**
			@doc gamepad/
			@method init Initialize the gamepad
			@param {Function} onConnect (optional) Callback function when the gamepad is connected
			@param {Function} onDisconnect (optional) Callback function when the gamepad is disconnected
			@return {CanvasEngine.Input.Gamepad}
		*/
		init: function(onConnect, onDisconnect) {
			this._onConnect = onConnect;
			this._onDisconnect = onDisconnect;
			return this;
		},
		// Private
		getState: function(pos) {
			this.gamepad = Gamepad.getStates()[pos];
			if (this.gamepad && !this._connectState) {
				if (this._onConnect) this._onConnect();
				this._connectState = true;
			}
			else if (!this.gamepad && this._connectState) {
				if (this._onDisconnect) this._onDisconnect();
				this._connectState = false;
			}
		},
/**
@doc gamepad/
@method addListener Adds a listener when a button is pressed or released
@param {String} Id button. See https://github.com/sgraham/gamepad.js
@param {Function} onDown Callback function when the button is pressed
@param {Function} onUp Callback function when the button is released
*/
/**
@doc gamepad/
@method addListener Execute a function already defined on the keyboard
@param {String} Id button. See https://github.com/sgraham/gamepad.js
@param {Integer} input Value of the key on the keyboard
@example
	
		this.gamepad = canvas.Input.Gamepad.init();
		canvas.Input.keyDown(Input.Right, function() {
		   // Code
		});
		this.gamepad.addListener("dpadRight", Input.Right);
	
*/
		addListener: function(obj, onDown, onUp) {
			var _Input = Input.Input;
			if (typeof onDown != "function") {
				var _input = onDown;
				onDown = function() {
					_Input.trigger(_input, "down");
				};
				onUp = function() {
					_Input.trigger(_input, "up");
				};
			}
			this._listener[obj] = {
				onDown: onDown,
				onUp: onUp,
				state: false
			};
		},
		/**
			@doc gamepad/
			@method update Updates the inputs of the gamepad
		*/
		update: function() {
			this.getState(0);
			if (!this.gamepad) return;
			for (var key in this._listener) {
				if (this.gamepad[key] == 1 && !this._listener[key].state) {
					if (this._listener[key].onDown) this._listener[key].onDown(); 
					this._listener[key].state = true;
				}
				else if (this.gamepad[key] == 0 && this._listener[key].state) {
					if (this._listener[key].onUp) this._listener[key].onUp(); 
					this._listener[key].state = false;
				}
			}
		}
	  },
	  
/**
@doc accelerometer/
@method accelerometer Assigns the accelerometer
@param {Function} callback Callback function called with "deviceorientation" listener. 3 parameters :

* x : Direction side to side
* y : Vertically oriented front-back
* z : Front and rear horizontal orientation

@example

	canvas.Input.accelerometer(function(x, y, z) {
	
	});

*/
	  accelerometer: function(callback) {
		if (window.DeviceOrientationEvent) {
			 window.addEventListener('deviceorientation', function(eventData) {
				orientationHandler(eventData.alpha, eventData.beta, eventData.gamma);
			 }, false);
			 
			
		}
		else if (window.OrientationEvent) {
			 window.addEventListener('MozOrientation', function(eventData) {
				orientationHandler(eventData.x, eventData.y, eventData.z);
			 }, false);
		}
		 
		  function orientationHandler(x, y, z) {
			callback(x, y, z);
		  }
	  }
}};

/** 
 @doc keyboard/
 @static
 @property A Value of the A button
 @type Integer
*/
Input.A = 65;

/** 
 @doc keyboard/
 @static
 @property Z  Value of the Z button
 @type Integer
*/
Input.Z = 90;

/** 
 @doc keyboard/
 @static
 @property E Value of the E button
 @type Integer
*/
Input.E = 69;

/** 
 @doc keyboard/
 @static
 @property Q  Value of the Q button
 @type Integer
*/
Input.Q = 81;

/** 
 @doc keyboard/
 @static
 @property Esc Value of the Escape button
 @type Integer
*/
Input.Esc = 27;

/** 
 @doc keyboard/
 @static
 @property Enter Value of the Enter button
 @type Integer
*/
Input.Enter = 13;

/** 
 @doc keyboard/
 @static
 @property Shift Value of the Shift button
 @type Integer
*/
Input.Shift = 16;

/** 
 @doc keyboard/
 @static
 @property Ctrl  Value of the Ctrl button
 @type Integer
*/
Input.Ctrl = 17;

/** 
 @doc keyboard/
 @static
 @property Alt  Value of the Alt button
 @type Integer
*/
Input.Alt = 18;

/** 
 @doc keyboard/
 @static
 @property Space  Value of the Space button
 @type Integer
*/
Input.Space = 32;

/** 
 @doc keyboard/
 @static
 @property Back Value of the Back button
 @type Integer
*/
Input.Back = 8;

/** 
 @doc keyboard/
 @static
 @property F1 Value of the F1 button
 @type Integer
*/
Input.F1 = 112;

/** 
 @doc keyboard/
 @static
 @property F2 Value of the F2 button
 @type Integer
*/
Input.F2 = 113;

/** 
 @doc keyboard/
 @static
 @property F11 Value of the F11 button
 @type Integer
*/
Input.F11 = 122;

/**
 @doc keyboard/
 @static
 @property F12  Value of the F12 button
 @type Integer
*/
Input.F12 = 123;

/**
 @doc keyboard/
 @static
 @property Left  Value of the left button
 @type Integer
*/
Input.Left = 37;

/**
 @doc keyboard/
 @static
 @property Up Value of the Up button
 @type Integer
*/
Input.Up = 38;

/** 
 @doc keyboard/
 @static
 @property Right Value of the Right button
 @type Integer
*/
Input.Right = 39;

/** 
 @doc keyboard/
 @static
 @property Bottom Value of the Bottom button
 @type Integer
*/
Input.Bottom = 40;
