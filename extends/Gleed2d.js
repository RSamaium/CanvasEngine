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

Class.create("Gleed2d", {
	_onReady: null,
	_layers: {},
	initialize: function() {
		
	},
/**
@doc gleed2d/
@method load Load an XML file and builds layers of the elements. Calls the method "ready" of this clas after the construction of the elements.
@param {CanvasEngine.Scene} scene Scene
@param {CanvasEngine.Element} el Layers are displayed on this element
@param {String} url Path to the XML file Gleed2d (without extension)
*/
	load: function(scene, el, url) {
		var self = this;
		this.el = el;
		this.url = url;
		this.scene = scene;
		CanvasEngine.ajax({
			url: url + ".xml",
			dataType: "xml",
			success: function(data) {
				self._draw(data);
			}
		});
	},
/**
@doc gleed2d/
@method change Allows you to change the parameters of an element in the construction layers
@param {Function} callback Callback function called before the introduction of an element. Returns the same object with different values ??to change the element. Two parameters :

* {CanvasEngine.Element} The element is created and ready to be displayed on the layer
* {Object} the parameters of the element :

	{
		id: {String} (filename),
		regX: {Integer},
		regY: {Integer},
		x: {Integer},
		y: {Integer},
		rotate: {Integer},
		scaleX: {Float},
		scaleY: {Float}
	}
		
@example
In the method "ready" of current scene :

	var gleed = canvas.Gleed2d.new();
	gleed.ready(function() {
		
	});
	gleed.change(function(el, params) {
		console.log(params.x, params.y); // Change Position X and Position Y
		return {
			x: params.x + 5 // Change the position x of the element.
		};
	});
	gleed.load(this, element, "data");


Dividing the image of the element : 

	var gleed = canvas.Gleed2d.new();
	gleed.ready(function() {
		
	});
	gleed.change(function(el, params) {
		return {
			img: [0, 0, 42, 42, 0, 0, 42, 42] // == drawImage(image, 0, 0, 42, 42, 0, 0, 42, 42);
		};
	});
	gleed.load(this, element, "data");


Not allow drawing on the element

	var gleed = canvas.Gleed2d.new();
	gleed.ready(function() {
		
	});
	gleed.change(function(el, params) {
		el.drawImage("other_img");
		return {
			draw: false
		};
	});
	gleed.load(this, element, "data");

*/
	change: function(callback) {
		this._set = callback;
	},
	/**
		@doc gleed2d/
		@method ready Calls the callback function at the end of the construction elements (loading and layers)
		@param {Function} callback Callback function. "this" refers to the class Gleed2d
	*/
	ready: function(callback) {
		this._onReady = callback;
	},
	_draw: function(data) {
		var scene = this.scene, match;
		var layers = data.getElementsByTagName('Layer');
		this.map = scene.createElement();
		
		function getValue(item, type, attr)  {
			var node = item.getElementsByTagName(type)[0];
			if (attr) {
				node = node.getElementsByTagName(attr)[0];
			}
			return node.childNodes[0].nodeValue;
		}
		
		for (var i=0 ; i < layers.length ; i++) {
			var items = layers[i].getElementsByTagName('Item');
			var name = layers[i].getAttribute('Name');
			var el = scene.createElement();
			for (var j=0 ; j < items.length ; j++) {
				var item = items[j];
				var asset = getValue(item, "asset_name");
				if (match = asset.match(/\\([^\\]+$)/)) {
					asset = match[1];
				}
				var origin_x = getValue(item, "Origin", "X"),
					origin_y = getValue(item, "Origin", "Y");
				var el_item = scene.createElement();
				var params = {
					id: asset,
					draw: true,
					img: [],
					regX: origin_x,
					regY: origin_y,
					x: getValue(item, "Position", "X") - origin_x,
					y: getValue(item, "Position", "Y") - origin_y,
					rotate: getValue(item, "Rotation"),
					scaleX: getValue(item, "Scale", "X"),
					scaleY: getValue(item, "Scale", "Y")
				};
				if (this._set) {
					var ret = this._set.call(this, el_item, params);
					if (ret) {
						for (var p in ret) {
							params[p] = ret[p];
						}
					}
				}
				if (params.draw) {
					el_item.drawImage(params.id, params.img[0], params.img[1], params.img[2], params.img[3], params.img[4], params.img[5], params.img[6], params.img[7]);
				}
				el_item.setOriginPoint(params.regX, params.regY);
				el_item.x = params.x;
				el_item.y = params.y;
				el_item.rotateTo(params.rotate + "rad");
				el_item.scaleX = params.scaleX;
				el_item.scaleY = params.scaleY;
				el.append(el_item);
			}
			this._layers[name] = el;
			this.map.append(el);
		}
		this.el.append(this.map);
		if (this._onReady) this._onReady.call(this);
	},
	/**
		@doc gleed2d/
		@method getLayer Retrieve a layer according to its name
		@param {String} name Layer name
		@return CanvasEngine.Element
	*/
	getLayer: function(name) {
		return this._layers[name];
	}
});


/**
@doc gleed2d
@class Gleed2d GLEED2D (Generic LEvel EDitor 2D) is a general purpose, non tile-based Level Editor for 2D games of any genre that allows arbitrary placement of textures and other items in 2D space. Levels are saved in XML format. Custom Properties can be added to the items in order to represent game-specific data/events/associations between items etc. 

http://gleed2d.codeplex.com

This class reads the XML file generated by Gleed2d to insert into CanvasEngine
@example

	var canvas = CE.defines("canvas_id").
	extend(Gleed2d).
	ready(function() {
		canvas.Scene.call("MyScene");
	});
		
	canvas.Scene.new({
		name: "MyScene",
		materials: {
			images: {
				img1_id: "path/to/img1.png",
				img2_id: "path/to/img2.png"
			}
		},
		ready: function(stage) {
			var self = this;
			this.layer = null;
			this.element = this.createElement();
			
			// -- Gleed2d Level
			var gleed = canvas.Gleed2d.new();
			gleed.ready(function() {
				self.layer = this.getLayer("background");
			});
			gleed.load(this, element, "data");
			// --
			
			stage.append(this.element);
		},
		render: function(stage) {
			this.layer.x -= 2;
			stage.refresh();
		}
	});


*/
var Gleed2d = {
	Gleed2d: {
		New: function() { return this["new"].apply(this, arguments); },
		"new": function() {
			return Class["new"]("Gleed2d");
		}
	}
};