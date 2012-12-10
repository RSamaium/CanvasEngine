var canvas = CE.defines('canvas_id').
		extend(Scrolling).
		extend(SpritesheetReg).
		extend(Tiled).
		ready(function() {
			canvas.Scene.call('MyScene');
		});


canvas.Scene.new({
	name: 'MyScene',
	materials: {
		images: {
			minimonk_64: 'images/minimonk_64.png',
			ground_64: 'images/ground_64.png',
			rooftiles_64: 'images/rooftiles_64.png',
			roofedge_64: 'images/roofedge_64.png',
			bricksred_64: 'images/bricksred_64.png',
			bricksgray2_64: 'images/bricksgray2_64.png',
			stairs_64: 'images/stairs_64.png'
		}
	},
	ready: function(stage) {
		var sprite, map, tiled;
		this.scrolling = canvas.Scrolling.new(this, 64, 64);

		var player = this.player = this.createElement();
		this.player.x = 100;
		this.player.y = 700;

		sprite = canvas.SpritesheetReg.new(
			'minimonk_64',
			[[0,0,74,137,0,37,126],[74,0,64,142,0,36,125],[138,0,64,137,0,35,123],[202,0,72,136,0,35,126],[274,0,64,137,0,27,123],[338,0,64,142,0,26,125],[402,0,74,141,0,40,129],[0,142,61,139,0,32,126],[61,142,67,141,0,33,129],[128,142,65,140,0,33,127],[193,142,77,142,0,43,126],[270,142,48,143,0,26,125],[318,142,53,143,0,29,125],[371,142,64,135,0,32,126],[435,142,66,134,0,33,125],[0,285,51,136,0,26,123],[51,285,68,134,0,36,125],[119,285,66,136,0,39,123],[185,285,67,138,0,34,128],[252,285,64,140,0,30,126],[316,285,67,138,0,34,128],[383,285,64,140,0,33,126],[0,425,66,134,0,32,125],[66,425,51,136,0,24,123],[117,425,68,134,0,31,125],[185,425,66,136,0,26,123],[251,425,77,142,0,32,126],[328,425,48,143,0,20,125],[376,425,53,143,0,22,125],[429,425,64,135,0,30,126],[0,568,74,137,0,37,126],[74,568,74,138,0,41,116],[148,568,69,134,0,34,113],[217,568,73,144,0,40,100],[74,0,64,142,0,36,125],[290,568,48,142,0,43,124],[338,568,77,144,0,80,126],[415,568,91,135,0,108,116],[0,712,64,137,0,35,123],[64,712,68,139,0,38,126],[132,712,52,142,0,41,131],[184,712,45,139,0,46,130],[229,712,72,136,0,35,126],[301,712,64,137,0,30,136],[365,712,67,138,0,34,142],[432,712,61,138,0,34,144],[0,854,64,137,0,27,123],[64,854,68,139,0,28,126],[132,854,52,142,0,9,131],[184,854,45,139,0,-2,130],[338,0,64,142,0,26,125],[229,854,47,142,0,33,124],[276,854,77,144,0,-4,126],[353,854,91,135,0,-18,116]]
		);
		sprite.draw(this.player, '0');

		this.scrolling.setMainElement(this.player);

		map = this.createElement();
		tiled = canvas.Tiled.new();

		this.scrolling.addScroll({
           element: map,
           speed: 1,
           block: true,
           width: 1280,
           height: 720
        });
        
		tiled.load(this, map, 'assets/map.json');
		tiled.ready(function() {
			var tileW = this.getTileWidth(),
				tileH = this.getTileHeight(),
				layerObj = this.getLayerObject();
			console.log('tiled map ready', tileW, tileH, layerObj, player);

			map.append(player);
		});

		
		stage.append(map);
	},
	render: function(stage) {
		this.player.x += 1;
		this.scrolling.update();
        stage.refresh();
	}
});