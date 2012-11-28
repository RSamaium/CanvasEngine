# Export natively game on iOS and Android

CocoonJS technology allows you to export your game natively on iOS and Android and accelerate the performance of HTML5 Canvas

You explanations on the following link : [Documentation](http://wiki.ludei.com/).

## Use with Canvas Engine

Create a file `index.html` including the lastest version of Canvas Engine :

    <!DOCTYPE html>
	<script src="js/canvasengine-X.Y.Z.all.min.js"></script>	
	<script src="js/main.js"></script>

* The main code of your game is in `main.js`
* It is normal not to have the `canvas` tag in HTML

During initialization of the canvas (in `main.js`), use the property `cocoonjs` and specify the width and height:

    var canvas = CE.defines("canvas_id", {
                    cocoonjs: {width: 640, height: 480}
                }).
                ready(function() {
                     // start game
                });


## Start using CocoonJS
The best way to start using CocoonJS is by following these easy steps:

1. Download the CocoonJS Launcher App to your device (iOS or Android). Read how to install and use it for each platform.
2. [Register as a CocoonJS developer](http://cocoonjsservice.ludei.com/cocoonjslaunchersvr/). It is a very simple process and you will get a registration code that will grant you access to the launcher and the cloud compilation system as well.
3. Try your application in the CocoonJS Launcher App to see how it runs. Check if CocoonJS supports all your code, and check the messages in our debug console. You can either ZIP you application and upload it to the launcher or access the same ZIP file through a URL to a web service. The CocoonJS Launcher App also allows you to access your application directly from a remote URL, so you can also specify the URL to the folder where your code is or to the common index.html file. Check the CocoonJS Launcher App tutorial for more information.
4. Once you see that your application runs correctly in the CocoonJS Launcher App, go to our Cloud Compilation System to get the final files that you will be able to upload to the markets.

> Source : [Documentation](http://wiki.ludei.com/)
