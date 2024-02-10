import { BlurFilter } from 'pixi.js';
import { Stage, Container, Sprite, Text, useTick } from '@pixi/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client'
import Stats from 'stats.js'

import { Graphics } from '@pixi/react';
import { Svg } from './components/Svg';

function Rectangle(props) {
    const draw = useCallback((g) => {
        g.clear();
        g.lineStyle(props.lineWidth, props.color);
        g.drawRect(
            props.x,
            props.y,
            props.width - 2 * props.lineWidth,
            props.height - 2 * props.lineWidth
        );
    }, []);

    return <Graphics draw={draw} x={props.x} />
}

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

function Game() {
    const [x, setX] = useState(0);

    useTick((delta) => {
        stats.begin();
        setX(x => x + 1);
        stats.end();
    });

    return (
        <Container x={0} y={0}>

            {
                (() => {

                    const val = Array(10000).fill(0).map((_, i) => {
                        return <Rectangle key={i} x={x} y={i} width={10} height={10} lineWidth={1} color={0xff0000} />
                    })

                    return val
                })()
            }

        </Container>
    );

}

export const App = () => {
    return (
        <Stage>
            <Game />
        </Stage>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
    ,
)