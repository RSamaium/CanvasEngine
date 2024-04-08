import { Filter } from "pixi.js";

export class TransitionFilter extends Filter {
    constructor() {
        super(`
            precision mediump float;
            
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float progress; // de 1 à 0
            
            void main(void) {
                vec4 texColor = texture2D(uSampler, vTextureCoord);
                float luminance = (texColor.r + texColor.g + texColor.b) / 3.0;
                float alpha = smoothstep(0.0, 1.0, luminance) * progress;
                gl_FragColor = vec4(texColor.rgb, alpha);
            }
        `)
    }
}   