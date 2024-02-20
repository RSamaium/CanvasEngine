import { Layer, TiledLayer, TiledLayerType, TiledMap, TiledParserFile, TiledTileset } from "@rpgjs/tiled"
import { effect, h, mount, signal } from "../../engine/signal"
import { useProps } from "../../hooks/useProps"
import { Container } from "../Container"
import { TileSet } from "./TileSet"
import { loop } from "../../engine/reactive"
import { CompositeTileLayer } from "./TileLayer"
import { Sprite } from "../Spritesheet"
import { TilingSprite } from "../TilingSprite"


export function TiledMap(props) {
    const { map } = useProps(props)
    const layers = signal<TiledLayer[]>([])
    const objectLayer = props.objectLayer
    let tilesets: TiledTileset[] = []
    let mapData: TiledMap = {} as TiledMap

    const parseTmx = async (file: string, relativePath: string = '') => {
        // @ts-ignore
        const parser = new TiledParserFile(
            file,
            {
                basePath: '',
                staticDir: '',
                relativePath
            }
        )
        const data = await parser.parseFilePromise({
            getOnlyBasename: false
        })

        return data
    }

    effect(async () => {
        mapData = await parseTmx(map())
        tilesets = mapData.tilesets.map((tileSet) => new TileSet(tileSet).load(tileSet.image.source))
        layers.set(mapData.layers)
    })

    const createLayer = (layers, props = {}) => {
        return h(Container, props, loop(layers, (layer) => {
            switch (layer.type) {
                case TiledLayerType.Tile:
                    return h(CompositeTileLayer, {
                        tilewidth: mapData.tilewidth,
                        tileheight: mapData.tileheight,
                        // @ts-ignore
                        width: mapData.width,
                        // @ts-ignore
                        height: mapData.height,
                        ...layer,
                        tilesets
                    })
                case TiledLayerType.Image:
                    const { width, height, source } = layer.image
                    return h(TilingSprite, {
                        image: source,
                        ...layer,
                        width: layer.repeatx ? layer.width * layer.tilewidth : width,
                        height: layer.repeaty ? layer.height * layer.tileheight : height
                    })
                case TiledLayerType.Group:
                    return createLayer(signal(layer.layers), layer)
                case TiledLayerType.ObjectGroup:
                    const child = objectLayer?.(layer)
                    return h(Container, layer, child)
                default:
                    return h(Container)
            }
        }))
    }

    return createLayer(layers)
}