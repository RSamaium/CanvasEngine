# Canvas Engine Examples and Demos

* [Home](http://canvasengine.net)
* [Examples](http://rsamaium.github.com/CanvasEngine)

Improve the content of demos offering an example or demonstration

## How ?

1. Clone these repo branch
2. Copy `boilerplate` directory in the `samples` or `demos` directory
3. Rename the foler `boilerplate` copied by the name you want
4. Modify the `index.html` and `example.html`. Comments in the file tell you to make changes

> For the code, remember to change tabs to spaces

> Remember to put dimensions of the `iframe`  and `canvas`

## Structure

* images
* js
   * extends
* sounds

Your code is in `js/main.js`. The folder `extends` contains additional JS files of CanvasEngine

### Thumb (optional)

Replace `thumb.png` by your image (same name). Dimensions : 260*180px

### ZIP (optional)

Unzip the files (except `thumb.png` and `index.html`). It name is `example.zip`. In the `index.html` file, uncomment line to download the ZIP

## Add in examples list

1. Open the `index.html` file in the root
2. Add in the end of list `<ul class="thumbnails">`

        <li class="span3">
          <div class="thumbnail">
            <a href="samples/[FOLDER_NAME]">
              <img src="samples/[FOLDER_NAME]/thumb.png" alt="">
              <h3>[EXAMPLE_TITLE]</h3>
            </a>
            <p>[EXAMPLE_DESCRIPTION]</p>
         </div>
        </li>

## Submit your example

[Use Pull Requests](https://help.github.com/articles/using-pull-requests)

## License
MIT