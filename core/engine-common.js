var fs;
if (typeof(require) !== "undefined") {
	fs = require('fs');
}

function Kernel(class_method, name) {
	this.class_method = class_method;
	this.class_name = name;
}

Kernel._extend = function(self, object, clone) {
	clone = clone === undefined ? true : clone;
	if (typeof object == "string") {
		if (Class.__class_config[object]) {
			object = Class.__class_config[object].methods;
		}
		else {
			return self;
		}
	}
	
	if (clone) object = CanvasEngine.clone(object);
	
	for (var key in object) {
		self[key] = object[key];
	}
	
	return self;
}

Kernel.prototype = {
	New: function() { return this["new"].apply(this, arguments) },
	"new": function() {
		this._class = new Class();
		Class.__class[this.class_name] = this._class;
		this._construct();
		return this._class;
	},
	_construct: function() {
		this._class.extend(this.class_method);
	},
	_attr_accessor: function(attrs, reader, writer) {
		var self = this;
		for (var i=0 ; i < attrs.length ; i++) {
			this.class_method["_" + attrs[i]] = null;
			this.class_method[attrs[i]] = {};
			if (reader) {
				this.class_method[attrs[i]].set = function(value) {
					self.class_method["_" + attrs[i]] = value;
				};
			}
			if (writer) {
				this.class_method[attrs[i]].get = function() {
					return self.class_method["_" + attrs[i]];
				};
			}	
		}
		return this;
	},
	/**
		@doc class/
		@method attr_accessor Defines the properties that can be read and modified
		@params {Array} Properties names in an array
		@example
			<code>
				Class.create("Foo", {
				
					mymethod: function() {
						this.bar.set(5);
						console.log(this.bar.get()); // Value of property "bar" is 5
						console.log(this._bar); // ditto
					}
				
				}).attr_accessor(["bar"]);
			</code>
			<jsfiddle>WebCreative5/HzCSm/1</jsfiddle>
		@return {Object}
	*/
	attr_accessor: function(attrs) {
		return this._attr_accessor(attrs, true, true);
	},
	/**
		@doc class/
		@method attr_reader Defines the properties that can be only read
		@params {Array} Properties names in an array
		@example
			<code>
				Class.create("Foo", {
				
					mymethod: function() {
						console.log(this.bar.get());
					}
				
				}).attr_reader(["bar"]);
			</code>
		@return {Object}
	*/
	attr_reader: function(attrs) {
		return this._attr_accessor(attrs, true, false);
	},
	/**
		@doc class/
		@method attr_writer Defines the properties that can be only modified
		@params {Array} Properties names in an array
		@example
			<code>
				Class.create("Foo", {
				
					mymethod: function() {
						this.bar.set(5);
						console.log(this._bar);
					}
				
				}).attr_writer(["bar"]);
			</code>
		@return {Object}
	*/
	attr_writer: function(attrs) {
		return this._attr_accessor(attrs, false, true);
	},
	/**
		@doc class/
		@method extend add object in this class
		@params {Object} object
		@params {Boolean} clone (optional) Makes a clone of the object (false by default)
		@example
			<code>
				Class.create("Foo", {
				
					mymethod: function() {
						
					}
				
				}).extend({
					othermethod: function() {
					
					}
				});
			</code>
		@return {Object}
	*/
	extend: function(object, clone) {
		Kernel._extend(this.class_method, object, clone);
		return this;
	},
	// TODO
	addIn: function(name) {
		if (!Class.__class[name]) {
			return this;
		}
		Class.__class[name][this.name] = this;
		return this;
	}

}

function Class() {
	this.name = null;
}

Class.__class = {};
Class.__class_config = {};

/**
	@doc class/
	@method get By retrieve the class name
	@static
	@params {String} name Class name
	@return {Kernel} Core class
*/
Class.get = function(name) {
	return Class.__class[name];
};

