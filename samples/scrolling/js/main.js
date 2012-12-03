var canvas = CE.defines("canvas_id").
        extend(Scrolling).
        extend(Animation).
        ready(function() {
            canvas.Scene.call("MyScene");
        });
            
canvas.Scene.new({
    name: "MyScene",
    materials: {
        images: {
            "bird": "images/Bird.png",
            "sky": "images/sky.jpg"
        }
    },
    ready: function(stage) {
        var map, animation;
        
        this.scrolling = canvas.Scrolling.new(this, 64, 64);

        this.player = this.createElement();
        this.player.y = 110;
        animation = canvas.Animation.new({
            images: "bird",
            animations: {
                walk: {
                    frames: [1, 3],
                    size: {
                        width: 320/5,
                        height: 64
                    },
                    frequence: 5
                }
            }
        });
        
        
        animation.add(this.player);
        animation.play("walk", "loop");
        
        
        this.scrolling.setMainElement(this.player);
        
        map = this.createElement();
        map.drawImage("sky");
        map.append(this.player);
        
        this.scrolling.addScroll({
           element: map, 
           speed: 2,
           block: true,
           width: 1200,
           height: 300
        });
        
        stage.append(map);
        
    },
    render: function(stage) {
        this.player.x += 2;
        this.scrolling.update();
        stage.refresh();
    }
});