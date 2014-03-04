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

if (typeof exports != "undefined") {
	var CE = require("canvasengine").listen(),
		CanvasEngine = false,
		Class = CE.Class;
}

Class.create("Tiled", {
	el: null,
	url: "",
	tile_w: 0,
	tile_h: 0,
    tile_image_h:0,
    tile_image_w:0,
	tilesets: [],
	width: 0,
	height: 0,
	layers: [],
	objects: {},
	scene: null,
	_ready: null,
	initialize: function() {
	},
	 /**
		@doc tiled/
		@method ready Calls the function when the layers are drawn
		@param {Function} callback
	 */
	ready: function(callback) {
		this._ready = callback;
	},
/**
@doc tiled/
@method load Load JSON file and draw layers in the element of the scene. View Tiled class description for more informations (http://canvasengine.net/doc/?p=editor.tiled)
@param {CanvasEngine.Scene} scene
@param {CanvasEngine.Element} el The element containing layers of Tiled
@param {String} url Path to JSON file of Tiled Map Editor
@example

Example with Node.js :

Server :

	var CE = require("canvasengine").listen(8333),
		Tiled = CE.Core.requireExtend("Tiled").Class,
		Class = CE.Class;
	
	CE.Model.init("Main", {

		initialize: function(socket) {
		
			var tiled = Class.New("Tiled");
			tiled.ready(function(map) {
				socket.emit("Scene_Map.load", map);
			});
			tiled.load("Map/map.json");
			
		}
	});
	
Client :

	canvas.Scene.New({
		name: "Scene_Map",
		events: ["load"],
		materials: {
			images: {
				tileset: "my_tileset.png"
			}
		},
		load: function(data) {
		
		    var tiled = canvas.Tiled.New();

			tiled.ready(function() {
			 var tile_w = this.getTileWidth(),
				 tile_h = this.getTileHeight(),
				 layer_object = this.getLayerObject();
			});
			
			tiled.load(this, this.getStage(), data);
	
		}
	
	});

*/
	load: function(scene, el, url) {
		var self = this;
		
		if (typeof scene == "string") {
			this.url = url = scene;
		}
		else {
			this.el = el;
			this.url = url;
			this.scene = scene;
		}
		
		function ready(data) {
			var clone_data = CE.Core.extend({}, data);
			self.tile_h = data.tileheight;
			self.tile_w = data.tilewidth;
			self.width = data.width;
			self.height = data.height;
			self.tilesets = data.tilesets;
			self.layers = data.layers;
			self.tilesetsIndexed = [];
			
			for (var i=0 ; i < self.tilesets.length ; i++) {
				var props = self.tilesets[i].tileproperties,
					new_props = {};
				if (props) {
					for (var key in props) {
						new_props[+key+1] = props[key];
					}
					self.tilesets[i].tileproperties = new_props;
				}
				self.tilesetsIndexed[self.tilesets[i].firstgid] = self.tilesets[i];
			}
			
            //
            // Check to see if the tileset uses a different height/width to the layer
            // For example, pseudo-3d tiles such as PlanetCute are 101x171 sprites 
            // on a Tiled layer grid of 101x80
            //
            if (self.tilesets[0].tileheight && self.tilesets[0].tilewidth) {
                self.tile_image_h = self.tilesets[0].tileheight;
                self.tile_image_w = self.tilesets[0].tilewidth;
            } else {
                self.tile_image_h = self.tile_h;
                self.tile_image_w = self.tile_w;
            }
			var _id, length = self.tilesetsIndexed.length + (Math.round(self.tilesets[self.tilesets.length-1].imageheight / self.tile_h) * (Math.round(self.tilesets[self.tilesets.length-1].imagewidth / self.tile_w)));
			
			for (var m=0; m < length; m++) {
				_id = self.tilesetsIndexed[m] ? m : _id;
				self.tilesetsIndexed[m] = self.tilesetsIndexed[_id];
			}
			
			if (typeof exports == "undefined") {
				self._draw();
			}
			else {
				if (self._ready) self._ready.call(self, clone_data);
			}
			
			
		}
		
		if (typeof url === 'string') {
			(CanvasEngine || CE.Core).getJSON(this.url, ready);
		}	
		else {
			ready(url);
		}
		
	},

	_drawTile: function(_id, layer_name, data) {
		var _tile = this.scene.createElement(),
			tileset, tileoffset, nb_tile = {};
		
		if (data.position != "absolute") {
			data.x *= this.tile_w;
			data.y *= this.tile_h;
		}

		var flippedHorizontally = false, flippedVertically = false, flippedAntiDiagonally = false;
		if (_id & Tiled.FlippedHorizontallyFlag) {
			flippedHorizontally = true;
		}
		if (_id & Tiled.FlippedVerticallyFlag) {
			flippedVertically = true;
		}
		if (_id & Tiled.FlippedAntiDiagonallyFlag) {
			flippedAntiDiagonally = true;
		}
		
		_id &= ~(Tiled.FlippedHorizontallyFlag | Tiled.FlippedVerticallyFlag | Tiled.FlippedAntiDiagonallyFlag);
		
		tileset = this.tilesetsIndexed[_id];
		_id -= tileset.firstgid;
		
		nb_tile = {
			width: tileset.imagewidth / this.tile_image_w,
			height: tileset.imageheight / this.tile_image_h 
		};
		
		tileoffset = tileset.tileoffset || {x: 0, y: 0};
		
		y = this.tile_image_h * Math.floor(_id / (nb_tile.width - (nb_tile.width / 2 * tileset.margin)));        
		x = this.tile_w * (_id % Math.round((tileset.imagewidth - nb_tile.height / 2 * tileset.margin) / this.tile_w));
		
		_tile.drawImage(tileset.name, x + tileset.spacing * x / this.tile_w + tileset.margin, y + tileset.spacing * y / this.tile_h + tileset.margin, this.tile_w, this.tile_h, data.x + tileoffset.x, data.y + tileoffset.y, this.tile_w, this.tile_h);
		this.el_layers[layer_name].append(_tile);
		var scaleX = (flippedHorizontally) ? -1 : 1,
			scaleY = (flippedVertically) ? -1 : 1,
			rotation = 0;
		
		if (flippedAntiDiagonally) {
			rotation = 90;
			scaleX *= -1;
			
			halfDiff = nb_tile.height/2 - nb_tile.width/2
			y += halfDiff
		}
		_tile.drawImage(tileset.name, x + tileset.spacing * x / this.tile_image_w + tileset.margin, y + tileset.spacing * y / this.tile_image_h + tileset.margin, this.tile_image_w, this.tile_image_h, 0, 0, this.tile_image_w, this.tile_image_h);
		_tile.x = data.x + tileoffset.x
		_tile.y = data.y + tileoffset.y
		_tile.width = this.tile_w
		_tile.height = this.tile_h
		_tile.setOriginPoint("middle");
		_tile.scaleX = scaleX
		_tile.scaleY = scaleY
		_tile.rotation = rotation

		if (data.visible === false) {
			_tile.hide();
		}
	
		this.el_layers[layer_name].append(_tile);

		return _tile;
	},

	_draw: function() {
		this.map = this.scene.createElement();
		this.el_layers = {};
		var x, y, tileset, layer, self = this;
		var id, _id, obj, layer_type, el_objs = {};

		for (var i=0 ; i < this.layers.length ; i++) {
			id = 0;
			layer = this.layers[i];
			this.el_layers[layer.name] = this.scene.createElement();
			if (layer.type == "tilelayer") {
				for (var k=0 ; k < layer.height ; k++) {
					for (var j=0 ; j < layer.width ; j++) {
						_id = layer.data[id];
						if (_id != 0) {						
							this._drawTile(_id, layer.name, {
								x: j,
								y: k
							});
						}
						id++;
					}
				}
			}
			else if (layer.type == "objectgroup") {
				for (var j=0 ; j < layer.objects.length ; j++) {
					obj = layer.objects[j];
					if (!el_objs[obj.name]) el_objs[obj.name] = [];
					
					if (obj.gid) {
						el_objs[obj.name].push(this._drawTile(obj.gid, layer.name, CE.extend(obj, {
							y: obj.y - this.tile_h,
							position: "absolute"
						})));
					}
				}
				this.objects[layer.name] = {
					layer: this.el_layers[layer.name],
					objects: el_objs
				};
			}
			this.map.append(this.el_layers[layer.name]);
		}
		this.el.append(this.map);
		if (this._ready) this._ready.call(this);
	},
	 /**
		@doc tiled/
		@method getLayerObject Retrieves the object layer.
		@param {Integer} name  Returns the layer by name
		@return {CanvasEngine.Element}
	 */
	getLayerObject: function(name) {
		if (!name) {
			for (var id in this.objects) {
				name = id;
				break;
			}
		}
		if (!this.objects[name]) {
			return false;
		}
		return this.objects[name].layer;
	},


	// TODO
	getObject: function(layer_name, obj_name, pos) {
		if (!pos) pos = 0;
		return this.objects[layer_name].objects[obj_name][pos];
	},

	 /**
		@doc tiled/
		@method getLayer Retrieves the layer by its identifier.
		@param {String} id Layer name in Tiled Map Editor
		@return {CanvasEngine.Element}
	 */
	getLayer: function(id) {
		return this.el_layers[id];
	},
	 /**
		@doc tiled/
		@method getMap Returns the element containing all the layers
		@return {CanvasEngine.Element}
	 */
	getMap: function() {
		return this.map;
	},
	 /**
		@doc tiled/
		@method getTileWidth Returns the width of the map in tiles 
		@return {Integer}
	 */
	getTileWidth: function() {
		return this.tile_w;
	},
	 /**
		@doc tiled/
		@method getTileHeight Returns the height of the map in tiles 
		@return {Integer}
	 */
	getTileHeight: function() {
		return this.tile_h;
	},
	 /**
	 	@doc tiled/
		@method getWidthPixel Returns the width of the map in pixels
		@return {Integer}
	 */
	getWidthPixel: function() {
		return this.width * this.getTileWidth();
	},
	 /**
		@doc tiled/
		@method getHeightPixel Returns the height of the map in pixels
		@return {Integer}
	 */
	getHeightPixel: function() {
		return this.height * this.getTileHeight();
	},
	 /**
		@doc tiled/
		@method getDataLayers Returns the data for each map
		@return {Array}
	 */
	getDataLayers: function() {
		var layer = [];
		for (var i=0 ; i < this.layers.length ; i++) {
			if (this.layers[i].data) layer.push(this.layers[i].data);
		}
		return layer;
	},
	 /**
		@doc tiled/
		@method getTileInMap Retrieves the position of a tile to the Tileset according positions X and Y
		@params {Integer} x Position X
		@params {Integer} y Position Y
		@return {Array}
	 */
	getTileInMap: function(x, y) {
		return this.width * y + x;
	},
	 /**
		@doc tiled/
		@method getTileProperties Gets the properties of a tile depending on its identifier
		@params {Integer} tile Id of tile
		@params {String} (optional) layer Layer name
		@return {Object}
	 */
	  /**
		@doc tiled/
		@method getTileProperties Gets the properties of a tile depending on its positions
		@params {Integer} tile Id of tile. Put "null"
		@params {Integer} x Positon X
		@params {Integer} y Positon Y
		@return {Object}
	 */
	getTileProperties: function(tile, layerOrX, y) {
		var self = this;
		var tileset = this.tilesets[0];
		function _getTileLayers(tile) {
			var _layers = [];
			for (var i=0 ; i < self.layers.length ; i++) {
				if (self.layers[i].data) _layers.push(tileset.tileproperties[self.layers[i].data[tile]]);
			}
			return _layers;
		}
		
		if (layerOrX === undefined) {
			return _getTileLayers(tile);
		}
		else if (y !== undefined) {
			var new_tile = this.getTileInMap(layerOrX, y);
			return _getTileLayers(new_tile);
		}
		return tileset.tileproperties[this.layers[layerOrX].data[tile]];
	},
	
	tileToProperty: function(prop_name) {
		var layers = this.getDataLayers(), val;
		var new_layers = [];
		for (var i=0 ; i < layers.length ; i++) {
			new_layers[i] = [];
			for (var j=0 ; j < layers[i].length ; j++) {
				val = this.tilesets[0].tileproperties[layers[i][j]]; // Hack Tiled Bug
				new_layers[i][j] =  val ? +val[prop_name] : 0;
			}
		}
		return new_layers;
	}
	
	
});

