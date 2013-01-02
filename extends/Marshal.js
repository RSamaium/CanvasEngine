/**
  * Copyright (c) 2009-2011 Ivo Wetzel.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */
(function(array, undefined) {

    var BitStream = (function() {

        // Some Lookup tables
        var chrTable = new array(255);
        for(var i = 0; i < 256; i++) {
            chrTable[i] = String.fromCharCode(i);
        }

        var maskTable = new array(8),
            powTable = new array(8);

        for(var i = 0; i < 9; i++) {
            maskTable[i] = ~((powTable[i] = Math.pow(2, i) - 1) ^ 0xFF);
        }

        var stream = '',
            value = 0,
            left = 8,
			index = 0,
            max = 0;

        return {

            open: function(data) {

                left = 8;

                if (data !== undefined) {
                    max = data.length;
                    index = 0;
                    stream = data;
                    value = stream.charCodeAt(index);

                } else {
                    value = 0;
                    stream = '';
                }

            },

            close: function() {

                if (value > 0) {
                    stream += chrTable[value];
                }

                return stream;

            },

            writeRaw: function(raw) {

                if (left !== 8) {
                    stream += chrTable[value];
                    value = 0;
                    left = 8;
                }

                stream += raw;
            },

            readRaw: function(count) {

                if (left !== 8) {
                    index++;
                    value = 0;
                    left = 8;
                }

                var data = stream.substr(index, count);

                index += count;
                value = stream.charCodeAt(index);
                return data;

            },

            write: function write(val, count) {

                var overflow = count - left,
                    use = left < count ? left : count,
                    shift = left - use;

                if (overflow > 0) {
                    value += val >> overflow << shift;

                } else {
                    value += val << shift;
                }

                left -= use;

                if (left === 0) {

                    stream += chrTable[value];
                    left = 8;
                    value = 0;

                    if (overflow > 0) {
                        write(val & powTable[overflow], overflow);
                    }

                }

            },

            read: function read(count) {

                if (index >= max) {
                    return null;
                }

                var overflow = count - left,
                    use = left < count ? left : count,
                    shift = left - use;

                var val = (value & maskTable[left]) >> shift;
                left -= use;

                if (left === 0) {

                    value = stream.charCodeAt(++index);
                    left = 8;

                    if (overflow > 0) {
                        val = val << overflow | read(overflow);
                    }

                }

                return val;

            }

        };

    })();

	// Shorthands
	var write = BitStream.write,
		read = BitStream.read,
		writeRaw = BitStream.writeRaw,
		readRaw = BitStream.readRaw,
		open = BitStream.open,
		close = BitStream.close;

    // Encoder ----------------------------------------------------------------
    function _encode(value, top) {

        // Numbers
        if (typeof value === 'number') {

            var type = value !== (value | 0),
                sign = 0;

            if (value < 0) {
                value = -value;
                sign = 1;
            }

            write(1 + type, 3);

            // Float
            if (type) {

                var shift = 1,
                    step = 10;

                while(step <= value) {
                    shift++;
                    step *= 10;
                }

                // Ensure we don't lose precision
                shift = (8 - shift) + 1;
                value = Math.round(value * (1000000000 / step));

                // Figure out the smallest exp for value
                while(value / 10 === ((value  / 10) | 0)) {
                    value /= 10;
                    shift--;
                }

            }

            // 2 size 0-3: 0 = < 16 1 = < 256 2 = < 65536 3 >
            if (value < 2) {
                write(value, 4);

            } else if (value < 16) {
                write(1, 3);
                write(value, 4);

            } else if (value < 256) {
                write(2, 3);
                write(value, 8);

            } else if (value < 4096) {
                write(3, 3);
                write(value >> 8 & 0xff, 4);
                write(value & 0xff, 8);

            } else if (value < 65536) {
                write(4, 3);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);

            } else if (value < 1048576) {
                write(5, 3);
                write(value >> 16 & 0xff, 4);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);

            } else if (value < 16777216) {
                write(6, 3);
                write(value >> 16 & 0xff, 8);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);

            } else {
                write(7, 3);
                write(value >> 24 & 0xff, 8);
                write(value >> 16 & 0xff, 8);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);
            }

            write(sign, 1);

            if (type) {
                write(shift, 4);
            }

        // Strings
        } else if (typeof value === 'string') {

            var l = value.length;
            write(3, 3);

            if (l > 65535) {
                write(31, 5);
                write(l >> 24 & 0xff, 8);
                write(l >> 16 & 0xff, 8);
                write(l >> 8 & 0xff, 8);
                write(l & 0xff, 8);

            } else if (l > 255) {
                write(30, 5);
                write(l >> 8 & 0xff, 8);
                write(l & 0xff, 8);

            } else if (l > 28) {
                write(29, 5);
                write(l, 8);

            } else {
                write(l, 5);
            }

            writeRaw(value);

        // Booleans
        } else if (typeof value === 'boolean') {
            write(+value, 5);

        // Null
        } else if (value === null) {
            write(2, 5);

        // Arrays
        } else if (value instanceof array) {

            write(4, 3);
            for(var i = 0, l = value.length; i < l; i++) {
                _encode(value[i]);
            }

            if (!top) {
                write(6, 3);
            }

        // Object
        } else {

            write(5, 3);
            for(var e in value) {
                _encode(e);
                _encode(value[e]);
            }

            if (!top) {
                write(6, 3);
            }

        }

    }

    function encode(value) {
        open();
        _encode(value, true);
        write(0, 3);
        write(3, 2);
        return close();
    }

    var powTable = new array(16);
    for(var i = 0; i < 16; i++) {
        powTable[i] = Math.pow(10, i);
    }


    // Decoder ----------------------------------------------------------------
    function decode(string) {

        var stack = [], i = -1,
            type, top, value, obj,
            getKey = false, key, isObj, decoded;

        open(string);
        while(true) {

            // Grab type
            type = read(3);

            // Null / Bool / EOS
            if (type === 0) {

                value = read(2);

                // Null
                if (value === 2) {
                    value = null;

                // A boolean
                } else if (value < 2) {
                    value = !!value;

                // End of stream
                } else if (value === 3) {
                    break;
                }

            // Integer / Float
            } else if (type === 1 || type === 2) {

                switch(read(3)) {
                    case 0:
                        value = read(1);
                        break;

                    case 1:
                        value = read(4);
                        break;

                    case 2:
                        value = read(8);
                        break;

                    case 3:
                        value = (read(4) << 8)
                                + read(8);

                        break;

                    case 4:
                        value = (read(8) << 8)
                                + read(8);

                        break;

                    case 5:
                        value = (read(4) << 16)
                                + (read(8) << 8)
                                + read(8);

                        break;

                    case 6:
                        value = (read(8) << 16)
                                + (read(8) << 8)
                                + read(8);

                        break;

                    case 7:
                        value = (read(8) << 24)
                                + (read(8) << 16)
                                + (read(8) << 8)
                                + read(8);

                        break;
                }

                if (read(1)) {
                    value = -value;
                }

                if (type === 2) {
                    value /= powTable[read(4)];
                }

            // String
            } else if (type === 3) {

                var size = read(5);
                switch(size) {
                    case 31:
                        size = (read(8) << 24)
                               + (read(8) << 16)
                               + (read(8) << 8)
                               + read(8);

                        break;

                    case 30:
                        size = (read(8) << 8)
                               + read(8);

                        break;

                    case 29:
                        size = read(8);
                        break;

                }

                value = readRaw(size);

                if (getKey) {
                    key = value;
                    getKey = false;
                    continue;
                }

            // Open Array / Objects
            } else if (type === 4 || type === 5) {

                getKey = type === 5;
                value = getKey ? {} : [];

                if (decoded === undefined) {
                    decoded = value;

                } else {

                    if (isObj) {
                        top[key] = value;

                    } else {
                        top.push(value);
                    }
                }

                top = stack[++i] = value;
                isObj = !(top instanceof Array);
                continue;

            // Close Array / Object
            } else if (type === 6) {
                top = stack[--i];
                getKey = isObj = !(top instanceof Array);
                continue;
            }


            // Assign value to top of stack or return value
            if (isObj) {
                top[key] = value;
                getKey = true;

            } else if (top !== undefined) {
                top.push(value);

            } else {
                return value;
            }

        }

        return decoded;

    }

    // Exports
    if (typeof window === 'undefined') {
        exports.encode = encode;
        exports.decode = decode;

    } else {
        window.BISON = {
            encode: encode,
            decode: decode
        };
    }

})(Array);

