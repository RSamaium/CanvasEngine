var canvas = CE.defines("canvas_id").
    extend(Window).
    extend(Spritesheet).
    ready(function() {
        canvas.Scene.call("MyScene");
    });
            
canvas.Scene.New({
    name: "MyScene",

    materials: {
        images: {
            "border": "images/border_window.png"
        }
    },
    
    ready: function(stage) {

        var _window, content, 
            text = this.createElement();
    
        _window = canvas.Window.new(this, 400, 150, "border");
        
        _window.setBackground("#C8B979", 7, .5);
        _window.position("middle");
        
        content = _window.getContent();

        text.fillStyle = "black";
        text.font = "15px Arial";
        text.fillText("Window Test", 0, 0);
        text.y = 10;
        
        content.append(text);
        
        _window.open(stage);

    }
});