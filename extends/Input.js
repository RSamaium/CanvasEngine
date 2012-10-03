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
	@class Input Keyboard, Gamepad et accelerometer
	@example
		Keyboard:
		<code>
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
		</code>
		Gamepad :
		
		In header (http://www.gamepadjs.com)
		<code>
			<script src="extends/gamepad.js"></script>
		</code>
		
		Script :
		<code>
			
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
		
		</code>
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
	 * Calling a function when a key is pressed (only once)
	 * @method press
	 * @param {Integer|Array} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	 * @param {Function} onPressKey Function called when a key is pressed. One parameter: the event of the button (Event Object)
	*/
	press: function(key, onPressKey) {
		this._press('keyPress', key, onPressKey);
	},

	/**
	 * Clears the functions assigned to keys indicated
	 * @method clearKeys
	 * @param {Integer|Array} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	*/
	clearKeys: function(key) {
		this.press(key, function() {});
	},

	/**
	 * Calling a function when a key is down
	 * @method keyDown
	 * @param {Integer} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	 * @param {Function} onPressKey Function called. One parameter: the event of the button (Event Object)
	*/
	keyDown: function(key, onPressKey) {
		this._press('keyDown', key, onPressKey);
	},

	/**
	 * Calling a function when a key is up
	 * @method keyUp
	 * @param {Integer} key Value of the key (or keys if array). Input.A or [Input.A, Input.Z] for example
	 * @param {Function} onKeyUp Function called. One parameter: the event of the button (Event Object)
	*/
	keyUp: function(key, onKeyUp) {
		var self = this;
		self._keyUp[key] = onKeyUp;
		document.onkeyup = function(e) {
			if (self._keyUp[e.which]) {
				self._keyUp[e.which](e);
			}
			self._keyPress[e.which] = 0;
			self._keyPressed[e.which] = false;
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
			if (!self._keyPress[e.which]) self._keyPress[e.which] = 0;
			self._keyPress[e.which]++;
			if (self._keyPress[e.which] > 1 && self._keyType[e.which] == 'keyPress') return;
			self._keyPressed[e.which] = true;
		//	self.keyUp(e.which);
			if (self._keyFunctions[e.which]) self._keyFunctions[e.which](e);
		}
		
		function assignKey(_key, type) {
			self._keyType[_key] = type;
			self._keyFunctions[_key] = onPressKey;
		}
	},

	/**
	 * Resets all keys. You must assign the buttons (press(), keyDown() and keyUp()) to restore movement and actions
	 * @method reset
	*/
	reset: function() {
		this._keyFunctions = {};
	},

	/**
	 * Lock the keys on the canvas and avoid scrolling of the page
	 * @method lock
	 * @param {HTMLCanvasElement} canvas Canvas
	 * @param {Boolean} focus_start (optional) Place the focus on the canvas. false by default
	 * @param {Function} onFocus (optional) Callback when the canvas is the focus
	 * @param {Function} onBlur (optional) Callback when the canvas loses the focus
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
	 * Whether a key is pressed
	 * @method isPressed
	 * @param {Integer} key Value of the key. If it's an array, returns true if a key is pressed
	 * @return Boolean true if pressed
	*/
	isPressed: function(key) {
		return this._keyPressed[key];
	},

	/**
	 * Add key (constant). Example :<br />
	 * @static 
	 * @method addKey
	 * @param {String} id ID key
	 * @param {Integer} keycode Key value
		@example
			<code>
				canvas.Input.addKey("F", 70);
				canvas.Input.press(Input.F, function(e) {
					// Code
				});
			</code>
	*/
	addKey: function(id, keycode) {
		this[id] = keycode;
	},

	/**
	 * Stores the keys pressed
	 * @method memorize
	*/
	memorize: function() {
		this.cacheKeyBuffer = this.keyBuffer;
	},

	/**
	 * Reassigns the keys pressed cached (see "Input.memorize()")
	 * @method restore
	*/
	restore: function() {
		this.keyBuffer = this.cacheKeyBuffer;
	},

	/**
	 * Simulates the call of a key
	 * @method trigger
	 * @param {Integer} key Key Code (example: Input.Space)
	 * @param {String} type Type of event key, "down", "up" or "press". "press" is the touch of a key (pressed and then released)
	 * @param {HTMLCanvasElement} canvas (optional) Canvas. Allows to restore the focus to the canvas
	 * @example
		<code>
			canvas.Input.trigger(Input.A, "press");
		</code>
	 * @example
		<code>
			canvas.Input.trigger(Input.Enter, "down", _canvas);
		</code>
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
		@class Gamepad
		Can play with the gamepad
		@example
		In method "ready" of the scene :
		<code>
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
		</code>
	*/
	  Gamepad: {
		_listener: {},
		gamepad: null,
		_onConnect: null,
		_onDisconnect: null,
		_connectState: false,
		/**
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
			@method addListener Adds a listener when a button is pressed or released
			@param {String} Id button. See https://github.com/sgraham/gamepad.js
			@param {Function} onDown Callback function when the button is pressed
			@param {Function} onUp Callback function when the button is released
		*/
		/**
			@method addListener Execute a function already defined on the keyboard
			@param {String} Id button. See https://github.com/sgraham/gamepad.js
			@param {Integer} input Value of the key on the keyboard
			@example
				<code>
					this.gamepad = canvas.Input.Gamepad.init();
					canvas.Input.keyDown(Input.Right, function() {
					   // Code
					});
					this.gamepad.addListener("dpadRight", Input.Right);
				</code>
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
		@method accelerometer Assigns the accelerometer
		@param {Function} callback Callback function called with "deviceorientation" listener. 3 parameters :
			- x : Direction side to side
			- y : Vertically oriented front-back
			- z : Front and rear horizontal orientation
		@example
			<code>
				canvas.Input.accelerometer(function(x, y, z) {
				
				});
			</code>
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
* Value of the A button
* @static
* @property A
* @type Integer
*/
Input.A = 65;

/** 
* Value of the Z button
* @static
* @property Z
* @type Integer
*/
Input.Z = 90;

/** 
* Value of the E button
* @static
* @property E
* @type Integer
*/
Input.E = 101;

/** 
* Value of the Q button
* @static
* @property Q
* @type Integer
*/
Input.Q = 113;

/** 
* Value of the Escape button
* @static
* @property Esc
* @type Integer
*/
Input.Esc = 27;

/** 
* Value of the Enter button
* @static
* @property Enter
* @type Integer
*/
Input.Enter = 13;

/** 
* Value of the Shift button
* @static
* @property Shift
* @type Integer
*/
Input.Shift = 16;

/** 
* Value of the Ctrl button
* @static
* @property Ctrl
* @type Integer
*/
Input.Ctrl = 17;

/** 
* Value of the Alt button
* @static
* @property Alt
* @type Integer
*/
Input.Alt = 18;

/** 
* Value of the Space button
* @static
* @property Space
* @type Integer
*/
Input.Space = 32;

/** 
* Value of the Back button
* @static
* @property Back
* @type Integer
*/
Input.Back = 8;

/** 
* Value of the F1 button
* @static
* @property F1
* @type Integer
*/
Input.F1 = 112;

/** 
* Value of the F2 button
* @static
* @property F2
* @type Integer
*/
Input.F2 = 113;

/** 
* Value of the F11 button
* @static
* @property F11
* @type Integer
*/
Input.F11 = 122;

/** 
* Value of the F12 button
* @static
* @property F12
* @type Integer
*/
Input.F12 = 123;

/** 
* Value of the left button
* @static
* @property Left
* @type Integer
*/
Input.Left = 37;

/** 
* Value of the Up button
* @static
* @property Up
* @type Integer
*/
Input.Up = 38;

/** 
* Value of the Right button
* @static
* @property Right
* @type Integer
*/
Input.Right = 39;

/** 
* Value of the Bottom button
* @static
* @property Bottom
* @type Integer
*/
Input.Bottom = 40;
