import React, { useCallback, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from './Canvas.tsx'
import './index.css'
import { Container } from './Container.tsx'
import { Graphic } from './Graphic.tsx'
import { Rectangle } from './components/Rectangle.tsx'
import { useSpring } from '@react-spring/web'

React.createElement = (function (originalCreateElement) {
  return function (type, ...args) {
      if (typeof type === 'function') {
          return originalCreateElement.apply(this, [type, ...args]);
      }
      return originalCreateElement.apply(this, [type, ...args]);
  };
})(React.createElement);

function App() {
  const [x, setX] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setX(x => x + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Canvas>
      <Container x={x}>
      {
          // (() => {
          //   const val = Array(1).fill(0).map((_, i) => {
          //     return <Rectangle key={i} x={x} y={i} width={10} height={1} color={0x00ff00} />
          //   })
          //   return val
          // })()
        } 
        
      </Container>
    </Canvas>)
}

console.log(<App />)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
  ,
)
