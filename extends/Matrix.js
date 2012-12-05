/*
Copyright (C) 2012 by WebCreative5, Samuel Ronce

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


/*
 *  This is the Point constructor. Polygon uses this object, but it is
 *  just a really simple set of x and y coordinates.
 */
function Point(px, py) {
	this.x = px;
	this.y = py;
}

/*
 *  This is the Polygon constructor. All points are center-relative.
 */
function Polygon(c, clr) {

	this.points = new Array();
	this.center = c;
	this.color = clr;  // used when drawing
	
}

/*
 *  Point x and y values should be relative to the center.
 */
Polygon.prototype.addPoint = function(p) {
	this.points.push(p);
}

/*
 *  Point x and y values should be absolute coordinates.
 */
Polygon.prototype.addAbsolutePoint = function(p) {
	this.points.push( { "x": p.x - this.center.x, "y": p.y - this.center.y } );
}

/*
 * Returns the number of sides. Equal to the number of vertices.
 */
Polygon.prototype.getNumberOfSides = function() {
	return this.points.length;
}

/*
 * rotate the polygon by a number of radians
 */
Polygon.prototype.rotate = function(rads) {
	
	for (var i = 0; i < this.points.length; i++) {
		var x = this.points[i].x;
		var y = this.points[i].y;
		this.points[i].x = Math.cos(rads) * x - Math.sin(rads) * y;
		this.points[i].y = Math.sin(rads) * x + Math.cos(rads) * y;
	}
	
}

/*
 *  This function returns true if the given point is inside the polygon,
 *  and false otherwise.
 */
Polygon.prototype.containsPoint = function(pnt) {
	
	var nvert = this.points.length;
	var testx = pnt.x;
	var testy = pnt.y;
	
	var vertx = new Array();
	for (var q = 0; q < this.points.length; q++) {
		vertx.push(this.points[q].x + this.center.x);
	}
	
	var verty = new Array();
	for (var w = 0; w < this.points.length; w++) {
		verty.push(this.points[w].y + this.center.y);
	}

	var i, j = 0;
	var c = false;
	for (i = 0, j = nvert - 1; i < nvert; j = i++) {
		if ( ((verty[i]>testy) != (verty[j]>testy)) &&
				(testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) )
			c = !c;
	}
	return c;
	
}

/*
 *  To detect intersection with another Polygon object, this
 *  function uses the Separating Axis Theorem. It returns false
 *  if there is no intersection, or an object if there is. The object
 *  contains 2 fields, overlap and axis. Moving the polygon by overlap
 *  on axis will get the polygons out of intersection.
 */