/**
	@doc class/
	@method create Creating a class. the constructor is the method "initialize"
	@static
	@params {String} name Class name
	@params {Object} methods Methods and properties of the class
	@example
		<code>
			Class.create("Foo", {
				bar: null,
				initialize: function(bar) {
					this.bar = bar;
				}
			});
			var foo = Class.new("Foo", ["Hello World"]);
		</code>
		<jsfiddle>WebCreative5/cbtFk</jsfiddle>
	@return {Kernel} Core class
*/
Class.create = function(name, methods, _static) {
	var p, _class, _tmp_class;
	
	/*if (typeof(window) === 'undefined') {
		var window = {};
	}*/
	Class.__class_config[name] = {};
	Class.__class[name] = {};
/*	Class.__class[name] = function(params) {
	//	this.__parent = Class;  
	//	this.__parent();
		if (this.initialize) {
			this.initialize.apply(this, params);
		}
	};*/

	if (_static) {
		p = window[name];
		tmp_class =  new Class();
		for (var key in tmp_class) {
			p[key] = tmp_class[key];
		}
		for (var key in methods) {
			p[key] = methods[key];
		}
		_class = p;
	}
	else {
		//p = Class.__class[name].prototype = methods;
		Class.__class_config[name].methods = methods;
		var kernel = Class.__class_config[name].kernel = new Kernel(Class.__class_config[name].methods, name);
		//p.extend(methods);
	}
	return kernel;
}

/**
	@doc class/
	@method new new class. 
	@static
	@params {String} name Class name
	@params {Array} params Parameters for the constructor
	@return {Class}
*/
Class.New = function() { return Class["new"].apply(this, arguments) };
Class["new"] = function(name, params) {
	var _class;
	params = params || [];
	if (!Class.__class_config[name]) {
		throw name + " class does not exist. Use method \"create\" for build the structure of this class";
	}
	_class = Class.__class_config[name].kernel["new"]();
	if (_class.initialize) {
		_class.initialize.apply(_class, params);
	}

	_class.__name__ = name;
	return _class;
}

Class.prototype = {
	/**
		@method extend add object in this class
		@params {Object} object
		@parmas {Boolean} clone (optional) Makes a clone of the object (false by default)
		@example
			<code>
				Class.create("Foo", {
				
					mymethod: function() {
						
					}
				
				});
				Class.new("Foo").extend({
					othermethod: function() {
					
					}
				});
			</code>
		@return {Object}
	*/
	extend: function(object, clone) {
		return Kernel._extend(this, object, clone);
	}
}

var CanvasEngine = {};

/**
	@doc utilities/
	@method uniqid Generating a unique identifier by date
	@static
	@return {String}
*/
CanvasEngine.uniqid = function() {
   // return new Date().getTime();
   return Math.random();
};

/**
	@doc utilities/
	@method arraySplice Removes an element in an array by value
	@static
	@params {Object} val
	@params {Array} array
*/
CanvasEngine.arraySplice = function(val, array) {
	var i;
	for (i=0 ; i < array.length ; ++i) {
		if (val == array[i]) {
			array.splice(i, 1);
			return;
		}
	}
};

/**
	@doc ajax/
	@method ajax Perform an asynchronous HTTP (Ajax) request. System uses wire on Node.js
	@static
	@params {Object} options
			- url {String} File Path
			- type {String} (optional) "GET" (default) or "POST"
			- data {Object} (optional) Data key/value
			- dataType {String} (optional) "text" (default), "json" or "xml"
			- success {Function}  (optional) Callback if the request was successful
*/
CanvasEngine.ajax = function(options) {

	if (!options) options = {};
	options.url = options.url || "./";
	options.type = options.type || "GET";
	options.data = options.data ? JSON.stringify(options.data) : null;
	
	if (fs) {
		fs.readFile('./' + options.url, 'ascii', function (err, ret) {
			if (err) throw err;
			ret = ret.toString('ascii');
			if (options.dataType == 'json') {
				ret = CanvasEngine.parseJSON(ret);
			}
			options.success(ret);
		});
		return;
	}
	
	var xhr; 
	try {  xhr = new ActiveXObject('Msxml2.XMLHTTP');   }
	catch (e) 
	{
		try {  xhr = new ActiveXObject('Microsoft.XMLHTTP');    }
		catch (e2) 
		{
		try {  xhr = new XMLHttpRequest();     }
		catch (e3) {  xhr = false;   }
		}
	}

	xhr.onreadystatechange  = function() { 
		 var ret;
		 if(xhr.readyState  == 4)  {
			  if(xhr.status  == 200) {
					if (options.success) {
						ret = xhr.responseText;
						if (options.dataType == 'json') {
							ret = CanvasEngine.parseJSON(ret);
						}
						else if (options.dataType == 'xml') {
							ret = xhr.responseXML;
						}
						options.success(ret);
					}
			  }
		 }
	}; 
	
   xhr.open(options.type, options.url,  true); 
   xhr.send(options.data); 

}

