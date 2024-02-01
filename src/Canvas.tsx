import React, { useRef, useEffect } from 'react';
import { autoDetectRenderer, Container, Graphics } from 'pixi.js';
import { PixiAppContext } from './contexts/CanvasContext';
import { setYoyaContext } from "./contexts/YogaContext";
import { loadYoga } from 'yoga-layout';
import { CanvasContainer } from './services/Container';


export function Canvas({ children, ...props }) {
    const canvasRef = useRef<HTMLDivElement | null>(null);
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

            setInterval(() => {
                renderer.render(pixiApp)
            }, 16)

            canvasRef.current.appendChild(renderer.view);

            setIsReady(true)
        }
        run()
        return () => {
            canvasRef.current.removeChild(renderer.view);
        };
    }, []);

    return (
        <PixiAppContext.Provider value={{ pixiApp: pixiApp, isRootCanvas: true }}>
            <div ref={canvasRef} />
            {isReady && children}
        </PixiAppContext.Provider>
    )
}