var fs;
if (typeof(require) !== "undefined") {
	fs = require('fs');
}

function Kernel(class_method, name) {
	this.class_method = class_method;
	this.class_name = name;
}

Kernel._extend = function(self, object, clone) {
	var o;
	if (!(object instanceof Array)) {
		object = [object];
	}
	for (var i=0 ; i < object.length ; i++) {
		clone = clone === undefined ? true : clone;
		o = object[i];
		if (typeof o == "string") {
			if (Class.__class_config[o]) {
				o = Class.__class_config[o].methods;
			}
			else {
				return self;
			}
		}
		
		if (clone) o = CanvasEngine.clone(o);
		
		for (var key in o) {
			self[key] = o[key];
		}
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

	Class.create("Foo", {
	
		mymethod: function() {
			this.bar.set(5);
			console.log(this.bar.get()); // Value of property "bar" is 5
			console.log(this._bar); // ditto
		}
	
	}).attr_accessor(["bar"]);

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

	Class.create("Foo", {
	
		mymethod: function() {
			console.log(this.bar.get());
		}
	
	}).attr_reader(["bar"]);

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

	Class.create("Foo", {
	
		mymethod: function() {
			this.bar.set(5);
			console.log(this._bar);
		}
	
	}).attr_writer(["bar"]);

@return {Object}
*/
	attr_writer: function(attrs) {
		return this._attr_accessor(attrs, false, true);
	},
/**
@doc class/
@method extend add object in this class
@params {Object|String} object or name of existing class
@params {Boolean} clone (optional) Makes a clone of the object (false by default)
@example

Example 1 :

	Class.create("Foo", {
	
		mymethod: function() {
			
		}
	
	}).extend({
		othermethod: function() {
		
		}
	});
	
Example 2 :

	Class.create("Bar", {
	
		initialize: function() {
			
		}
	
	});

	Class.create("Foo", {
	
		mymethod: function() {
			
		}
	
	}).extend("Bar");

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

	Class.create("Foo", {
		bar: null,
		initialize: function(bar) {
			this.bar = bar;
		}
	});
	var foo = Class.new("Foo", ["Hello World"]);

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
	@params {Array} params (optional) Parameters for the constructor
	@params {Boolean} initialize (optional) Calls the constructor "initialize" (true by default)
	@return {Class}
*/
Class.New = function() { return Class["new"].apply(this, arguments) };
Class["new"] = function(name, params, initialize) {
	var _class;
	
	if (typeof params == "boolean") {
		initialize = params;
		params = [];
	}
	
	if (initialize == undefined) {
		initialize = true;
	}
	
	params = params || [];
	
	if (!Class.__class_config[name]) {
		throw name + " class does not exist. Use method \"create\" for build the structure of this class";
	}
	_class = Class.__class_config[name].kernel["new"]();
	if (initialize && _class.initialize) {
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

	Class.create("Foo", {
	
		mymethod: function() {
			
		}
	
	});
	Class.new("Foo").extend({
		othermethod: function() {
		
		}
	});

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
   return (Math.random()+"").replace(/^0./g, "");
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

* url {String} File Path
* type {String} (optional) "GET" (default) or "POST"
* data {Object} (optional) Data key/value
* dataType {String} (optional) "text" (default), "json" or "xml"
* success {Function}  (optional) Callback if the request was successful
*/
CanvasEngine.ajax = function(options) {
	
	options = CanvasEngine.extend({
		url: "./",
		type: "GET",
		statusCode: {}
	}, options);
	
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
	
	function onSuccess() {
		var ret;
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

	xhr.onreadystatechange  = function() {
		 if (xhr.readyState  == 4)  {
			  if (options.statusCode  && options.statusCode[xhr.status]) options.statusCode[xhr.status]();
			  if (xhr.status  == 200) {
				 onSuccess();
			  }
			  else  {
				 if (options.error) options.error(xhr);
			  }
		 }
	}; 
	
   xhr.open(options.type, options.url,  true); 
   if (options.mimeType) {
		xhr.overrideMimeType(options.mimeType);
   }
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
@params {Array|Object|Integer} array If the value is an integer, it returns to perform a number of loop iteration
@params {Function} callback  two parameters :

* index
* value

@example

	var foo = ["bar", "test"];
	CE.each(foo, function(i, val) {
		console.log(val);
	});


	var foo = ["bar", "test"];
	CE.each(2, function(i) {
		console.log(foo[i]);
	});

	var foo = {bar: "bar", test: "test"};
	CE.each(foo, function(i, val) {
		console.log(val);
	});

*/
CanvasEngine.each = function(array, callback) {
	var i, l;
	if (!(array instanceof Array) &&
		!(typeof array == "number")) {
		for (i in array) {
			callback.call(array, i, array[i]);
		}
		return;
	}
	if (array instanceof Array) {
		l = array.length;
	}
	else if (typeof array == "number") {
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

/**
	@doc utilities/
	@method random Random value between `min`	and `max`
	@static
	@params {Integer} min
	@params {Integer} max
	@return {Integer} 
*/
CanvasEngine.random = function(min, max) {
	return Math.floor((Math.random() * max) + min);
};

/**
@doc utilities/
@method mobileUserAgent Returns the name of the user agent used
@static
@return {String|Boolean} name of the agent user ("iphone", "ipod", "ipad", "blackberry", "android" or "windows phone") or false if it is not a mobile
@example

	if (CE.mobileUserAgent()) {
		// It's a mobile
	}
	if (CE.mobileUserAgent() == "android") {
		// It's a Android mobile
	}
*/
CanvasEngine.mobileUserAgent = function() {
	var ua = navigator.userAgent;
	if (ua.match(/(iPhone)/))
		return "iphone";
	else if (ua.match(/(iPod)/))
		return "ipod";
	else if (ua.match(/(iPad)/)) 
		return "ipad";
	else if (ua.match(/(BlackBerry)/)) 
		return "blackberry";
	else if (ua.match(/(Android)/))
		return "android";
	else if (ua.match(/(Windows Phone)/)) 
		return "windows phone";
	else
		return false;
};

CanvasEngine._benchmark = {};
CanvasEngine._interval_benchmark = 60;
CanvasEngine._freq_benchmark = {};
CanvasEngine.microtime = function() {
  var now = new Date().getTime() / 1000;
  var s = parseInt(now, 10);

  return now * 1000;
};
CanvasEngine.benchmark = function(id) {
	var m = this.microtime();
	if (this._benchmark[id]) {
		console.log("Performance " + id + " : " + (m - this._benchmark[id]) + "ms");
	}
	this._benchmark[id] = m;
	
};

CanvasEngine.objectSize = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
@doc utilities/
@method extend `(>= 1.2.7)` Merging two objects
@static
@params {Object} target An object that will receive the new properties if additional objects are passed in.
@params {Object} obj An object containing additional properties to merge in.
@examples

	CE.extend({a: 1}, {b: 2}); // =>{a: 1, b: 2}

@return {Object} 
*/
// TODO : clone
CanvasEngine.extend = function(obj1, obj2, clone) {
	if (!obj1) obj1 = {};
	if (!obj2) obj2 = {};
	return Kernel._extend(obj1, obj2, clone);
}

/*CanvasEngine.browser = function() {
	var ua = navigator.userAgent.toLowerCase();
	var browser = {};
	
	function testNavigator(name) {
		var patt = new RegExp (name);
		browser[name] = {};
		browser[name] = patt.test(ua) && (name == "mozilla" ? !/webkit/.test(ua) : true);
		if (browser[name]
	}
	
	
	browser.webkit = /webkit/.test(ua);
	browser.opera = /opera/.test(ua);
	browser.msie = /msie/.test(ua);
	/msie\/([^ ]+)/.exec();
	return browser;
}*/

/**
@doc utilities/
@static
@property browser `(>= 1.2.8)` Retrieves the methods and properties related to browser.  It contains flags for each of the four most prevalent browser classes (Internet Explorer, Mozilla, Webkit, and Opera) as well as version information.

* `mozilla` : Tests if the browser is Mozilla
* `webkit` : Tests if the browser is Webkit (Chrome, Safari)
* `opera` : Tests if the browser is Opera
* `msie` : Tests if the browser is Internet Explorer

Example

	if (CE.browser.msie) {
		// if browser is Internet Explorer
	}

Knowing the browser version :

* `version`

Example

	if (CE.browser.msie && parseInt(CE.browser.version) == 9) { // crop value
		// if browser is Internet Explorer 9
	}
	
Knowing the browser used by the user :

* `which()`. Returns the object: `{ua: , version: }`

Example
	
	CE.browser.which(); // returns {ua: "mozilla", version: "22.0"}

@type Object
*/

if (typeof exports == "undefined") {
	var _ua = navigator.userAgent.toLowerCase(),
	_version = /(chrome|firefox|msie|version)(\/| )([0-9.]+)/.exec(_ua);
	CanvasEngine.browser = {
		mozilla: /mozilla/.test(_ua) && !/webkit/.test(_ua),
		webkit: /webkit/.test(_ua),
		opera: /opera/.test(_ua),
		msie: /msie/.test(_ua),
		version: _version ? _version[3] : null,
		which: function() {
			var is;
			CanvasEngine.each(["mozilla", "webkit", "opera", "msie"], function(i, ua) {
				if (CanvasEngine.browser[ua]) {
					is = ua;
				}
			})
			return {
				ua: is,
				version: CanvasEngine.browser.version
			};
		}
	};
}



/**
	@doc utilities/
	@method moveArray Move one index to another location of an array
	@static
	@params {&Array} array Array to handle
	@params {Integer} pos1 Index of the element to move
	@params {Integer} pos2 Destination index
	@return {Array} 
*/
// http://jsperf.com/array-prototype-move
// by Richard Scarrott (http://www.richardscarrott.co.uk)
CanvasEngine.moveArray = function(array, pos1, pos2) {
    // local variables
    var i, tmp;
    // cast input parameters to integers
    pos1 = parseInt(pos1, 10);
    pos2 = parseInt(pos2, 10);
    // if positions are different and inside array
    if (pos1 !== pos2 && 0 <= pos1 && pos1 <= array.length && 0 <= pos2 && pos2 <= array.length) {
      // save element from position 1
      tmp = array[pos1];
      // move element down and shift other elements up
      if (pos1 < pos2) {
        for (i = pos1; i < pos2; i++) {
          array[i] = array[i + 1];
        }
      }
	 
      // move element up and shift other elements down
      else {
        for (i = pos1; i > pos2; i--) {
          array[i] = array[i - 1];
        }
      }
      // put element from position 1 to destination
	 
      array[pos2] = tmp;
    }
	
	
	
	return array;
}

/**
@doc utilities/
@method toTimer `(>= 1.3.0)` Converts seconds into a format {hour: "", min: "", sec: ""}
@static
@params {Integer} total_sec Secondes
@return {Array} 
@examples

    CE.toTimer(136); // => {hour: "00", min: "02", sec: "16"}

*/
CanvasEngine.toTimer = function(total_sec) {
	var hour = "" + Math.floor(total_sec / 60 / 60),
		min =  "" + Math.floor(total_sec / 60 % 60),
		sec =  "" + Math.floor(total_sec % 60);
	if (hour.length == 1) hour = "0" + hour;
	if (min.length == 1) min = "0" + min;
	if (sec.length == 1) sec = "0" + sec;
	return {
		hour: hour,
		min: min,
		sec: sec
	};
}

CanvasEngine.algo = {

	pascalTriangle: function(max) {
	
		max = max || 10;
	
		var enchain = [[1,1], [1,2,1]],
		nb_max_move = max - enchain.length;
		
		for (var i=enchain.length ; i <= nb_max_move ; i++) {
			enchain[i] = [1]
			for (var j=1 ; j <= i ; j++) {
				enchain[i][j] = enchain[i-1][j] + enchain[i-1][j-1];
			}
			enchain[i][i+1] = 1;
		}
		
		return enchain;
		
	},
	

	
}

/**
@doc utilities/
@method toMatrix `(>= 1.3.0)` Transforms a one-dimensional array to a table with two Diemension
@static
@params {Array} array The one-dimensional array to convert
@params {Integer} width Width of the matrix created
@params {Integer} height Height of the matrix created
@return {Array} 
@examples

    CE.toMatrix([1, 2, 3, 4], 2, 2); // => [[1, 2], [3, 4]]
    
*/
CanvasEngine.toMatrix = function(array, width, height) {
	var matrix = [], k = 0;
	for (var j=0 ; j < height ; j++) {
		for (var i=0 ; i < width ; i++) {
			if (!matrix[i]) matrix[i] = [];
			matrix[i][j] =  array[k];
			k++;
		}
	}
	return matrix;
}

/**
@doc utilities/
@method rotateMatrix `(>= 1.3.0)` Change the positions of the array elements, the rotation matrix
@static
@params {Array} array The matrix in question
@params {String} rotation (optional) Rotation in degree : `90` or `-90`, `180` (`90` by default)
@return {Array} 
@examples

    var matrix = [
        [1, 0],
        [1, 1],
        [1, 0]
    ];

    CE.rotateMatrix(matrix); 
    
    // => [
            [1, 1, 1],
            [0, 1, 0]
        ]
        
    CE.rotateMatrix(matrix, "-90"); 
    
    // =>   [
				[0, 1, 0],
				[1, 1, 1]
            ]
            
    CE.rotateMatrix(matrix, "180"); 
    
    // =>   [
				[0, 1],
				[1, 1],
				[0, 1]
			]
*/
CanvasEngine.rotateMatrix = function(array, rotation) {
	var matrix = [], matrix2 = [];
	
	rotation = rotation || "90";
	
	if (rotation == "90" || rotation == "-90") {
		for (var j=0 ; j < array[0].length ; j++) {
			matrix[j] = [];
			for (var i=0 ; i < array.length ; i++) {
				matrix[j][i] = array[i][j];
			}
		}
	}
	
	if (rotation == "-90") {
		var j=0;
		for (var i=matrix.length-1 ; i >= 0 ; i--) {
			matrix2[j] = matrix[i];
			j++;
		}
		return matrix2;
	}
	
	if (rotation == "180") {
		for (var i=0 ; i < array.length ; i++) {
			matrix[i] = array[i].reverse();
		}
	}
	
	return matrix;

}


var _CanvasEngine = CanvasEngine;


if (typeof(exports) !== "undefined") {
	exports.Class = Class;
	exports.CanvasEngine = CanvasEngine;
}