/**
@doc save
@class Marshal The marshaling library converts collections of JS objects into a BISON format, allowing them to be stored in localStorage. This data may subsequently be read and the original objects reconstituted.

BISON : https://github.com/BonsaiDen/BiSON.js/
Inspired of Ruby : http://www.ruby-doc.org/core-1.9.3/Marshal.html

@static
@example
To write :

	Class.create("Foo", {
		bar: 2
	});
	Class.create("Test", {
		qux: 5
	});
	var foo = Class.new("Foo"),
		test = Class.new("Test");
	Marshal.dump(foo, "save_name");
	test.qux = 10;
	Marshal.dump(test, "save_name");

Read the save from above :

	Class.create("Foo", {
		bar: 2
	});
	Class.create("Test", {
		qux: 5
	});
	var foo = Class.new("Foo"),
		test = Class.new("Test");
	foo = Marshal.load("save_name");
	test = Marshal.load("save_name");
	console.log(test.qux); // 10

*/
Marshal = {
	_pointer: 0,
	_cache: {},
	_stack_dump: [],
	
	_decode: function(val) {
		if (navigator.appName == 'Microsoft Internet Explorer') {
			return JSON.parse(val);
		}
		else {
			return BISON.decode(val);
		}
	},
	
	_encode: function(val) {
		if (navigator.appName == 'Microsoft Internet Explorer') {
			return JSON.stringify(val);
		}
		else {
			return BISON.encode(val);
		}
	},
	
	/**
		@doc save/
		@method exist Testing the existence of save in localStorage
		@param {String} name Save name
		@return Class
	*/
	exist: function(file) {
		return localStorage && localStorage[file];
	},
	/**
		@doc save/
		@method load Load data and restores the properties of the class the order of the stack of Marshal
		@param {String} name Save name
		@return Class
	*/
	load: function(file) {
		var data, _class, _class_name;
		
		if (this._cache[file]) {
			data = this._cache[file];
		}
		else if (localStorage) {
			data = this._decode(localStorage[file]) || [];
			this._cache[file] = data;
		}
		if (!Marshal.exist(file)) {
			return false;
		}
		if (_class_name = data[this._pointer].__name__) { // not ==. Class name verification
			_class = Class.get(_class_name);
			for (var method in data[this._pointer]) {
				_class[method] = data[this._pointer][method];
			}
		}
		else {
			_class = data[this._pointer];
		}
		this._pointer++;
		return _class;
	},
	/**
		@doc save/
		@method dump Saves the properties of a class in localStorage. The order is important for recovery with load method
		@param {Class} _class Class
		@param {String} name Save name
	*/
	dump: function(_class, file) {
		var storage = [], new_data = {};
		if (typeof _class == "number" ||
			typeof _class == "string" ||
			_class instanceof Array) {
			new_data = _class;
		}
		else {
			for (var method in _class) {
				if (typeof _class[method] != "function") {
					new_data[method] = _class[method];
				}
			}
		}
		this._stack_dump.push(new_data);
		if (localStorage) {
			localStorage[file] = this._encode(this._stack_dump);
		}
		
	},
	
	/**
		@doc save/
		@method remove Remove save
		@param {String} name Save name
	*/
	remove: function(file) {
		if (localStorage) {
			localStorage.removeItem(file);
			return true;
		}
		return false;
	}
};
