var fs;
if (typeof(require) !== "undefined") {
	fs = require('fs');
}

function Kernel(class_method) {
	this.class_method = class_method;
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
	"new": function() {
		this._class = new Class();
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
	attr_accessor: function(attrs) {
		return this._attr_accessor(attrs, true, true);
	},
	attr_reader: function(attrs) {
		return this._attr_accessor(attrs, true, false);
	},
	attr_writer: function(attrs) {
		return this._attr_accessor(attrs, false, true);
	},
	extend: function(object, clone) {
		Kernel._extend(this.class_method, object, clone);
		return this;
	},
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

Class.get = function(name) {
	return Class.__class[name];
};


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
		var kernel = Class.__class_config[name].kernel = new Kernel(Class.__class_config[name].methods);
		//p.extend(methods);
	}
	return kernel;
}

Class["new"] = function(name, params) {
	var _class;
	params = params || [];
	if (!Class.__class_config[name]) {
		throw name + " class does not exist. Use method \"create\" for build the structure of this class";
		return;
	}
	_class = Class.__class_config[name].kernel["new"]();
	if (_class.initialize) {
		_class.initialize.apply(_class, params);
	}

	_class.__name__ = name;
	return _class;
}

Class.prototype = {
	extend: function(object, clone) {
		return Kernel._extend(this, object, clone);
	}
}

var CanvasEngine = {};

CanvasEngine.uniqid = function() {
   // return new Date().getTime();
   return Math.random();
};

CanvasEngine.arraySplice = function(val, array) {
	var i;
	for (i=0 ; i < array.length ; ++i) {
		if (val == array[i]) {
			array.splice(i, 1);
			return;
		}
	}
};

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
						options.success(ret);
					}
			  }
		 }
	}; 
	
   xhr.open(options.type, options.url,  true); 
   xhr.send(options.data); 

}

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

CanvasEngine.parseJSON = function(json) {
	return JSON.parse(json);
}

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

CanvasEngine.inArray = function(val, array)  {
	var i;
	for (i=0 ; i < array.length ; ++i) {
		if (val == array[i]) {
			return i;
		}
	}
	return -1;
};

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
}

CanvasEngine.hexaToRGB = function(hexa) {
	var r, g, b;
	
	function cutHex(h) {
		return (h.charAt(0) == "#") ? h.substring(1,7) : h;
	}
	
	r = parseInt((cutHex(hexa)).substring(0,2),16);
	g = parseInt((cutHex(hexa)).substring(2,4),16);
	b = parseInt((cutHex(hexa)).substring(4,6),16);

	return [r, g, b];
}

var _CanvasEngine = CanvasEngine;


if (typeof(exports) !== "undefined") {
	exports.Class = Class;
	exports.CanvasEngine = CanvasEngine;
}