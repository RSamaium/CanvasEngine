# Canvas Engine
http://canvasengine.net

## Description

Framework to create video games in HTML5 Canvas

## Features

* Scene Structure
* Multiplayer model
* Preloading
* Animations
* Timeline
* Keyboard and Gamepad
* Sound
* Scrolling
* Level Design
* Save & Load
* Spritesheet Management
* Mouse Control
* Elements Manipulation

## Editors
* Tiled Map Editor (http://www.mapeditor.org)
* Gleed 2d (http://gleed2d.codeplex.com)

## Roadmap

* Box2d
* Windows
* Transition
* Overlay scenes
* Game Effects
* Text Effects
* Synchronized multi canvas (local multiplayer)

## Test performance

### v1.0.6

* [Native class and CanvasEngine Class 1](http://jsperf.com/native-class-and-canvasengine-class)
* [Native class and CanvasEngine Class 2](http://jsperf.com/native-class-and-canvasengine-class-test2)

## Changelog

### v1.0.7

* Move clear method (Context class -> Canvas class)
* Change exit method in Scene Class
* Add multi scenes feature.
* Add togglePause method in Scene Class
* Add pause method in Scene Class
* Add isEnabled method in Scene Class
* Add exitAll method in Scene Class
* Add eventExist method in Element Class
* Add alias for new method : New
* Improves the performance of clicks
* Fix [Info of tile size](https://github.com/RSamaium/CanvasEngine/issues/2)
* Fix "this_" in Marshal class
* Improving documentation

### v1.0.6

* Change addLoopListener method
* Ignore loading music if the type is not supported
* Add getExtension method in Materials class
* Add remove method in Marshal class
* Add special events defined by a namespace (methods: refresh)
* Add moveTo, lineTo, quadraticCurveTo, bezierCurveTo in Context
* Add addMethod method in Context Class
* Addition to loading the canvas for CocoonJS)
* Fix save and load (IE9+)
* Fix reference of image loaded (for CocoonJS)
* Fix click on element
* Fix Gamepad (Google Chrome)
* Fix extend Context Class
* Fix positions of a element's children resized
* Fix origin point of element's children
* Improving documentation

### v1.0.5

* Fix restart of animations (Animation Class)
* Fix children elements opacity
* Fix reading some element properties
* Fix positions of a element resized
* Add rgbToHex method in CanvasEngine object
* Add pattern method in Spritesheet class
* Add cropImage method in Materials class
* Add transparentColor method in Materials class
* Add imageToCanvas method in Materials class
* Add getScene method in Element class
* Add createPattern method in Canvas class
* Add createLinearGradient method in Canvas class
* Add createRadialGradient method in Canvas class
* Add addColorStop method in Canvas class
* Add measureText method in Canvas class
* Improving performance click
* Improving the get method in Materials class
* Improving documentation

### v1.0.4

* Fix animated images
* Improving documentation

### v1.0.3
--
### v1.0.2
--
### v1.0.1
--
### v1.0.0

* Initial Release

## Demos

Empty

## License

MIT. Free for commercial use.

