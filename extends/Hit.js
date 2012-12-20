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
	http://www.amphibian.com/blogstuff/collision.html
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
function Polygon(c) {
	this.points = new Array();
	this.center = c;
	
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
	getPoints: function(frame) {
		frame = frame || this._frame;
		return this._polygon[frame].points;
	},
	getPolygonReg: function(frame) {
		frame = frame || this._frame;
		return this._polygon[frame].center;
	},
	frame: function(frame) {
		if (frame) {
			this._frame = frame;
		}
		return this._frame;
	},
});

/**
	@doc hit
	@class Entity Create an entity. An entity is an abstract element. It allows to define its position, its hitbox without display on the screen. This class is linked to a model for the calculation of positions and an element (`el` property) to display
	@param {CanvasEngine.Element} stage Stage element
	@example

In `ready` method
	
     this.entity = Class.New("Entity", [stage]);
     this.entity.rect(100);
     this.entity.position(10, 10);
     this.entity.el.fillStyle = "red";
     this.entity.el.fillRect(0, 0, 100, 100);
	 stage.append(this.entity.el);
	 
In `render` method

     this.entity.move(5, null);
	 this.entity.hit("over", [this.other_entity], function(el) {  // other_entity is another instance of the Entity class
		el.opacity = .5;
	});
*/
Class.create("Entity", {
	stage: null,
	params: {},
	el: null,
	mode: null,
	hit_entities: [],
	initialize: function(stage, params, model) {
		
		if (model === undefined) model = true;
		
		this.stage = stage;
		this.params = params;
		this.el = this.stage.getScene().createElement();
		if (model){
			this.setModel(Class.New("EntityModel"));
		}
		this.testHit();
	},
	
	setModel: function(_class) {
		this.model = _class;
	},
/**
	@doc hit/
	@method position Change the position of the entity and the element. Returns object {x: , y: }
	@param {Integer} x Position X
	@param {Integer} y Position Y
	@return {Object}
	@example

In `ready` method
	
     var entity = Class.New("Entity", [stage]);
     entity.position(10, 50);

*/
	position: function(x, y) {
		var pos = this.model.position(x, y);
		if (x !== undefined) {
			this.el.x = pos.x;
			this.el.y = pos.y;
		}
		return {x: pos.y,  y: pos.y};
	},
	
/**
	@doc hit/
	@method move Move the position of the entity and the element. Returns object {x: , y: }
	@param {Integer} x Add position X
	@param {Integer} y (optional) add position Y
	@return {Object}
	@example

In `ready` method
	
     var entity = Class.New("Entity", [stage]);
     entity.move(10, null); // Current position X + 10
     entity.move(null, 10); // Current position Y + 10

*/	
	move: function(x, y) {
		var pos = this.model.position();
		if (!x) x = 0;
		if (!y) y = 0;
		return this.position(x + pos.x, y + pos.y);
	},
	

	
/**
	@doc hit/
	@method polygon Polygons define the entity
	@param {Array} array The array contains two tables including the positions of point polygons. The order of elements define the shape of polygons.
	@example

In `ready` method
	
     var entity = Class.New("Entity", [stage]);
     entity.polygon([
		[0, 0],
		[50, 40],
		[0, 40]
	 ]);

*/	
	polygon: function(array) {
		this.model.polygon(array);
	},
	
/**
	@doc hit/
	@method rect Define the polygon as a rectangle. The element will take up his new dimensions (`width` and `height` properties). If `x` and `y` are undefined, they will default 0. If only one parameter is defined, the shape is a square with the given width
	@param {Integer} x Position X
	@param {Integer} y (optional) Position Y
	@param {Integer} w (optional) Width
	@param {Integer} h (optional) Height
	@example

In `ready` method
	
     var entity = Class.New("Entity", [stage]);
     entity.rect(0, 0, 100, 100);
	 // entity.rect(100, 100); 	=> equivalent
	 // entity.rect(100); 		=> equivalent
	 
Other example

	 var entity = Class.New("Entity", [stage]);
     entity.rect(100, 300);
	 // entity.rect(0, 0, 100, 300); => equivalent
*/	
	rect: function(x, y, w, h) {
		this.model.rect(x, y, w, h);
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
/**
	@doc hit/
	@method hit Calls the function when two or more entities come into colision
	@param {Array} entities Array containing elements of type `Entity`
	@param {Function} callback (optional) Callback function when the collision occurs
	@example

In `ready` method
	
     this.entity1 = Class.New("Entity", [stage]);
	 this.entity2 = Class.New("Entity", [stage]);
     this.entity1.rect(100);
     this.entity2.rect(100);
	 
In `render` method

	 this.entity1.hit([this.entity2], function(el) {
		el.opacity = 0.5;
	 });
*/	
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

var Matrix = {

	/*isometric: function() {
		[a, b, c, d, e, f]
		[scaleX, skewX, skewY, scaleY, translateX, translateY]
	},
	*/
};

/**
	@doc grid
	@class Grid reate a virtual grid and the location of an entity in the grid and properties of a cell
	@param {Integer} rows Number of rows
	@param {Integer} cols Number of columns
	@example

In `ready` method

	var entity = Class.New("Entity", [stage]),
		pos = entity.position(),
		grid = Class.New("Grid", [10, 5]);
		
	grid.setCellSize(32, 32);
		
    console.log(grid.getCellByPos(pos.x, pos.y)); // {col: 0, row: 0}
*/
var Grid, _prototype = {
	_rows: 0,
	_cols: 0,
	cell: {
		width: 0,
		height: 0,
		prop: [],
	},
	_matrix: null,
	_transform: null,
	_func: null,
	initialize: function(rows, cols) {
		if (rows instanceof Array) {
			this._matrix = rows;
			cols = row[0].length;
			rows = rows.length;
		}
		this._rows = rows;
		this._cols = cols;
	},

	// TODO
	transform: function(func) {
		this._func = func;
	},
	
	// TODO
	convert: function(x, y) {
		if (!this._func) {
			return {x: x, y: y};
		}
		return this._func.call(this, x, y);
	},
	
/**
	@doc grid/
	@method setPropertyCell Assign properties to the cells (two-dimensional arrays)
	1. Abscissa
	2. 0rdered
	@param {Array} prop Two-dimensional arrays. The second array contains a value (integer, object, etc.)
	@example
	
In `ready` method

	var grid = Class.New("Grid", [2, 2]);
	grid.setPropertyCell(
		[
			[0, 0], 
			[1, 0]
		]
	);
*/	
	setPropertyCell: function(prop) {
		this.cell.prop = prop;
	},
	
/**
	@doc grid/
	@method getPropertyByCell Gets the properties of a cell
	@param {Integer} col Column
	@param {Integer} row Row
	@return {Object}
	@example
	
In `ready` method

	var grid = Class.New("Grid", [2, 2]);
	grid.setPropertyCell(
		[
			[0, 0], 
			[1, 0]
		]
	);
	grid.getPropertyByCell(1, 0); // return 1
*/	
	getPropertyByCell: function(col, row) {
		if (!this.cell.prop[col]) {
			throw "Column " + col + " does not exist";
		}
		return this.cell.prop[col][row];
	},

/**
	@doc grid/
	@method getPropertyByPos Obtain the properties of a cell according to positions
	@param {Integer} x Position X
	@param {Integer} y Position Y
	@return {Object}
	@example
	
In `ready` method

	var grid = Class.New("Grid", [2, 2]);
	grid.setPropertyCell(
		[
			[0, 0], 
			[1, 0]
		]
	);
	grid.setCellSize(32, 32);
	grid.getPropertyByPos(53, 24); // return 1
*/		
	getPropertyByPos: function(x, y) {
		var cell = this.getCellByPos(x, y);
		return this.getPropertyByCell(cell.col, cell.row);
	},
	
	getEntityCells: function(entity) {
		var i, j, p, points, reg, px, py, 
			cells = [],
			ep = { // extreme points
				min_x: 99999999,
				max_x: 0,
				min_y: 99999999,
				max_y: 0
			};
		if (entity.model) {
			points = entity.model.getPoints();
			reg = entity.model.getPolygonReg();
		}
		else {
			points = entity.getPoints();
			reg = entity.getPolygonReg();
		}
		for (i=0 ; i < points.length ; i++) {
			p = points[i];
			px = p.x + reg.x;
			py = p.y + reg.y;
			if (px < ep.min_x) {
				ep.min_x = px;
			}
			if (px > ep.max_x) {
				ep.max_x = px;
			}
			if (py < ep.min_y) {
				ep.min_y = py;
			}
			if (py > ep.max_y) {
				ep.max_y = py;
			}
		}
		
		var nbrows = (ep.max_x - ep.min_x) / this.cell.width, 
			nbcols = (ep.max_y - ep.min_y) / this.cell.height,
			x, y;
		for (i=0 ; i <= nbcols ; i++) {
			x = ep.min_x + this.cell.width * i;
			for (j=0 ; j <= nbrows ; j++) {
				y = ep.min_y + this.cell.height * j;
				cells.push(this.getCellByPos(x, y));
			}
		}
		return cells;
	},
	
/**
	@doc grid/
	@method getCellByPos Retrieve the column and row in the grid according to the positions. Returns this object : {col: , row: }
	@param {Integer} x Position X
	@param {Integer} y Position Y
	@return {Object}
	@example
	
In `ready` method

	var grid = Class.New("Grid", [2, 2]);
	grid.setCellSize(32, 32);
	grid.getCellByPos(53, 35); // return {col: 1, row: 1}
*/	
	getCellByPos: function(x, y) {
		if (this.cell.width == 0 || this.cell.height == 0) {
			throw "Set the size of the cell prior with setCellSize method";
		}
		var col = Math.floor(this.convert(x, y).x / this.cell.width),
			row = Math.floor(this.convert(x, y).y / this.cell.height);
		return {col: col, row: row};
	},
	
/**
	@doc grid/
	@method setCellSize Set the size of a cell
	@param {Integer} w Width (pixels)
	@param {Integer} h Height (pixels)
*/	
	setCellSize: function(w, h) {
		this.cell.width = w;
		this.cell.height = h;
	},

/**
	@doc grid/
	@method getRows Get the number of rows
	@return {Integer}
*/	
	getRows: function() {
		return this._rows;
	},

/**
	@doc grid/
	@method getCols Get the number of columns
	@return {Integer}
*/	
	getCols: function() {
		return this._cols;
	},

/**
	@doc grid/
	@method getNbCell Get the total number of cell (rows * columns)
	@return {Integer}
*/	
	getNbCell: function() {
		return this.getRows() * this.getCols();
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

 