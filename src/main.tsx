import React, { useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from './Canvas.tsx'
import './index.css'
import { Container } from './Container.tsx'
import { Graphic } from './Graphic.tsx'
import { Rectangle } from './components/Rectangle.tsx'

function App() {
  return (
    <Canvas>
      <Container width={'100%'} height={300} flexDirection="row" justifyContent="center">
        <Rectangle x={0} y={0} width={'10%'} height={100} color={0x00ff00} />
        <Rectangle x={0} y={0} width={'90%'} height={100} color={0x0000ff} />
      </Container>
    </Canvas>)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
  ,
)
