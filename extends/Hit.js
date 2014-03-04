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


if (typeof exports != "undefined") {
	var CE = require("canvasengine").listen(),
		CanvasEngine = false,
		PF = require('pathfinding'),
		Class = CE.Class;
}

/*
	http://www.amphibian.com/blogstuff/collision.html
*/


/*
 *  This is the Point constructor. Polygon uses this object, but it is
 *  just a really simple set of x and y coordinates.
 */
 Class.create("Point", {
	
	initialize: function(px, py) {
		this.x = px;
		this.y = py;
	}
 
 });
 
  
 
/*
 *  This is the Polygon constructor. All points are center-relative.
 */
 Class.create("Polygon", {
 
	initialize: function(c) {
		this.points = [];
		this.center = c;
	},
	
	/*
	 *  Point x and y values should be relative to the center.
	 */
	addPoint: function(p) {
		this.points.push(p);
	},

	/*
	 *  Point x and y values should be absolute coordinates.
	 */
	addAbsolutePoint: function(p) {
		this.points.push( { "x": p.x - this.center.x, "y": p.y - this.center.y } );
	},

/*
 * Returns the number of sides. Equal to the number of vertices.
 */
	getNumberOfSides: function() {
		return this.points.length;
	},

	/*
	 * rotate the polygon by a number of radians
	 */
	rotate: function(rads) {
		
		for (var i = 0; i < this.points.length; i++) {
			var x = this.points[i].x;
			var y = this.points[i].y;
			this.points[i].x = Math.cos(rads) * x - Math.sin(rads) * y;
			this.points[i].y = Math.sin(rads) * x + Math.cos(rads) * y;
		}
		
	},

	/*
	 *  This function returns true if the given point is inside the polygon,
	 *  and false otherwise.
	 */
	containsPoint: function(pnt) {
		
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
		
	},

	/*
	 *  To detect intersection with another Polygon object, this
	 *  function uses the Separating Axis Theorem. It returns false
	 *  if there is no intersection, or an object if there is. The object
	 *  contains 2 fields, overlap and axis. Moving the polygon by overlap
	 *  on axis will get the polygons out of intersection.
	 */
	intersectsWith: function(other) {
		
		var axis = Class.New("Point");
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
		
		function offset(poly, pt) {
			return {
				x: pt.x + poly.center.x,
				y: pt.y + poly.center.y
			};
		}
		
	
		var a1, a2, coincident_result = [], lines = [], k=0;
		
		function testInteraction(type, a1, a2) {
			var j, b1, b2, result, coincident = [];
			
			for (j = 0; j < other.getNumberOfSides(); j++) {
				b1 = offset(other, other.points[j]);
				b2 = offset(other, other.points[j+1] ? other.points[j+1] : other.points[0]);
				result = Polygon.intersectLineLine(a1, a2, b1, b2);
				if (result == "Coincident") {
					coincident.push({
						sides: j
					});
				}
				
				lines[k].push(result);
			}

			k++;
			return coincident;
		}
		
	
		for (i = 0; i < this.getNumberOfSides(); i++) {
			lines[k] = [];
			a1 = offset(this, this.points[i]);
			a2 = offset(this, this.points[i+1] ? this.points[i+1] : this.points[0]);
			coincident_result.push(testInteraction(null, a1, a2));
		}
		return {
			overlap: overlap + 0.001, 
			axis: smallest, 
			lines: lines, 
			coincident: coincident_result
		};

	}

});

var Polygon = {};
 
Polygon.intersectLineLine = function(a1, a2, b1, b2) {

var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

if ( u_b != 0 ) {
	var ua = ua_t / u_b;
	var ub = ub_t / u_b;

	if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
		return {
			x: a1.x + ua * (a2.x - a1.x),
			y: a1.y + ua * (a2.y - a1.y)
		};
	} else {
	   return false;
	}
} else {
	if ( ua_t == 0 || ub_t == 0 ) {
	   return "Coincident";
	} else {
	   return "Parallel";
	}
}
};
 



