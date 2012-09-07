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
	ready: function(callback) {
		this._ready = callback;
	},
	load: function(scene, el, url) {
		var self = this;
		this.el = el;
		this.url = url;
		this.scene = scene;
		CanvasEngine.getJSON(this.url, function(data) {
			self.tile_w = data.tileheight;
			self.tile_h = data.tilewidth;
			self.width = data.width;
			self.height = data.height;
			self.tilesets = data.tilesets;
			self.layers = data.layers;
			var props = self.tilesets[0].tileproperties,
				new_props = {};
			if (props) {
				for (var key in props) {
					new_props[+key+1] = props[key];
				}
				self.tilesets[0].tileproperties = new_props;
			}
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
			tileset = this.tilesets[0];
			if (this.layers[i].data) {
				for (var k=0 ; k < this.layers[i].height ; k++) {
					for (var j=0 ; j < this.layers[i].width ; j++) {
						_tile = this.scene.createElement();
						
						_id = this.layers[i].data[id];
						if (_id != 0) {
							_id--;
							y = this.tile_h * parseInt(_id / (Math.round(tileset.imagewidth / this.tile_h)));
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
	getLayerObject: function(pos) {
		if (!pos) pos = 0;
		return this.objects[pos];
	},
	getLayer: function(id) {
		return this.el_layers[id];
	},
	getMap: function(id) {
		return this.map;
	},
	getTileWidth: function() {
		return this.tile_w;
	},
	getTileHeight: function() {
		return this.tile_h;
	},
	getWidthPixel: function() {
		return this.width * this.getTileWidth();
	},
	getHeightPixel: function() {
		return this.height * this.getTileHeight();
	},
	getDataLayers: function() {
		var layer = [];
		for (var i=0 ; i < this.layers.length ; i++) {
			if (this.layers[i].data) layer.push(this.layers[i].data);
		}
		return layer;
	},
	getTileInMap: function(x, y, pos) {
		if (!pos) pos = 0;
		var tileset = this.tilesets[pos];
		var tile_pos = this.width * y + x;
		return tile_pos;
	},
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

var Tiled = {
	Tiled: {
		new: function(scene, el, url) {
			return Class.new("Tiled", [scene, el, url]);
		}
	}
};

