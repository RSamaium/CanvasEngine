# Canvas Engine
http://canvasengine.net

## Description

Framework to create video games in HTML5 Canvas

## Get Started

Follow the steps below to start:

1. Download the code `canvasengine-X.Y.Z.all.min.js` on Github or this website
2. Add this code in your page : 
        
		<!DOCTYPE html>
		<script src="canvasengine-X.Y.Z.all.min.js"></script>
		<canvas id="canvas_id" width="640" height="480"></canvas>
		
       
3. Initialize the canvas in your JS file :

        var canvas = CE.defines("canvas_id").ready(function() {	
         
        });

Method `ready` is called when the canvas is ready (DOM loaded)

## Use development files

Development files allows you to improve or correct CanvasEngine. To do this, insert these two files:

        <!DOCTYPE html>
        <script src="core/engine-common.js"></script>
		<script src="canvasengine.js"></script>
		<canvas id="canvas_id" width="640" height="480"></canvas>

> View other branches of CanvasEngine on Github, you'll other version under development

If you want to use features (Animation, Input, etc), add the appropriate files :

    <script src="extends/Animation.js"></script>

If you develop or modify a feature, you can use the global variable `Global_CE` to use other features.

Example :

    // In extends/your_feacture.js
    Global_CE.Input.press(Input.Enter, function() {
    });

### Your code

Your code contains classe(s) :

    Class.create("My_Class", {


    });

The developer can use this class in his game. You can also add code like this:
    
    var My_Class = {
    	My_Class: {
    		New: function) {
    			return Class.New("My_Class");
    		}
    	}
    };

it will use the namespace defined initially by the user :

    var canvas = CE.defines("canvas_id").extend(My_Class).ready(function() {	
         canvas.Scene.call("MyScene");
    });

    canvas.Scene.new({
      name: "MyScene",
      ready: function(stage) {
         var foo = canvas.My_Class.New();
      }
    });

### Documentation

Try to properly document the code for developer :

    /**
        @doc my_class
        @class Definition of "My Class"
        @example

            ...

    */
    Class.create("My_Class", {

    /**
      @doc my_class/
      @method foo ...
      @param bar {String} ...
      @example

            ...

    */
         foo: function(bar) {

         }

    });