/**
@doc entity
@class EntityModel Model entities. Inherit a class to assign a polygon and positions your class
@example

	Class.create("Character", {

		initialize: function() {
		
		},
		
		passable: function(x, y, other_entity) {
			var state;
		
			this.savePosition(); // save positions
			this.position(x, y); // test new positions
			state = this.hit(other_entity); // test collision for new positions
			
			if (state.over >= 1) { 
				this.restorePosition(); // If collision, restores the initial positions
				return false;
			}
			
			return true;
		}

	}).extend("EntityModel");
	
*/
Class.create("EntityModel", {
/**
	@doc entity/
	@property x Position X
	@type Integer
	@default 0
*/
	x: 0,
/**
	@doc entity/
	@property y Position Y
	@type Integer
	@default 0
*/
	y: 0,
	_memorize: {
		x: 0,
		y:0
	},
	hitState: {
		over: 0,
		out: 0
	},
	_polygon: {},
	_frame: "0",
/**
	@doc entity/
	@method position Change the position of the entity and the element. Returns object {x: , y: }
	@param {Integer} x Position X
	@param {Integer} y Position Y
	@return {Object}
*/
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
/**
	@doc entity/
	@method savePosition Saves the current positions
*/
	savePosition: function() {
		this._memorize.x = this.x;
		this._memorize.y = this.y;
	},
	
/**
	@doc entity/
	@method restorePosition Restores the current positions
*/
	restorePosition: function() {
		this.x = this._memorize.x;
		this.y = this._memorize.y;
	},
/**
	@doc entity/
	@method polygon Polygons define the entity
	@param {Array} array The array contains two tables including the positions of point polygons. The order of elements define the shape of polygons.
	@example
	
View Hit class
*/
	polygon: function(array) {
		if (array instanceof Array) {
			array = {"0": array};
		}
		for (var key in array) {
			this._polygon[key] = Class.New("Polygon", [{x: array[key][0][0], y: array[key][0][1] }]);
			for (var i=0 ; i < array[key].length ; i++) {
				this._polygon[key].addPoint({x: array[key][i][0], y: array[key][i][1]});
			}
			
		}
	},
	
/**
	@doc entity/
	@method rect Define the polygon as a rectangle. The element will take up his new dimensions (`width` and `height` properties). If `x` and `y` are undefined, they will default 0. If only one parameter is defined, the shape is a square with the given width
	@param {Integer} x Position X
	@param {Integer} y (optional) Position Y
	@param {Integer} w (optional) Width
	@param {Integer} h (optional) Height
	@example
	
View Hit class
*/
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
	
/**
@doc entity/
@method hit Calls the function when two or more entities come into colision. Return this object :

	{
		over:
		out:
		result: {
			coincident: []
			lines: []
		}
	}
	
* over : The number of times that the entity hit the other entity
* out : it is 1 if the entity does not affect other entity
* result
  * coincident : Array containing the lines coinciding with the lines of the other entity. 0 corresponds to the first line from the first point of the polygon.
  * lines : Values in each line with other lines. Example
  
	[
		false,
		false, 
		{x: 32, y: 32},
		"Coincident"
	]
	
Here, it is testing the first line of the polygon entity A. We test the line with 4 sides polygon entity B :

1. The first line of entity A does not intersect with the first line of entity B
2. The first line of entity A does not intersect with the second line of entity B
3. The first line of Entity A has an intersection at positions (32,32) with the third line entity B
4. The first line of entity A coincides with the fourth line entity B

> In this example, `coincident` object is :

	coincident: [3]
	
The number of lines is equal to the order (n) of the polygon - 1.

@param {EntityModel} entity_model Other entity
@return {Object}
*/	
	hit: function(entity_model) {
		var result = this._polygon[this._frame].intersectsWith(entity_model._polygon[entity_model._frame]);
		this.hitState.result = result;
		if (result) {
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
/**
	@doc entity/
	@method getPoints Retrieves points of the polygon. Returns an array of objects :
	
	[
		{x: , y: },
		{x: , y: },
		{x: , y: }
		...
	]
	
	@params {Integer} frame (optional) Get a polygon frame precise (for animations). If nothing is specified, the current frame is the entity
	@return {Array}
*/	
	getPoints: function(frame) {
		frame = frame || this._frame;
		return this._polygon[frame].points;
	},
	
/**
	@doc entity/
	@method getPolygonReg Find the origin point of the polygon. Returns an object :
	
	{x: , y: }
	
	@params {Integer} frame (optional) Get a polygon frame precise (for animations). If nothing is specified, the current frame is the entity
	@return {Object}
*/	
	getPolygonReg: function(frame) {
		frame = frame || this._frame;
		return this._polygon[frame].center;
	},
	
/**
	@doc entity/
	@method getPolygon Retrieves the polygon
	@params {Integer} frame (optional) Get a polygon frame precise (for animations). If nothing is specified, the current frame is the entity
	@return {Polygon}
*/	
	getPolygon: function(frame) {
		frame = frame || this._frame;
		return this._polygon[frame];
	},
	
/**
	@doc entity/
	@method frame Sets or retrieves a frame
	@params {Integer} frame (optional) An entity may be composed of several different polygons (eg for an animation). Each frame corresponds to a polygon. Change frame by assigning an integer. Notice that the first frame is 0
	@return {Integer}
*/	
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
	position: function(x, y, move) {
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
		return this.position(x + pos.x, y + pos.y, true);
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
Class.create("Grid", {
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
			this.cell.prop = rows;
			cols = rows[0].length;
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
		if (typeof(PF) != "undefined") {
			this._pf_grid = false;
			this._pf_prop = (CanvasEngine || CE.Core).rotateMatrix(prop);
		}	
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
	
Returns `undefined` if column or row doesn't exist
*/	
	getPropertyByCell: function(col, row) {
		if (!this.cell.prop[col]) {
			return undefined;
		}
		return this.cell.prop[col][row];
	},

/**
	@doc grid/
	@method setPropertyByCell `(>= 1.3.0)` Change a value in a cell
	@param {Integer} col Column
	@param {Integer} row Row
	@param {Object} prop Value
	@return {Class.Hit}
	@example
	
In `ready` method

	var grid = Class.New("Grid", [2, 2]);
	grid.setPropertyCell(
		[
			[0, 0], 
			[1, 0]
		]
	);
	grid.setPropertyByCell(1, 0, 0); // grid is [[0, 0], [0, 0]] now
	
Returns `undefined` if column or row doesn't exist
*/	
	setPropertyByCell: function(col, row, prop) {
		if (!this.cell.prop[col]) {
			return undefined;
		}
		this.cell.prop[col][row] = prop;
		if (typeof(PF) != "undefined") {
			this._pf_grid = false;
			this._pf_prop = (CanvasEngine || CE.Core).rotateMatrix(this.cell.prop);
		}	
		return this;
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
	

/**
	@doc grid/
	@method testCell Test cell lines which coincide with the lines of the polygons of the entity
	
	[
		[
			{
				points: {
					x: 5, y: 5
				},
				sides: 2
			}
		],
		
	]
	
`sides` sends lines of polygons of the entity which coincide with the grid lines. 0 corresponds to the first line from the first point of the polygon. The number of lines is equal to the order (n) of the polygon - 1.
	
	@param {Object} cell The cell defined by the object {col: Integer, row: Integer}
	@param {Entity|EntityModel} entity
	@return {Array}
	@example
	
In `ready` method

	var entity = Class.New("Entity", [stage]), pos;
	entity.rect(10);
	pos = entity.position();

	var grid = Class.New("Grid", [2, 2]);
	
	grid.setCellSize(32, 32);
	
	grid.testCell({
		col: 0,
		row: 0
	}, entity)
	
	// => returns 
	/*
	[
		[
			{
				points: {
					x: 0, y: 0
				},
				sides: 0
			}
		],
		[],
		[],
		[	
			{
				points: {
					x: 0, y: 0
				},
				sides: 3
			}
		]
	]
*/	
	testCell: function(cell, entity, params) {
		params = params || {};
		
		if (!entity.getPolygon) {
			entity = entity.model;
		}
	
		var result = [],
			poly = entity.getPolygon(),
			self = this;
	
		function offset(poly, pt) {
			return {
				x: pt.x + poly.center.x,
				y: pt.y + poly.center.y
			};
		}
		
		function testInteraction(type, a1, a2, poly) {
			var j, b1, b2, lines = [], k=0, result, coincident = [], coincident_points = null, obj = {};
			
			for (j = 0; j < poly.getNumberOfSides(); j++) {
				b1 = offset(poly, poly.points[j]);
				b2 = offset(poly, poly.points[j+1] ? poly.points[j+1] : poly.points[0]);
				result = Polygon.intersectLineLine(a1, a2, b1, b2);
				
				if (result == "Coincident") {

					if (a1.x == b1.x && a1.y == b1.y) {
						coincident_points = {
							x: a1.x,
							y: a1.y
						};
					}
					else if (a2.x == b2.x && a2.y == b2.y) {
						coincident_points = {
							x: a2.x,
							y: a2.y
						};
					}
					else if (a1.x == b2.x && a1.y == b2.y) {
						coincident_points = {
							x: a1.x,
							y: a1.y
						};
					}
					else if (a2.x == b1.x && a2.y == b1.y) {
						coincident_points = {
							x: a2.x,
							y: a2.y
						};
					}
					coincident.push({
						sides: j,
						points: coincident_points
					});
				}
			}
			if (true /*params.ignoreTypeLine */) {
				return coincident;
			}
			else {
				obj[type] = coincident;
				return obj;
			}
			
			
		}
		
		function real(cell) {
			return {
				x: cell.x * self.cell.width,
				y: cell.y * self.cell.height 
			};
		}
		
		if (!cell.getPolygon) {
			entity = entity.model;
		}
		
		var points_cell = [
			{y: cell.row, x: cell.col},
			{y: cell.row, x: cell.col+1},
			{y: cell.row+1, x: cell.col+1},
			{y: cell.row+1, x: cell.col}
		];
		
		
		var a1, a2;
		for (j = 0; j < points_cell.length; j++) {
			a1 = real(points_cell[j]);
			a2 = real(points_cell[j+1] ? points_cell[j+1] : points_cell[0]);
			result.push(testInteraction(null, a1, a2, poly));
		}

		return result;
	
	},

/**
	@doc grid/
	@method getEntityCells Obtain the cells where the entity. Return this object (example) :
	
	{
		cells: [{
			col: 1,
			row: 1
		}]
	}	
	
	@param {Entity|EntityModel} entity
	@return {Object}
	@example
	
In `ready` method

	var entity = Class.New("Entity", [stage]),
		pos = entity.position();

	var grid = Class.New("Grid", [2, 2]);
	
	grid.setCellSize(32, 32);
	
	grid.getEntityCells(entity); 
	
	// => returns 
	/*
	{
		cells: [{
			col: 0,
			row: 0
		}]
	}	
*/	
	
	getEntityCells: function(entity, params) {
		var i, j, p, points, reg, poly, px, py, 
			_cells = [],
			ep = { // extreme points
				min_x: 99999999,
				max_x: 0,
				min_y: 99999999,
				max_y: 0
			};
			
		params = params || {};
			
		if (entity.model) {
			points = entity.model.getPoints();
			reg = entity.model.getPolygonReg();
			poly = entity.model.getPolygon();
		}
		else {
			points = entity.getPoints();
			reg = entity.getPolygonReg();
			poly = entity.getPolygon();
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
		
		var cell = [
			this.getCellByPos(ep.min_x, ep.min_y),
			this.getCellByPos(ep.max_x, ep.min_y),
			this.getCellByPos(ep.max_x, ep.max_y),
			this.getCellByPos(ep.min_x, ep.max_y)
		];
		
		var nbrows = cell[2].row - cell[0].row,
			nbcols = cell[1].col - cell[0].col;
		for (i=0 ; i < nbcols-1 ; i++) {
			for (j=0 ; j < nbrows-1 ; j++) {
				cell.push({row: cell[0].row + j, col: cell[0].col + i});
			}
		}
		
		return {
			cells: cell
		};
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
	},
	
	
/**
@doc grid/
@method passableCell `(>= 1.3.0`) Test tiles passable in an area. The array must contain only the value 0 or 1. Useful to know the movement of an entity as a part in a game of chess

- 0 : passable
- 1 : not passable

Returns the columns and rows in grid passable

@param {Integer} row Start position (row)
@param {Integer} col Start position (col)
@param {Integer} distance Maximum search distance (number of tiles)
@param {Array} array_exception (optional) Two-dimensional array with the positions not to test : `[[x0, y0], [x1, y1], ...]`
@return {Array}
@example

In `ready` method

	var matrix = [
		[0, 0, 0, 1, 0],
		[1, 0, 0, 0, 1],
		[0, 0, 1, 0, 0],
	];

	var grid = Class.New("Grid", [matrix]);
	grid.passableCell(0, 0, 2);

	// returns : [[0, 1], [0, 2], [1, 1], [0, 0]]

*/	
	passableCell: function(x, y, max, array_exception) {
	
		array_exception = array_exception || [];
	
		var H_MAP = this._cols;
		var W_MAP = this._rows;
		
		var mapData = this.cell.prop;

		var tab_move_passable = [];
		
		function init_tab_move() {
			for (var i = 0 ; i < H_MAP * 2 + 1 ; i++) {
				tab_move_passable[i] = [];
				for (var j = 0 ; j < H_MAP * 2 + 1 ; j++) {
					tab_move_passable[i][j] = -1;
				}
			}
			var middle = Math.floor(tab_move_passable.length / 2);
			tab_move_passable[middle][middle] = 0;
		}
	
		var pos_temporaire = [];
		var pos_semi_tempor = [[x, y]];
		var path = 0;
		var diff_x = pos_semi_tempor[0][0] - H_MAP;
		var diff_y = pos_semi_tempor[0][1] - H_MAP;
		var tab_move = [];
		var id = 0;
		init_tab_move();
		
		function inArray(x, y) {
			
			for (var j = 0 ; j < array_exception.length ; j++) {
				if (array_exception[j][0] == x && array_exception[j][1] == y) {
					return true;
				}
			}
			return false;
		}
			
		while (!pos_semi_tempor.length == 0 && path < max) {
			pos_temporaire = [];
			for (var i = 0 ; i < pos_semi_tempor.length ; i++) {
				var new_pos_x = pos_semi_tempor[i][0];
				var new_pos_y = pos_semi_tempor[i][1];
				var tab_x = new_pos_x;
				var tab_y = new_pos_y;
				
				for (var j = 0 ; j < 4 ; j++) {
					switch (j) {
						case 0: 	

							if (mapData[new_pos_x][new_pos_y  + 1] != undefined && mapData[new_pos_x][new_pos_y  + 1] == id && !inArray(new_pos_x, new_pos_y  + 1) && tab_move_passable[tab_x][tab_y + 1] == -1) {
								  pos_temporaire.push([new_pos_x,new_pos_y + 1]);
								  tab_move.push([new_pos_x,new_pos_y + 1]);
								  tab_move_passable[tab_x][tab_y + 1] = 0;
							}
						break;
						case 1: 
							
							if (mapData[new_pos_x + 1]  != undefined && mapData[new_pos_x + 1][new_pos_y]  != undefined && mapData[new_pos_x + 1][new_pos_y] == id && !inArray(new_pos_x + 1, new_pos_y) && tab_move_passable[tab_x + 1][tab_y] == -1) {
								  pos_temporaire.push([new_pos_x + 1,new_pos_y]);
								  tab_move.push([new_pos_x + 1,new_pos_y]);
								  tab_move_passable[tab_x + 1][tab_y] = 0;
							}
							
						break;
						case 2: 		
							if (mapData[new_pos_x][new_pos_y - 1]  != undefined && mapData[new_pos_x][new_pos_y - 1] == id && !inArray(new_pos_x, new_pos_y - 1) && tab_move_passable[tab_x][tab_y - 1] == -1) {
								  pos_temporaire.push([new_pos_x,new_pos_y - 1]);
								  tab_move.push([new_pos_x,new_pos_y - 1]);
								  tab_move_passable[tab_x][tab_y - 1] = 0;
							}
								
						break;
						case 3: 	
							if (mapData[new_pos_x - 1]  != undefined && mapData[new_pos_x - 1][new_pos_y]  != undefined && mapData[new_pos_x - 1][new_pos_y] == id && !inArray(new_pos_x - 1, new_pos_y) && tab_move_passable[tab_x - 1][tab_y] == -1) {
								  pos_temporaire.push([new_pos_x - 1,new_pos_y]);
								  tab_move.push([new_pos_x - 1,new_pos_y]);
								  tab_move_passable[tab_x - 1][tab_y] = 0;
							}
						break;
					}
				}
				
			}

			pos_semi_tempor = pos_temporaire;
			path += 1;
		}
		return tab_move;
	},
	
/**
@doc grid/
@method pathfinding `(>= 1.3.0)` Find the shortest path. Using the library [Pathfinding.js](https://github.com/qiao/PathFinding.js). The array must contain only the value 0 or 1. Useful to know the movement of an entity as a part in a game of chess

- 0 : passable
- 1 : not passable

> Before, Insert the script `pathfinding-browser.js` in header

> Attention ! The matrix is different that matrix of the library. The columns are the rows and rows are the columns.

Returns the columns and rows of path. If no arguments, returns the `PF.Grid`. You can use the API library.

	var matrix = [
		[0, 0, 0, 1, 0],
		[1, 0, 0, 0, 1],
		[0, 0, 1, 0, 0],
	];
	var grid = Class.New("Grid", [matrix]);
	var pf_grid = grid.pathfinding();
	pf_grid.setWalkableAt(1, 2, false);

@param {Integer} row0 Start position (row)
@param {Integer} col0 Start position (col)
@param {Integer} row1 Final position (row)
@param {Integer} col1 Final position (col)
@param {String} type (optional) Type of the search algorithm

*  `AStarFinder` (default)
*  `BreadthFirstFinder` 
*  `BestFirstFinder`
*  `DijkstraFinder` 
*  `BiAStarFinder`
*  `BiBestFirstFinder`
*  `BiDijkstraFinder` 
*  `BiBreadthFirstFinder` 
*  `JumpPointFinder` 

@param {Object} options (optional) Library Options. See [https://github.com/qiao/PathFinding.js](https://github.com/qiao/PathFinding.js)
@return {Array|PF.Grid}
@example

In `ready` method

	var matrix = [
		[0, 0, 0, 1, 0],
		[1, 0, 0, 0, 1],
		[0, 0, 1, 0, 0],
	];

	var grid = Class.New("Grid", [matrix]);
	grid.pathfinding(0, 0, 2, 4);

	// returns : [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]]

	grid.setPropertyByCell(0, 1, 1);
	grid.pathfinding(0, 0, 2, 4);

	// returns [];

*/	
	pathfinding: function(x0, y0, x1, y1, type, options) {
		 type = type || "AStarFinder";
		 if (!this._pf_grid) {
		 	 this._pf_grid = new PF.Grid(this._rows, this._cols,  this._pf_prop);
		 }
		 if (x0 === undefined) {
		 	 return this._pf_grid;
		 }
		return new PF[type](options).findPath(x0, y0, x1, y1, this._pf_grid.clone());
	}
	
});


var Hit =  {		
	Grid: {
		"new": function(rows, cols) {
			return Class.New("Grid", [rows, cols]);
		}
	}
}

if (typeof exports != "undefined") {
	exports.Class = Hit;
}