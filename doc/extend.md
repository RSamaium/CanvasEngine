# Extend Canvas Engine

Canvas Engine can be extended to have more features : 

    var canvas = CE.defines("canvas_id").
	    extend(Input).
		ready(function() {
			canvas.Scene.call("MyScene");
		});
		
	canvas.Scene.new({
	  name: "MyScene", // Obligatory
	  ready: function(stage) {
		 canvas.Input.keyDown(Input.A, function(e) {
			console.log("A is pressed");
		 });
	  },
	  render: function(stage) {
		 stage.refresh();
	  }
    });


1. Use the `extend` method to add class. If multiple, create a chain :

	    var canvas = CE.defines("canvas_id").
	      extend(Input).
	      extend(Animation).
		  ready(function() {
			
		  });
		
2. If the class is not static, use the initialized variable (`canvas` here) and the name of the class then
3. In the menu of this documentation, click functionality extended to read more details on its use

---

> Note: For editors, add the JS file, presents in the folder `extends`, in your page 

     <script src="extends/Tiled.js"></script>
     <script>
	   var canvas = CE.defines("canvas_id").
	    extend(Tiled).
		ready(function() {
			
		});
     </script>