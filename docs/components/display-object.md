# Common Display Object

All common display objects are components:

- [Graphics](./graphic.md)
- [Image](./image.md)
- [Text](./text.md)
- [Sprite](./sprite.md)
- [Container](./container.md)

## Properties

| Property       | Type                | Description                                                                 |
|----------------|---------------------|-----------------------------------------------------------------------------|
| x              | number              | X-coordinate position of the display object.                                |
| y              | number              | Y-coordinate position of the display object.                                |
| width          | number              | Width of the display object.                                                |
| height         | number              | Height of the display object.                                               |
| scale          | object              | Scale of the display object.                                                |
| anchor         | object              | Anchor point of the display object.                                         |
| skew           | object              | Skew of the display object.                                                 |
| tint           | number              | Tint color of the display object.                                           |
| rotation       | number              | Rotation of the display object in radians.                                  |
| angle          | number              | Rotation of the display object in degrees.                                  |
| zIndex         | number              | Z-index of the display object.                                              |
| roundPixels    | boolean             | Whether to round pixel values.                                              |
| cursor         | string              | Cursor style when hovering over the display object.                         |
| visible        | boolean             | Visibility of the display object.                                           |
| alpha          | number              | Alpha transparency of the display object.                                   |
| pivot          | object              | Pivot point of the display object.                                          |
| flexDirection  | string              | Flex direction for layout. Possible values: 'row', 'column', 'row-reverse', 'column-reverse'. |
| flexWrap       | string              | Flex wrap for layout. Possible values: 'wrap', 'nowrap', 'wrap-reverse'.                      |
| justifyContent | string              | Justify content for layout. Possible values: 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'. |
| alignItems     | string              | Align items for layout. Possible values: 'auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'space-between', 'space-around'. |
| alignContent   | string              | Align content for layout. Possible values: 'flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'space-between', 'space-around'. |
| alignSelf      | string              | Align self for layout. Possible values: 'auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'space-between', 'space-around'. |
| margin         | object              | Margin for layout.                                                          |
| padding        | object              | Padding for layout.                                                         |
| gap            | object              | Gap for layout.                                                             |
| border         | object              | Border for layout.                                                          |
| positionType   | string              | Position type for layout.                                                   |
| filters        | array               | Filters applied to the display object.                                      |
| maskOf         | Element             | Element that this display object masks.                                     |
| blendMode      | string              | Blend mode for rendering.                                                   |
| filterArea     | object              | Filter area for rendering.                                                  |


# shadow

| Property       | Type                | Description                                                                 |  
| blur           | number              | Blur strength.                                                                 |
| color          | number              | Color of the shadow.                                                            |
| offset         | object              | Offset of the shadow.                                                           |
| quality        | number              | Quality of the shadow.                                                           |
