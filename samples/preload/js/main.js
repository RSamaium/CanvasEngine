var canvas = CE.defines("canvas_id").
            ready(function() {
                canvas.Scene.call("MyScene");
            });
       

canvas.Scene.new({
    name: "MyScene",
    materials: {
        images: {
            empty: "images/bar_empty.jpg",
            full: "images/bar_full.jpg"
        }
    },
    ready: function(stage) {
  
        var pourcent = 0,
            _canvas = this.getCanvas(),
            background = this.createElement(),
            bar_full = this.createElement(),
            bar_empty = this.createElement();
        
        // Files to download. Could be used in other scenes
        var files = [
            {id: "1", path: "images/1.jpg"},
            {id: "2", path: "images/2.jpg"},
            {id: "3", path: "images/3.jpg"}
        ];
            
        background.fillStyle = "black";
        background.fillRect(0, 0, _canvas.width, _canvas.height);
            
        bar_empty.drawImage("empty");
        
        // Place the bar in the center of the canvas
        bar_empty.x = _canvas.width / 2 - bar_empty.img.width / 2;
        bar_empty.y = _canvas.height / 2 - bar_empty.img.height / 2;
        
        bar_empty.append(bar_full);
        
        stage.append(background);
        stage.append(bar_empty);

        canvas.Materials.load("images", files, function() {
            pourcent += Math.round(100 / files.length);
            bar_full.drawImage("full", 0, 0, pourcent + "%");
        }, function() {
            console.log("finish !");
        });
        
    }
});

