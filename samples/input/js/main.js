var canvas = CE.defines("canvas_id").
            extend(Input).
            ready(function() {
                canvas.Scene.call("MyScene");
            });
       
    
canvas.Scene.new({
    name: "MyScene",
    ready: function(stage) {
    
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
        
        
        stage.append(el);
        
    },
    render: function(stage) {
        stage.refresh();
    }
});