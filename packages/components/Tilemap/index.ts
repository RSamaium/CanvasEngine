import { Layer, TiledLayer, TiledParserFile } from "@rpgjs/tiled"
import { effect, h, mount, signal } from "../../engine/signal"
import { useProps } from "../../hooks/useProps"
import { Container } from "../Container"
import { TileSet } from "./TileSet"
import { loop } from "../../engine/reactive"
import { CompositeTileLayer } from "./TileLayer"


export function TiledMap(props) {
    const { map } = useProps(props)
    const layers = signal<TiledLayer[]>([])

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
        const data = await parseTmx(map())
        const tilesets = data.tilesets.map((tileSet) => new TileSet(tileSet).load(tileSet.image.source))
        layers.set(data.layers.map((layer) => {
            return {
                ...layer,
                tilewidth: data.tilewidth,
                tileheight: data.tileheight,
                tilesets
            }
        }))
    })

    return h(Container, {}, loop(layers, (layer) => {
        if (layer.type == 'tilelayer') {
            return h(CompositeTileLayer, layer)
        }
        return h(Container)
    }))
}