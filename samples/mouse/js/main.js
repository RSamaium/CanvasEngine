var canvas = CE.defines("canvas_id").
            ready(function() {
                canvas.Scene.call("MyScene");
            });
       

canvas.Scene.new({
    name: "MyScene",
    materials: {
        images: {
            spider: "images/spider.png"
        }
    },
    ready: function(stage) {
    
        var el = this.createElement(200, 200);
        el.drawImage("spider");
        
        el.on("mouseover", function(e) {
            this.opacity = this.opacity < 1 ? 1 : 0.5 ;
        });
        
        stage.append(el);
        
    }
});