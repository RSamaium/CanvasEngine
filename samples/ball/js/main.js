var canvas = CE.defines("canvas_id").
            ready(function() {
                canvas.Scene.call("MyScene");
            });
       
    
canvas.Scene.new({
    name: "MyScene",
    materials: {
        images: {
            ball: "images/ball.png"
        }
    },
    ready: function(stage) {
        this.el = this.createElement(64, 64);
        this.el.drawImage("ball");
        this.el.setOriginPoint("middle");
        stage.append(this.el);
    },
    render: function(stage) {
       this.el.x += 0.5;
       this.el.rotation += 1;
       stage.refresh();
    }
});