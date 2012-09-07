var Rpg = require("./ModelServer").listen(8333).init("Main", ["start"], {

	initialize: function() {

	},
	start: function() {
		this.scene.emit("load", "Hello");
	}
	
});

