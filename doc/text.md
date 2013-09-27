# Text and fonts

## Conventional use

The classic way is to use the properties of HTML5 :

    canvas.Scene.New({
        name: "MyScene",
        ready: function(stage) {
            var el = this.createElement();
            el.font = '40pt Arial';
            el.fillStyle = 'red';
            el.fillText('Hello World!', 50, 50);
            stage.append(el);
        }   
    });


You have :
    
* fillText()
* strokeText();

and several properties :



* fillStyle
* strokeStyle
* font
* textBaseline
* textAlign

Shadow : 

* shadowColor
* shadowBlur	
* shadowOffsetX
* shadowOffsetY

    > Infos : [W3Shools - HTML Canvas Reference](http://www.w3schools.com/tags/ref_canvas.asp)

> To measure a text:

>        var _canvas = this.getCanvas();
>        _canvas.measureText("Hello World", "16px").width;

> More details : [measureText()](?p=core.canvas.measureText) 

## Using fonts

Since version 1.3.0, it is possible to load your own fonts and fonts externs before the opening of the scene

### Your own fonts

ut your are in a file and load it at the beginning of the scene :

       canvas.Scene.new({
	        name: "MyScene",
	        materials: {
		        fonts: {
			        foo: "bar.ttf"
		        }
            },
            ready: function(stage) {
                 var el = this.createElement();
                 el.font = '40pt foo';
                 el.fillStyle = 'red';
                 el.fillText('Hello World!', 50, 50);
                 stage.append(el);
            }
	    }

Note that if you are on IE, CanvasEngine will look the same file but with the extension `.eot`. In our example, it will look `bar.eot`

### Fonts externs

It is possible to embed fonts from :

* Google Fonts
* Fontdeck
* Fonts.com
* Typekit

        canvas.Scene.new({
	        name: "MyScene",
	        materials: {
		        fonts: {
			         google: {
                        families: ['Droid Sans']
                     }
		        }
            },
            ready: function(stage) {
                 var el = this.createElement();
                 el.font = '40pt "Droid Sans"';
                 el.fillStyle = 'red';
                 el.fillText('Hello World!', 50, 50);
                 stage.append(el);
            }
	    }

You can find the values in [​​https://github.com/typekit/webfontloader](​​https://github.com/typekit/webfontloader). It is the `WebFontConfig` object 

## Using Text class 

CanvasEngine has a class for text and its effects.

1. Use this class :

        var canvas = CE.defines("canvas_id").
        extend([Animation, Text]).
        ready(function() {
        	canvas.Scene.call("MyScene");
        });

    > For effects, the class is independent of the Animation class

2. Create an element to insert the text in the `ready` method of the scene :

        var content = this.createElement();

3. Instantiate a variable of the `Text` class :

        var text = canvas.Text.New(this, "Nec minus feminae quoque calamitatum participes fuere similium.");

4. Set the text style :

        text.style({
    		size: "18px",
    		lineWidth: 300,
    		color: "red"
    	});

    > `lineWidth` is a property that defines the maximum width of a line. If the text exceeds, a newline occurs

    Other properties : [style()](?p=extends.text.style)

5. Indicate that you want to display the text in the element previously created :

        text.draw(content, 20, 20);
        stage.append(content);

    For effects, add value to the last parameter :

        text.draw(content, 20, 20, {
			line: { // Animation
				frames: 50
			}
		});

    Effect : [draw()](?p=extends.text.draw) 

Example :

<jsfiddle>WebCreative5/AP6BX</jsfiddle>