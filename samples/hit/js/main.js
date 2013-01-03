var canvas = CE.defines("canvas_id").
        extend(Hit).
        ready(function() {
            canvas.Scene.call("MyScene");
        });
            
canvas.Scene.New({
    name: "MyScene",

    materials: {
        images: {
            "box": "images/crate.jpg"
        }
    },
    
    ready: function(stage) {
        var self = this;
        
        function _entity(x, y) {
            var entity = Class.New("Entity", [stage]);
            entity.rect(128);
            entity.position(x, y);
            entity.el.drawImage("box");
            stage.append(entity.el);
            return entity;
        }
        
        this.box1 = _entity(0, 50);
        this.box2 = _entity(200, 50);
        
    },
    render: function(stage) {

        this.box1.move(2); // Position X + 2
        
        this.box2.hit([this.box1], function(state, el) {
            if (state == "over") {
                el.opacity = 0.5;
            }
            else {
                el.opacity = 1;
            }
        });
        stage.refresh();
    }
});