var canvas = CE.defines("canvas_id").
            extend(Input).
            ready(function() {
                canvas.Scene.call("MyScene");
            });
       

canvas.Scene.new({
    name: "MyScene",
    ready: function(stage) {
    
        this.gamepad = canvas.Input.Gamepad.init(function() {
          console.log("Gamepad connected");
        }, function() {
          console.log("Gamepad disconnected");
        });
    
        var el = this.createElement();
        el.fillStyle = "black";
        el.font = "20px Arial";
        el.textBaseline = "top";
        el.fillText("Press button A here", 0, 0);
        
        canvas.Input.keyDown(Input.A, function(e) {
            el.fillText("A pressed", 0, 0);
        });
        canvas.Input.keyUp(Input.A, function(e) {
            el.fillText("A released", 0, 0);
        });
        
        this.gamepad.addListener("faceButton0", Input.A);
        
        this.gamepad.addListener("faceButton1", function() {
           console.log("key B down");
        }, function() {
           console.log("key B up");
        });
        
        
        stage.append(el);
        
    },
    render: function(stage) {
        this.gamepad.update();
        stage.refresh();
    }
});