/**
	@doc ajax/
	@method getJSON Load JSON-encoded data from the server using a GET HTTP request.
	@static
	@params {String} url File Path
	@params {String} (optional) data Data key/value
	@params {Function} (optional) callback Callback if the request was successful
*/
CanvasEngine.getJSON = function(url, data, callback) {
	if (typeof data == "function") {
		callback = data;
		data = null;
	}
	CanvasEngine.ajax({
	  url: url,
	  dataType: 'json',
	  data: data,
	  success: callback
	});
}

/**
	@doc utilities/
	@method parseJSON Takes a well-formed JSON string and returns the resulting JavaScript object.
	@static
	@params {String} json JSON format
	@return {Object}
*/
CanvasEngine.parseJSON = function(json) {
	return JSON.parse(json);
}

/**
	@doc utilities/
	@method each The array is read and sent to a callback function
	@static
	@params {Array|Integer} array If the value is an integer, it returns to perform a number of loop iteration
	@params {Function} callback  two parameters :
		- index
		- value
	@example
		<code>
			var foo = ["bar", "test"];
			CE.each(foo, function(i, val) {
				console.log(val);
			});
		</code>
		<code>
			var foo = ["bar", "test"];
			CE.each(2, function(i) {
				console.log(foo[i]);
			});
		</code>
*/
CanvasEngine.each = function(array, callback) {
	var i, l;
	if (array instanceof Array) {
		l = array.length;
	}
	else {
		l = array;
		array = [];
	}
	for (i=0 ; i < l ; ++i) {
		callback.call(array, i, array[i]);
	}
}

/**
	@doc utilities/
	@method inArray The CE.inArray() method is similar to JavaScript's native .indexOf() method in that it returns -1 when it doesn't find a match. If the first element within the array matches value, CE.inArray() returns 0.

	Because JavaScript treats 0 as loosely equal to false (i.e. 0 == false, but 0 !== false), if we're checking for the presence of value within array, we need to check if it's not equal to (or greater than) -1.
	@static
	@params {String} val The value to search for.
	@params {Array} array An array through which to search.
	@return {Integer}
*/
CanvasEngine.inArray = function(val, array)  {
	var i;
	for (i=0 ; i < array.length ; ++i) {
		if (val == array[i]) {
			return i;
		}
	}
	return -1;
};

/**
	@doc engine/
	@method clone Clone an object
	@static
	@params {Object} instance
	@return {Object}
*/
CanvasEngine.clone = function(srcInstance) {
	var i;
	if(typeof(srcInstance) != 'object' || srcInstance == null) {
		return srcInstance;
	}
	var newInstance = srcInstance.constructor();
	if (newInstance === undefined) {
		return srcInstance;
	}
	for(i in srcInstance){
		newInstance[i] = CanvasEngine.clone(srcInstance[i]);
	}
	return newInstance;
};

/**
	@doc utilities/
	@method hexaToRGB Converts the hexadecimal value of a color in RGB. Returns an array with 3 colors : [r, g, b]
	@static
	@params {String} hexa Hexadecimal with or without #
	@return {Array} 
*/
CanvasEngine.hexaToRGB = function(hexa) {
	var r, g, b;
	
	function cutHex(h) {
		return (h.charAt(0) == "#") ? h.substring(1,7) : h;
	}
	
	r = parseInt((cutHex(hexa)).substring(0,2),16);
	g = parseInt((cutHex(hexa)).substring(2,4),16);
	b = parseInt((cutHex(hexa)).substring(4,6),16);

	return [r, g, b];
};

/**
	@doc utilities/
	@method rgbToHex Converts the RGB value of a color in Hexadecimal.
	@static
	@params {String} r Red value (0-255)
	@params {String} g Green value (0-255)
	@params {String} b Blue value (0-255)
	@return {String} 
*/
CanvasEngine.rgbToHex = function(r, g, b) {
	return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Private
 CanvasEngine._getRandomColorKey = function() {
	var r = Math.round(Math.random() * 255),
		g = Math.round(Math.random() * 255),
		b = Math.round(Math.random() * 255);
	return CanvasEngine.rgbToHex(r, g, b);
};

var _CanvasEngine = CanvasEngine;


if (typeof(exports) !== "undefined") {
	exports.Class = Class;
	exports.CanvasEngine = CanvasEngine;
}