var canvas = CE.defines("canvas_id").
extend(Animation). // for fade effect
ready(function() {
	canvas.Scene.call("Scene1");
});

canvas.Scene.New({
	name: "Scene1",
	materials: {
		images: {
			"a": "images/a.jpg",
			"b": "images/b.jpg",
			"img_transition": {path: "images/transitions/tra7.png", transition: true}
		}
	},
	ready: function(stage) {
		var content = this.createElement();
		content.drawImage('a');

		content.on("click", function() {
			canvas.Scene.call("Scene2", {
				transition: {
					type: "image",
					id: "img_transition",
					finish: function() {
						console.log('finish !');
					}
				}
			});
		});
		
		stage.append(content);
	}
});	

canvas.Scene.New({
	name: "Scene2",
	ready: function(stage) {
		var content = this.createElement();
		content.drawImage('b');
		
		content.on("click", function() {
			canvas.Scene.call("Scene1", {
				transition: true // fade
			});
		});
		
		stage.append(content);
	}
});	