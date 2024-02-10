import React, { useRef, useEffect, memo } from 'react';
import { autoDetectRenderer, Container, Graphics } from 'pixi.js';
import { PixiAppContext } from './contexts/CanvasContext';
import { setYoyaContext } from "./contexts/YogaContext";
import { loadYoga } from 'yoga-layout';
import { CanvasContainer } from './services/Container';
import { Scheduler } from './services/Scheduler';
import { setChangeLayout } from './stores/canvas';




export const Canvas =  memo(({ children, ...props }) => {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const schedulerRef = useRef<Scheduler | null>(null);
    let [pixiApp, setPixiApp] = React.useState<Container | null>(null);
    const [isReady, setIsReady] = React.useState(false);


    useEffect(() => {
        async function run() {
            setYoyaContext(await loadYoga())

            const renderer = autoDetectRenderer(props)
            const pixiApp = new CanvasContainer()
            pixiApp.setWidth(props.width ?? 800)
            pixiApp.setHeight(props.height ?? 600)
            setPixiApp(pixiApp)

            schedulerRef.current = new Scheduler()
            schedulerRef.current.start()
            schedulerRef.current.tick.listen(() => {
                renderer.render(pixiApp)
            })

            console.log(children)

            const container = children.type()
            pixiApp.addChild(container)

        
            const handler = {
                set(target, prop, value) {
                    console.log(value)
                    return value; // Retourne le résultat de l'opération d'origine
                }
            };


            // for (let child of children.props.children) {
            //     container.addChild(child.type(child.props))
            // }

            canvasRef.current.appendChild(renderer.view);

            setIsReady(true)

            setTimeout(() => {
                console.time()
                // pixiApp.calculateLayout();
                // setChangeLayout();
                console.timeEnd()
            }, 100)
        }
        run()
        return () => { };
    }, []);

    return (
        <PixiAppContext.Provider value={{ pixiApp: pixiApp, isRootCanvas: true, scheduler: schedulerRef.current }}>
            <div ref={canvasRef} />
        </PixiAppContext.Provider>
    )
})