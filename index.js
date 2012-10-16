var app = require('http').createServer(), 
	io = require('socket.io').listen(app),
	obj = require('./core/engine-common');

obj.CanvasEngine.io = io;
obj.CanvasEngine.app = app;
	
exports.listen = function(port) {
	app.listen(port);
	return {
		Class: obj.Class,
		Core: obj.CanvasEngine,
		Model: require('./core/ModelServer').Class(obj.Class,  obj.CanvasEngine)
	};
};