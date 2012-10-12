# Get Started

Follow the steps below to start:

1. Download the code `canvasengine-X.Y.Z.all.min.js` on Github or this website
2. Add this code in your page : 
        <html>
		<head>
			<title>My Page</title>
		</head>
		<body>
			<canvas id="canvas_id" width="640" height="480"></canva>
			<script src="canvasengine-X.Y.Z.all.min.js"></script>
		</body>
        </html>
3. Initialize the canvas in your JS file :

        var canvas = CE.defines("canvas_id").ready(function() {	
         
        });

Method `ready` is called when the canvas is ready (DOM loaded)