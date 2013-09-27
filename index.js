var obj = require('./core/engine-common'), 
	db, users, Model;

obj.CanvasEngine.requireExtend = function(name) {
	return require('./extends/' + name).Class;
};

function requireCore(name, params) {
	params = params || [];
	params = [obj.Class,  obj.CanvasEngine].concat(params);
	var _class = require('./core/' + name).Class;
	if (typeof _class == "object") {
		return _class;
		
	}
	else {
		return _class.apply(_class, params);
	}
}

exports.listen = function(app, port) {
	if (app) {
		var io = require('socket.io').listen(app);
		io.configure( function() {
			io.set('heartbeat timeout', 60);
		});
		obj.CanvasEngine.io = io;
		if (typeof app != "number") {
			obj.CanvasEngine.app = app;
			app.listen(port);	
		}
		
		db = requireCore("DB");
		users = requireCore("Users", [db]);
		Model = requireCore("ModelServer", [users]);
		
	}
	
	return {
		Class: obj.Class,
		Core: obj.CanvasEngine,
		DB: db,
		Users: users,
		Model: Model
	};
};