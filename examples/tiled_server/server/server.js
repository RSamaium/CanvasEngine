var CE = require("canvasengine").listen(8333),
	Tiled = CE.Core.requireExtend("Tiled").Class,
	Class = CE.Class;

CE.Model.init("Main", {

	initialize: function(socket) {
	
		var tiled = Class.New("Tiled");
		tiled.ready(function(map) {
			socket.emit("Scene_Map.load", map);
		});
		tiled.load("map.json");
		
	}
});