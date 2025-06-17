import { test, expect } from 'vitest'
import { TiledParser } from "../src/parser/parser"
import { MapClass } from '../src'

const xmlWithTileProperties = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.8" tiledversion="1.8.2" orientation="orthogonal" renderorder="right-down" width="2" height="2" tilewidth="32" tileheight="32" infinite="0" nextlayerid="2" nextobjectid="1">
 <tileset firstgid="1" name="test" tilewidth="32" tileheight="32" tilecount="4" columns="2">
  <image source="test.png" width="64" height="64"/>
  <tile id="0">
   <properties>
    <property name="collision" type="bool" value="true"/>
    <property name="damage" type="int" value="10"/>
   </properties>
  </tile>
  <tile id="1">
   <properties>
    <property name="collision" type="bool" value="false"/>
    <property name="heal" type="int" value="5"/>
   </properties>
  </tile>
 </tileset>
 <layer id="1" name="Tile Layer 1" width="2" height="2">
  <data encoding="csv">
1,2,
3,4
</data>
 </layer>
</map>`

const tileset = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.9" tiledversion="1.9.2" name="test" tilewidth="32" tileheight="32" tilecount="4" columns="2">
 <image source="test.png" width="64" height="64"/>
 <tile id="0">
  <properties>
   <property name="collision" type="bool" value="true"/>
   <property name="damage" type="int" value="10"/>
  </properties>
 </tile>
 <tile id="1">
  <properties>
   <property name="collision" type="bool" value="false"/>
   <property name="heal" type="int" value="5"/>
  </properties>
 </tile>
</tileset>`

function getMap(xml: string): MapClass {
    const parser = new TiledParser(xml)
    const mapData = parser.parseMap()
    mapData.tilesets = mapData.tilesets.map(source => {
        const parserTileset = new TiledParser(tileset)
        const tilesetData = parserTileset.parseTileset()
        return {
            ...source,
            ...tilesetData
        }
    })
    return new MapClass(mapData)
}

test('Tile properties should be preserved after creation', () => {
    const map = getMap(xmlWithTileProperties)
    
    // Get tile at position (0, 0) which should be tile ID 1 (firstgid=1, so tile 0 from tileset)
    const tileInfo = map.getTileByPosition(0, 0)
    const [tile] = tileInfo.tiles
    
    expect(tile).toBeDefined()
    expect(tile.properties).toBeDefined()
    expect(Object.keys(tile.properties)).toHaveLength(2)
    expect(tile.getProperty('collision')).toBe(true)
    expect(tile.getProperty('damage')).toBe(10)
})

test('Multiple tiles should have their own properties', () => {
    const map = getMap(xmlWithTileProperties)
    
    // Get tile at position (32, 0) which should be tile ID 2 (tile 1 from tileset)
    const tileInfo = map.getTileByPosition(32, 0)
    const [tile] = tileInfo.tiles
    
    expect(tile).toBeDefined()
    expect(tile.properties).toBeDefined()
    expect(Object.keys(tile.properties)).toHaveLength(2)
    expect(tile.getProperty('collision')).toBe(false)
    expect(tile.getProperty('heal')).toBe(5)
})

test('Tiles without properties should have empty properties object', () => {
    const map = getMap(xmlWithTileProperties)
    
    // Get tile at position (0, 32) which should be tile ID 3 (tile 2 from tileset, no properties defined)
    const tileInfo = map.getTileByPosition(0, 32)
    const [tile] = tileInfo.tiles
    
    expect(tile).toBeDefined()
    expect(tile.properties).toBeDefined()
    expect(Object.keys(tile.properties)).toHaveLength(0)
}) 