See [http://canvasengine.net/doc](http://canvasengine.net/doc)


## Features

**Low-level API**

* Fullscreen support (Supported platforms).
* Multiple image file formats: DDS, JPG, PNG and TGA.
    * Define a transparent color
* Scene Structure
    * Overlay scenes 
    * Pause scene
* Multiplayer model
* Preloading
    * Get the percentage of loading
* Elements Manipulation
    * Manipulation : jQuery syntaxe
    * Draw : HTML5 Canvas API syntaxe
* Utilities
    * merge object
    * class

**Windows**

* Dialog box with the outline
* Cursor

**Animations**

* Set an animation from a spritesheet
* Frequence and animation speed
* Sequence of multiple image
* Creating a custom animation with multiple sequences
* Display once, loop or temporary

**Timeline (aka Tween)**

* Easy to make interpolations effects
* 29 Effects :
    * easeInQuad, easeOutQuad, easeInCubic, easeOutCubic, etc.
* Loop

**Collision**

* Entities model
* Test collision with virtual grid
* Polygon intersection and Contains Point.

**Text**

* Set maximum line width
* Display effect
    * Line by line
    * Character by character
* font file formats : TTF, EOT
* external fonts  
    * Google Fonts
    * Fontdeck
    * Fonts.com
    * Typekit

**Sound**

* Multiple sound file formats: OGG, WAV, MP3.
* Fading effects
* Web Audio or SoundManager2

**Effects**

* Change tone screen
* Perform a flash
* Shake screen

**Scrolling**


**Level Design**

* Tiled Map Editor (http://www.mapeditor.org)
* Gleed 2d (http://gleed2d.codeplex.com)

**Save & Load**

* Encoding with BISON.js

**Spritesheet Management**

**Input**

* Access to input types: Keyboard, Mouse, Xbox360 Pad, Joysticks
* click, dbclick, mousemove, mouseup, mousedown, mouseout, mouseover*
* Multi-Touch with Hammer.js : 
    * hold
    * tap
    * doubletap
    * drag, dragstart, dragend, dragup, dragdown, dragleft, dragright
    * swipe, swipeup, swipedown, swipeleft, swiperight
    * transform, transformstart, transformend
    * rotate
    * pinch, pinchin, pinchout
    * touch (gesture detection starts)
    * release (gesture detection ends)

## Roadmap (in order)

### v1.5

* Box2d
* Synchronized multi canvas (local multiplayer)

### v2.0

* Users and Groups Management for multiplayer model
* CSS drawing

## Test performance

### v1.0.6

* [Native class and CanvasEngine Class 1](http://jsperf.com/native-class-and-canvasengine-class)
* [Native class and CanvasEngine Class 2](http://jsperf.com/native-class-and-canvasengine-class-test2)

## Contributors

* [robwalch](https://github.com/robwalch) - [commit](https://github.com/robwalch/CanvasEngine/commit/e55909952c26ba1ec3e3d5bd6f733ddfffc4b647)
* [scottbw](https://github.com/scottbw) - [commit](https://github.com/RSamaium/CanvasEngine/commit/9600681d945c3efb8cea04391c2df0e12f843716)
* [SomeKittens](https://github.com/SomeKittens) - [commit](https://github.com/SomeKittens/CanvasEngine/commit/a934af7bf32799434a53876f346b80ef0da1b3e5)
* [TheOnly92](https://github.com/TheOnly92) - [commit](https://github.com/RSamaium/CanvasEngine/commit/d83a2f5512efb206bef96cf76e68f438f1f45b16)

## Changelog

### v1.4.0 (dev)

* Add functionality : User Interface
    * Preset
    * Button
    * Tooltip
    * Drag&Drop
    * Background
* Add weather effects : `rain()`, `snow()` and `storm()`
* Improves `offset()`. Possibility of using `top` and `bottom` to place events
* Improves options in Animation class
* Fix event mouse when canvas resized and center the canvas in full screen
* Fix using of several parameters in `to()` in Timeline class
* Fix Mouseover for child elements
* Avoid event propagation of key pressed

### v1.3.2

* Add `element:attrChange` event
* Add of `called()` method in the scene
* Improves `measureText()`. Returns text height
* Improves `fillText()`. Ability to center the text in an element
* Improves `each()`. Possible to iterate an object
* Improves `set()` in Spritesheet class. `tile` parameter is optional
* Improves `Scene.preload()` and `Materials.load()` with a parameter `material` in callback function
* Fix change size of a DOM element
* Fix arguments of `fillRect()`
* Fix using the method of traversing if index of an element is changed
* Fix display elements in the `preload()` method of the scene
* `Input.restore()` and `Input.memorize` deleted


### v1.3.1

* Possibility to use several times the commands for drawing - (TheOnly92)
* Improves `fillRect()` and `strokeRect()` by adding rounded corners
* Add `multiple` property in Context class
* Add `fillCircle()` and `strokeCircle()` in Context class
* Add `cache()` and `uncache()` in Element class
* Add `remove()` and `isStopped()` in Animation class and `add()` improved
* Marshal class compatible with Node.js
* Add `getStack()` ind Marshall class and `dump()`, `load()` improved
* Add `exist()` in Spritesheet class
* Add `html()` and `css()` in Element class for DOM layer
* Add `next()`, `prev()`, `last()`, `first()`, `eq()`, `find()`, `findAttr()` in Element class for traversing
* Add support for tile image dimensions that differ from the tile layer dimensions in Tiled class (scottbw)
* Add rotation and flip in Tiled class (TheOnly92)
* Display objects in Tiled class
* `getLayerObject()` changed in Tiled class
* Fix `getLayer()` in Tiled class
* Fix display when an object layer is present in Tiled class
* Fix bug where variables would not properly reset in Animation class (SomeKittens)
* Fix bug with IE if gamepad
* Fix click event and scrolling in fullscreen
* Fix `textAlign` and `lineCap` properties
* Caching of sound already loaded

### v1.3.0

* Add transition effects in scenes
* Add loading fonts, json and videos
* Add using Google Fonts
* Add Using WebCam
* multiplayer model improved
    * emit to specific scenes
    * `assignEvents()`
    * `loadEvents()` in Scene Class
    * `CE.connectServer()` and `CE.io`
    * Using `Tiled` and `Hit` classes
    * Compatible with Express 3
    * Documentation Improved
    * Tested with Node.js > 0.10.0
* Add `getImageData()`, `putImageData()`, `createImageData()` and `toDataURL()` in Canvas class
* Add `arcTo()` and `isPointInPath()` in Context class
* Add `opaqueImage()` in Materials class
* Add `toTimer()` in CanvasEngine Core
* Add `toMatrix()` and `rotateMatrix()` in CanvasEngine Core
* Add `remove()` in Window class
* Add to Tiled Map Editor : spacing, margin and tile offset
* Add `setPropertyByCell()`, `passableCell()` and `pathfinding()` in Grid class
* Fix `invertColor()` in Materials class
* Fix flip an element
* Fix click on transparent image
* Removes `forceEvent` property and adding the method `forceEvent()`
* Improve `imageToCanvas()` in Materials class
* Improve `getBasePath()` in Materials class
* Ability to use the DOM to display the canvas

### v1.2.7

* Add `extend()` in CanvasEngine Core ([Doc](http://canvasengine.net/doc/?p=core.utilities.extend))
* Add `soundmanager` option in defines() ([Doc](http://canvasengine.net/doc/?p=core.engine.defines))
* Add `ignoreLoadError` option in defines() ([Doc](http://canvasengine.net/doc/?p=core.engine.defines))
* Removal `addMethod()` in Element class
* Fix no recreating the sound if already created (with SoundManager2)
* Rendering performance increased

### v1.2.6

* Add `setSize()` in Canvas class ([Doc](http://canvasengine.net/doc/?p=core.canvas.setSize))
* Add `isFullscreen()` in Canvas class ([Doc](http://canvasengine.net/doc/?p=core.canvas.isFullscreen))
* Add mouse position in `trigger` parameters ([Doc](http://canvasengine.net/doc/?p=core.element.events.on))
* Disable context menu by default  ([Doc](http://canvasengine.net/doc/?p=core.engine.defines))

### v1.2.5

* Fix loop animation
* Add `patternSize` property in Animation Class ([Doc](http://canvasengine.net/doc/?p=extends.animation))

### v1.2.4

* Fix `getMousePosition` ([Doc](http://canvasengine.net/doc/?p=core.canvas.getMousePosition))

### v1.2.3

* Fix materials loading as `{id: Number, path: String}` ([Doc](http://canvasengine.net/doc/?p=core.materials.load))
* Fix `mouseover` and `mouseout`  ([Doc](http://canvasengine.net/doc/?p=core.element.events.on))
* Add `mouveEvent` property in Canvas class ([Doc](http://canvasengine.net/doc/?p=core.canvas.mouseEvent))
* Force `ready` method of canvas if the DOM is already loaded ([Doc](http://canvasengine.net/doc/?p=core.engine.ready))

### v1.2.2

* Fix scene reloaded
* Fix sounds for iOS

### v1.2.1

* Add getBasePath method in Materials class
* Add getFilename method in Materials class
* Add mousedown et mouseup events
* Add zIndex method in Scene class
* Fix mulit-touch gestures on touchpads
* Improve loading sounds

### v1.2.0

* Add Text feature
* Add Effect feature
* Add Cursor feature in Window class
* Add off method in Element class
* Add scroll method in Window class
* Add invertColor method in Materials class
* Add forceEvent property in Element class
* Add hasCmd method in Context class
* Add propagationOpacity property in Element Class
* Add mouseScroll method in Scrolling class
* Add random method in CanvasEngine Core
* Add freeze property in Scrolling class
* Add mobileUserAgent method in CanvasEngine core
* Fix event "canvas:render" when element is hidden
* Fix clip method in Context class
* Fix name attribute in Element class
* Fix value 0 in Timeline class
* Fix press method in Input class
* Fix load method in Materials class
* Fix animation construct in Animation class
* Fix load sound in cache
* Fix scrolling
* Fix measureText method in Canvas class
* Fix draw map in Tiled class
* Fix testCell method in Hit class
* Fix intersectsWith method in Polygon class
* Fix animation loop in Animation class
* Improve children method in Element class
* Improve position method in Window class
* Improve append method in Element class
* Improve clone method in Element class
* Improve reset method in Input class
* Improve load and dump methods in Marshal class
* Improve new method in CanvasEngine class
* Improve classes in Hit class
* Improve isPressed method in Input class
* Merge Hammer.js in CanvasEngine for multi touch feature

### v1.1.1

* Add testCell method in Grid class
* Add removeCmd method in Element class
* Add origin points in parameters in set method in SpriteSheet class
* Changing getEntityCells method in Grid Class
* Fix imageToCanvas method in Materials class
* Fix frequence in Animation class
* Fix set method in SpriteSheet class for windows
* getPropertyByCell method in Hit class returns undefined if column or row doesn't exist


### v1.1.0

* Add specific image param in animation
* Add position param in animation
* Add getStage method in Scene class
* Add getEnabled method in Scene class
* Add collision feature
* Add Window feature
* Add overlay scenes
* Add moveArray method in CanvasEngine Object
* Add offset method in Element Class
* Add position method in Element Class
* Add pack method in Element Class
* Add unpack method in Element Class
* Add detach method in Element Class
* Add children method in Element Class
* Add removeAttr method in Element Class
* Add prepend method in Element Class
* Add zIndex method in Element Class
* Add zIndexBefore method in Element Class
* Fix reload scene
* Fix click on multi scene
* Fix click on element witch opacity < 1
* Improving draw performance 
* Improving documentation (markdown)

### v1.0.8

* Add multi-tilemap in Tiled Class (robwalch)
* Add origin points in Spritesheet Class (robwalch)
* Fix keyUp method in Input Class (https://github.com/RSamaium/CanvasEngine/issues/4)
* Fix NPM problem (https://github.com/RSamaium/CanvasEngine/issues/7)
* Fix identifiers keys in Input class
* Fix addKey method in Input class
* Fix set method in Spritesheet class

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
Not indicated
### v1.0.2
Not indicated
### v1.0.1
Not indicated
### v1.0.0

* Initial Release

## Examples and Demos

http://rsamaium.github.com/CanvasEngine

## License

MIT. Free for commercial use.
