import { TiledLayer, TiledLayerType, TiledMap, TiledParserFile, TiledTileset } from "@rpgjs/tiled"
import { loop } from "../../engine/reactive"
import { effect, h, signal } from "../../engine/signal"
import { useProps } from "../../hooks/useProps"
import { Container } from "../Container"
import { TilingSprite } from "../TilingSprite"
import { CompositeTileLayer } from "./TileLayer"
import { TileSet } from "./TileSet"


export function TiledMap(props) {
    const { map } = useProps(props)
    const layers = signal<TiledLayer[]>([])
    const objectLayer = props.objectLayer
    let tilesets: TiledTileset[] = []
    let mapData: TiledMap = {} as TiledMap

    const parseTmx = async (file: string, relativePath: string = '') => {
        if (typeof file !== 'string') {
            return file
        }
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
        for (let tileSet of mapData.tilesets) {
            tilesets.push(await new TileSet(tileSet).load(tileSet.image.source))
        }
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