Polygon.prototype.intersectsWith = function(other) {
	
	var axis = new Point();
	var tmp, minA, maxA, minB, maxB;
	var side, i;
	var smallest = null;
	var overlap = 99999999;

	/* test polygon A's sides */
	for (side = 0; side < this.getNumberOfSides(); side++)
	{
		/* get the axis that we will project onto */
		if (side == 0)
		{
			axis.x = this.points[this.getNumberOfSides() - 1].y - this.points[0].y;
			axis.y = this.points[0].x - this.points[this.getNumberOfSides() - 1].x;
		}
		else
		{
			axis.x = this.points[side - 1].y - this.points[side].y;
			axis.y = this.points[side].x - this.points[side - 1].x;
		}

		/* normalize the axis */
		tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
		axis.x /= tmp;
		axis.y /= tmp;

		/* project polygon A onto axis to determine the min/max */
		minA = maxA = this.points[0].x * axis.x + this.points[0].y * axis.y;
		for (i = 1; i < this.getNumberOfSides(); i++)
		{
			tmp = this.points[i].x * axis.x + this.points[i].y * axis.y;
			if (tmp > maxA)
				maxA = tmp;
			else if (tmp < minA)
				minA = tmp;
		}
		/* correct for offset */
		tmp = this.center.x * axis.x + this.center.y * axis.y;
		minA += tmp;
		maxA += tmp;

		/* project polygon B onto axis to determine the min/max */
		minB = maxB = other.points[0].x * axis.x + other.points[0].y * axis.y;
		for (i = 1; i < other.getNumberOfSides(); i++)
		{
			tmp = other.points[i].x * axis.x + other.points[i].y * axis.y;
			if (tmp > maxB)
				maxB = tmp;
			else if (tmp < minB)
				minB = tmp;
		}
		/* correct for offset */
		tmp = other.center.x * axis.x + other.center.y * axis.y;
		minB += tmp;
		maxB += tmp;

		/* test if lines intersect, if not, return false */
		if (maxA < minB || minA > maxB) {
			return false;
		} else {
			var o = (maxA > minB ? maxA - minB : maxB - minA);
			if (o < overlap) {
				overlap = o;
				smallest = {x: axis.x, y: axis.y};
			}
		}
	}

	/* test polygon B's sides */
	for (side = 0; side < other.getNumberOfSides(); side++)
	{
		/* get the axis that we will project onto */
		if (side == 0)
		{
			axis.x = other.points[other.getNumberOfSides() - 1].y - other.points[0].y;
			axis.y = other.points[0].x - other.points[other.getNumberOfSides() - 1].x;
		}
		else
		{
			axis.x = other.points[side - 1].y - other.points[side].y;
			axis.y = other.points[side].x - other.points[side - 1].x;
		}

		/* normalize the axis */
		tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
		axis.x /= tmp;
		axis.y /= tmp;

		/* project polygon A onto axis to determine the min/max */
		minA = maxA = this.points[0].x * axis.x + this.points[0].y * axis.y;
		for (i = 1; i < this.getNumberOfSides(); i++)
		{
			tmp = this.points[i].x * axis.x + this.points[i].y * axis.y;
			if (tmp > maxA)
				maxA = tmp;
			else if (tmp < minA)
				minA = tmp;
		}
		/* correct for offset */
		tmp = this.center.x * axis.x + this.center.y * axis.y;
		minA += tmp;
		maxA += tmp;

		/* project polygon B onto axis to determine the min/max */
		minB = maxB = other.points[0].x * axis.x + other.points[0].y * axis.y;
		for (i = 1; i < other.getNumberOfSides(); i++)
		{
			tmp = other.points[i].x * axis.x + other.points[i].y * axis.y;
			if (tmp > maxB)
				maxB = tmp;
			else if (tmp < minB)
				minB = tmp;
		}
		/* correct for offset */
		tmp = other.center.x * axis.x + other.center.y * axis.y;
		minB += tmp;
		maxB += tmp;

		/* test if lines intersect, if not, return false */
		if (maxA < minB || minA > maxB) {
			return false;
		} else {
			var o = (maxA > minB ? maxA - minB : maxB - minA);
			if (o < overlap) {
				overlap = o;
				smallest = {x: axis.x, y: axis.y};
			}
		}
	}

	return {"overlap": overlap + 0.001, "axis": smallest};
	
}

Class.create("EntityModel", {
	x: 0,
	y: 0,
	hitState: {
		over: 0,
		out: 0
	},
	_polygon: {},
	_frame: "0",
	position: function(x, y) {
		if (x !== undefined && y !== undefined) {
			this.x = x;
			this.y = y;
			var poly = this._polygon[this._frame];
			if (poly) {
				poly.center.x = this.x;
				poly.center.y = this.y;
			}
		}
		return {
			x: this.x,
			y: this.y
		};
	},
	polygon: function(array) {
		if (array instanceof Array) {
			array = {"0": array};
		}
		for (var key in array) {
			this._polygon[key] = new Polygon({x: array[key][0][0], y: array[key][0][1] });
			for (var i=1 ; i < array[key].length ; i++) {
				this._polygon[key].addPoint({x: array[key][i][0], y: array[key][i][1]});
			}
		}
	},
	hit: function(entity_model) {
		if (this._polygon[this._frame].intersectsWith(entity_model._polygon[entity_model._frame])) {
			this.hitState.out = 0;
			this.hitState.over++;
		}
		else if (this.hitState.over > 0) {
			this.hitState.out = 1;
			this.hitState.over = 0;
		}
		else {
			this.hitState.out = 0;
			this.hitState.over = 0;
		}
		return this.hitState;
	},
	frame: function(frame) {
		if (frame) {
			this._frame = frame;
		}
		return this._frame;
	},
});

