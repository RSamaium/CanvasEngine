var CE = require("canvasengine").listen(8333);
CE.Model.init("Main", ["start"], {

  initialize: function(socket) {

  },
  
  start: function() {
	 CE.Core.io.sockets.emit("MyScene.load", "New User");
  },
  
  disconnect: function() {
  
  }

});