/**
@doc tiled
@class Tiled Tiled is a general purpose tile map editor. It's built to be easy to use, yet flexible enough to work with varying game engines, whether your game is an RPG, platformer or Breakout clone. Tiled is free software and written in C++, using the Qt application framework.

http://www.mapeditor.org

Consider adding inserting Tiled.js

	 <script src="extends/Tiled.js"></script>
	 <script>
	   var canvas = CE.defines("canvas_id").
		extend(Tiled).
		ready(function() {
			
		});
	 </script>


@param {CanvasEngine.Scene} scene
@param {CanvasEngine.Element} el The layers are displayed on this element
@param {String} url Path to the JSON file of Tiled Map Editor
@example

	var canvas = CE.defines("canvas_id").
		extend(Tiled).
		ready(function() {
			canvas.Scene.call("MyScene");
		});
		
	canvas.Scene.new({
		name: "MyScene",
		materials: {
			images: {
				mytileset: "path/to/tileset.png"
			}
		},
		ready: function(stage) {
			 var el = this.createElement();
			 var tiled = canvas.Tiled.new();
			
			tiled.ready(function() {
				 var tile_w = this.getTileWidth(),
					 tile_h = this.getTileHeight(),
					 layer_object = this.getLayerObject();
				 stage.append(el);
			});
			tiled.load(this, el, "map/map.json");
		}
	});

1. `mytileset` in material object is the name of tileset in Tiled Map Editor
2. `getLayer()` retrieves a layer. The name is the same as in Tiled Map Editor

![](http://canvasengine.net/presentation/images/tiled2.png)
	
*/
var Tiled = {
	Tiled: {
		FlippedHorizontallyFlag: 0x80000000,
		FlippedVerticallyFlag: 0x40000000,
		FlippedAntiDiagonallyFlag: 0x20000000,
		New: function() { return this["new"].apply(this, arguments); },
		"new": function(scene, el, url) {
			return Class["new"]("Tiled", [scene, el, url]);
		}
	}
};

if (typeof exports != "undefined") {
	exports.Class = Tiled.Tiled;
}