Class.create("Entity", {
	stage: null,
	params: {},
	el: null,
	mode: null,
	hit_entities: [],
	initialize: function(stage, params) {
		this.stage = stage;
		this.params = params;
		this.el = this.stage.getScene().createElement();
		this.model = Class.New("EntityModel");
		this.testHit();
	},
	position: function(x, y) {
		var pos = this.model.position(x, y);
		this.el.x = pos.x;
		this.el.y = pos.y;
	},
	move: function(x, y) {
		var pos = this.model.position();
		if (!x) x = 0;
		if (!y) y = 0;
		this.position(x + pos.x, y + pos.y);
	},
	polygon: function(array) {
		this.model.polygon(array);
	},
	rect: function(x, y, w, h) {
		if (!w && !h) {
			w = x;
			h = y;
			x = 0;
			y = 0;
		}
		if (!h) {
			h = w;
		}
		this.polygon([
			[x, y],
			[x+w, y],
			[x+w, y+h],
			[x, y+h]
		]);
		this.el.width = w;
		this.el.height = h;
	},
	onHit: function(event_name, entities, callback) {
		this.hit_entities = this.hit_entities.concat(entities);
		this.el.on("entity:hit:" + event_name, callback);
		/*for (var i=0 ; i < this.hit_entities.length ; i++) {
			this.hit_entities[i].hit(event_name, this, callback);
		}
		*/
	},
	testHit: function() {
		var self = this;
		this.el.attr("entity:testHit", function() {
			self.hit(self.hit_entities);
		});
	},
	testAnimHit: function() {
		var self = this;
		this.el.on("animation:draw", function(frame) {
			
		});
	},
	hit: function(entities, callback) {
		var state, self = this;
		
		function _call(e) {
			if (callback) callback.call(self, e, self.el);
			self.el.trigger("entity:hit:" + e, [self.el]);
		}
		
		for (var i=0 ; i < entities.length ; i++) {
			state = this.model.hit(entities[i].model);
			if (state.over == 1) {
				_call("over");
			}
			else if (state.out == 1) {
				_call("out");
			}
		}
	}
});

var Grid, _prototype = {
	_rows: 0,
	_cols: 0,
	cell: {
		width: 0,
		height: 0
	},
	_matrix: null,
	initialize: function(rows, cols) {
		if (rows instanceof Array) {
			this._matrix = rows;
			cols = row[0].length;
			rows = rows.length;
		}
		this._rows = rows;
		this._cols = cols;
	},
	setCellSize: function(w, h) {
		this.cell.width = w;
		this.cell.height = h;
	},
	getRows: function() {
		return this._rows;
	},
	getCols: function() {
		return this._cols;
	}
},
_return =  function(CE) {
	return {
		"new": function(rows, cols) {
			return CE.Class["new"]("Grid", [rows, cols]);
		}
	};
};

var Hit, _prototype_hit = {
	initialize: function() {
		
	}
},
_return_hit =  function(CE) {
	return {
		"new": function(rows, cols) {
			return CE.Class["new"]("Hit");
		}
	};
};

if (typeof(exports) !== "undefined") {
	exports.Grid = function(CE) {
		CE.Class.create("Grid", _prototype);
		CE.Class.create("Hit", _prototype_hit);
		return _return(CE);
	};
}
else {
	CE.Class.create("Grid", _prototype);
	CE.Class.create("Hit", _prototype_hit);
	Grid = {
		Grid: _return(CE),
		Hit: _return_hit(CE)
	};
}

 