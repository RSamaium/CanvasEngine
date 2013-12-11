/*
Copyright (C) 2013 by Samuel Ronce

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

CanvasEngine._presets = {};

Class.create("Preset", {

	name: "",
	preset: {},

	initialize: function(name, preset) {
		return this.set(name, preset);
 	},

 	set: function(name, preset) {
 		this.name = name;
		this.preset = preset;
		CanvasEngine._presets[name] = preset;
		return this;
 	}

});

Class.create("UI", {

	scene: null,

	_getScene: function() {
		if (!this.scene) {
			var scenes = Global_CE.Scene.getEnabled();
			for (var name in scenes) {
			    this.scene = scenes[name];
			    break;
			}
		}
		return this.scene;
	},

	_getParams: function(params) {
		if (typeof params == "string") {
			return CanvasEngine._presets[params];
		}
		else if (params instanceof Class && params.__name__ == "Preset") {
			return params.preset;
		}
		return params;
	},

	setGraphic: function(els, graphic) {

		var f;

		for (var key in graphic) {
			for (var el_name in els) {
				if (els["@" + el_name]) {

				}
				els[el_name][key];
			}
		}
	},

	progressBar: function(id, pourcent, graphic) {
		
		this._getScene();

		graphic = CanvasEngine.extend(graphic, {
			"width": 100,
			"height": 50,
			"@empty": {
				"fillStyle": 		"black",
				"fillRect": 		""
			},
			"@full": {
				"fillStyle": 		"red"
			}
		});

		var bar = this.scene.createElement(["full", "empty"]);

		bar.empty.append(bar.full);

		return bar.full;
	},

	dialog: function() {

	},
	
	button: function(text, params) {

		this._getScene();

		if (typeof text != "string") {
			params = text;
			text = false;
		}

		params = this._getParams(params);

		params = CanvasEngine.extend({
			img_order: ["default", "hover", "click", "disabled"]
		}, params);

		var scene = this.scene,
			_canvas = scene.getCanvas(),
			btn = scene.createElement();

		var img = Global_CE.Materials.get(params.img);

		btn.width = img.width / params.img_order.length;
		btn.height = img.height;

		if (text) {
			params.text = CanvasEngine.extend({
				font: '20px Arial',
				color: 'white'
			}, params.text);

			var el = scene.createElement(btn.width,  btn.height);
	        el.font = params.text.font;
	        el.fillStyle = params.text.color;
	        el.fillText(text, "middle");
	        btn.append(el);
	    }

		function _draw(type) {
			if (!type) type = "default";
			var pos = CanvasEngine.inArray(type, params.img_order);
			if (pos == -1) pos = 0;
			btn.drawImage(img, pos *  btn.width, 0, btn.width, btn.height, 0, 0, btn.width, btn.height);
		}

		function _isDisabled() {
			return btn.attr("disabled");
		}

		btn.on("click", function(e) {
			if (params.click) params.click.call(this, e);
		});
		
		btn.on("mouseover", function(e) {
			if (!_isDisabled()) {
				_draw("hover");
				if (params.hover) params.hover.call(this, e);
			}	 
		});

		btn.on("mousedown", function(e) {
			if (!_isDisabled()) {
				 _draw("click");
			}
		});

		btn.on("mouseup", function(e) {
			if (!_isDisabled()) {
				 _draw();
			}
		});
		
		btn.on("mouseout", function(e) {
			if (!_isDisabled()) {
				_draw();
			}
		});

		btn.on("element:attrChange", function(name, value) {
			if (name == "disabled") {
				if (value) _draw("disabled");
				else _draw();
			}
		});

		_draw();
		
		return btn;
	},
	
	tooltip: function(params) {
	
		this._getScene();

		params = this._getParams(params);

		params = CanvasEngine.extend({
			position: "bottom",
			gap: "middle",
			width: 100,
			height: 80,
			radius: 5,
			type: "stroke",
			color: "black",
			arrow: {}
		}, params);

		params.arrow = CanvasEngine.extend({
			base: 10,
			height: 10,
			skew: 0
		}, params.arrow);

		var scene = this.scene,
			_canvas = scene.getCanvas(),
			el = scene.createElement(),
			w = params.width,
			h = params.height, 
			radius = params.radius;

		el.width = w;
		el.height = h;

		if (params.gap == "middle") {
			if (params.position == "left" || params.position == "right") {
				params.gap = params.height / 2;
			}
			else {
				params.gap = params.width / 2;
			}
			params.gap -= params.arrow.base / 2;
		}

		  el.beginPath();

		  el[params.type + "Style"] = params.color;
		  
		  el.moveTo(radius, 0);

		  if (params.position == "top") {
		  	 el.lineTo(params.gap, 0);
		 	 el.lineTo(params.arrow.base / 2 + params.gap + params.arrow.skew, -params.arrow.height);
		  	 el.lineTo(params.arrow.base + params.gap, 0);
		  }
		 
		  el.lineTo(w - radius, 0); 
		  el.quadraticCurveTo(w, 0, w, radius);

		  if (params.position == "right") {
		  	 el.lineTo(w, params.gap);
		 	 el.lineTo(w + params.arrow.height, params.gap + params.arrow.skew + params.arrow.base / 2);
		  	 el.lineTo(w, params.gap + params.arrow.base);
		  }

		  el.lineTo(w, h-radius);
		  el.quadraticCurveTo(w, h, w-radius, h);

		  if (params.position == "bottom") {
		  	 el.lineTo(w-(w-params.gap) + radius / 2, h);
		 	 el.lineTo(w-(w-params.gap) + radius / 2 - params.arrow.base / 2 + params.arrow.skew, h+params.arrow.height);
		  	 el.lineTo(w-(w-params.gap) + radius / 2 - params.arrow.base, h);
		  }

		  el.lineTo(radius, h);
		  el.quadraticCurveTo(0, h, 0, h-radius);

		  if (params.position == "left") {
		  	 el.lineTo(0, h-(h-params.gap) + radius / 2);
		 	 el.lineTo(-params.arrow.height, h-(h-params.gap) + radius / 2 - params.arrow.base / 2 + params.arrow.skew);
		  	 el.lineTo(0, h-(h-params.gap) + radius / 2 - params.arrow.base);
		  }

		  el.lineTo(0, radius);
		  el.quadraticCurveTo(0, 0, radius, 0);

		  el[params.type]();
	
		return el;
	}
	
	
	
});
var UI = {
	UI: Class.New("UI")
};

 