var canvas = CE.defines("canvas_id").
            extend(Animation).
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
        
        var timeline = canvas.Timeline.new(this.el);
        timeline.to({x: 300, rotation: 260}, 60 * 5,  Ease.easeOutElastic).call(); // 5s
        
        stage.append(this.el);
    },
    render: function(stage) {
        stage.refresh();
    }
});