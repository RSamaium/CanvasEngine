var CE = require("canvasengine").listen(8333);
CE.Model.init("Main", ["start"], {

  initialize: function() {

  },
  start: function() {
	this.scene.emit("load", "Hello");
  }

});