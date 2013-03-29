var canvas = CE.defines("canvas_id").
    ready(function() {
        canvas.Scene.call("MyScene");
    });

canvas.Scene.new({
	name: "MyScene",
	materials: {
		sounds: {
			sound_id: "sounds/sound.mp3"
		}
	},
	ready: function(stage) {
		var _btn = {w: 110, h: 40};
		var btn = this.createElement(_btn.w, _btn.h),
			text = this.createElement();
			
		btn.fillStyle = "black";
		btn.fillRect(0, 0, _btn.w, _btn.h);
		
		text.font = "20px Arial";
		text.fillStyle = "white";
		text.fillText("Click me", 20, 27);
		
		btn.on("click", function() {
			canvas.Sound.get("sound_id").play();
		});
		
		btn.append(text);
		stage.append(btn);
	}
});