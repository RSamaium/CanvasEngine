var canvas = CE.defines("canvas_id").
		extend(Animation).
		ready(function() {
			canvas.Scene.call("MyScene");
		});
   

canvas.Scene.new({
	name: "MyScene",
	materials: {
		images: {
			chara: "images/chara.png"
		}
	},
	ready: function(stage) {
	   var el = this.createElement(),
			animation = canvas.Animation.new({
				images: "chara",
				animations: {
					walk: {
						frames: [0, 3],
						size: {
							width: 250/5,
							height: 200/4
						},
						frequence: 5
					}
				}
			});
		
		animation.add(el);
		animation.play("walk", "loop");
		
		stage.append(el);
	},
	render: function(stage) {
		stage.refresh();
	}
});