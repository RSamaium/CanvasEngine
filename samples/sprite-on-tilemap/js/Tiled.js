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

Class.create("Tiled", {
	el: null,
	url: "",
	tile_w: 0,
	tile_h: 0,
	tilesets: [],
	width: 0,
	height: 0,
	layers: [],
	objects: [],
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
	 */
	load: function(scene, el, url) {
		var self = this;
		this.el = el;
		this.url = url;
		this.scene = scene;
		CanvasEngine.getJSON(this.url, function(data) {
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
			var _id, length = self.tilesetsIndexed.length + (Math.round(self.tilesets[self.tilesets.length-1].imagewidth / self.tile_h) * (Math.round(self.tilesets[self.tilesets.length-1].imagewidth / self.tile_w)));
			for (var m=1; m < length; m++) {
				_id = self.tilesetsIndexed[m] ? m : _id;
				self.tilesetsIndexed[m] = self.tilesetsIndexed[_id];
			}
			console.log('tilesetsIndexed', length, self.tilesetsIndexed.length, self.tilesetsIndexed);
			self._draw();
		});
	},
	_draw: function() {
		this.map = this.scene.createElement();
		this.el_layers = [];
		var x, y, tileset;
		var id, _tile, _id;
		for (var i=0 ; i < this.layers.length ; i++) {
			id = 0;
			this.el_layers[i] = this.scene.createElement();
			if (this.layers[i].data) {
				for (var k=0 ; k < this.layers[i].height ; k++) {
					for (var j=0 ; j < this.layers[i].width ; j++) {
						_tile = this.scene.createElement();
						_id = this.layers[i].data[id];
						if (_id != 0) {
							tileset = this.tilesetsIndexed[_id];
							_id -= tileset.firstgid;
							y = this.tile_h * Math.floor(_id / (Math.round(tileset.imagewidth / this.tile_h)));
							x = this.tile_w * (_id % Math.round(tileset.imagewidth / this.tile_w));
							
							_tile.drawImage(tileset.name, x, y, this.tile_w, this.tile_h, j * this.tile_w, k * this.tile_h, this.tile_w, this.tile_h);
							this.el_layers[i].append(_tile);
						}
						id++;
					}
				}
			}
			else {
				this.objects.push(this.el_layers[i]);
			}
			this.map.append(this.el_layers[i]);
		}
		this.el.append(this.map);
		if (this._ready) this._ready.call(this);
	},
	 /**
		@doc tiled/
		@method getLayerObject Retrieves the object layer.
		@param {Integer} pos (optional) Returns the layer depending on its position in the superposition (0 = very top). 0 by default
		@return {CanvasEngine.Element}
	 */
	getLayerObject: function(pos) {
		if (!pos) pos = 0;
		return this.objects[pos];
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
		@method getTileWidth Returns the height of the map in tiles 
		@return {Integer}
	 */
	getTileHeight: function() {
		return this.tile_h;
	},
	 /**
		@method getTileWidth Returns the width of the map in pixels
		@return {Integer}
	 */
	getWidthPixel: function() {
		return this.width * this.getTileWidth();
	},
	 /**
		@doc tiled/
		@method getTileWidth Returns the height of the map in pixels
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
	}
});

/**
	@doc tiled
	@class Tiled Tiled is a general purpose tile map editor. It's built to be easy to use, yet flexible enough to work with varying game engines, whether your game is an RPG, platformer or Breakout clone. Tiled is free software and written in C++, using the Qt application framework.
	
	http://www.mapeditor.org
	
	 <p>Consider adding inserting Tiled.js</p>
	 <code>
		 <script src="extends/Tiled.js"></script>
		 <script>
		   var canvas = CE.defines("canvas_id").
			extend(Tiled).
			ready(function() {
				
			});
		 </script>
	 </code>
	
	@param {CanvasEngine.Scene} scene
	@param {CanvasEngine.Element} el The layers are displayed on this element
	@param {String} url Path to the JSON file of Tiled Map Editor
	@example
	<code>
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
				tiled.load(this, el, "map/map.json");
				tiled.ready(function() {
					 var tile_w = this.getTileWidth(),
						 tile_h = this.getTileHeight(),
						 layer_object = this.getLayerObject();
					 stage.append(el);
				});
				
			}
		});
	</code>
*/
var Tiled = {
	Tiled: {
		"new": function(scene, el, url) {
			return Class["new"]("Tiled", [scene, el, url]);
		}
	}
};

