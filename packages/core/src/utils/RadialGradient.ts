import { Texture, ImageSource, DOMAdapter, Matrix } from "pixi.js";

/**
 * Creates a radial gradient texture that can be used in PixiJS.
 * @example
 * const gradient = new RadialGradient(size, size, 0, size, size, 0);
 * gradient.addColorStop(0, "rgba(255, 255, 0, 1)");
 * gradient.addColorStop(0.5, "rgba(255, 255, 0, 0.3)");
 * gradient.addColorStop(0.8, "rgba(255, 255, 0, 0)");
 */
export class RadialGradient {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private gradient: CanvasGradient | null = null;
  private texture: Texture | null = null;
  public transform: Matrix;

  public size = 600;

  /**
   * Creates a new RadialGradient instance
   * @param x0 - The x-coordinate of the starting circle
   * @param y0 - The y-coordinate of the starting circle
   * @param x1 - The x-coordinate of the ending circle
   * @param y1 - The y-coordinate of the ending circle
   * @param x2 - The x-coordinate for gradient transformation
   * @param y2 - The y-coordinate for gradient transformation
   * @param focalPoint - The focal point of the gradient (0-1), defaults to 0
   */
  constructor(
    private x0: number,
    private y0: number,
    private x1: number,
    private y1: number,
    private x2: number,
    private y2: number,
    private focalPoint: number = 0
  ) {
    this.size = x0;
    const halfSize = this.size * 0.5;

    this.canvas = DOMAdapter.get().createCanvas() as any;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext("2d");

    if (this.ctx) {
      this.gradient = this.ctx.createRadialGradient(
        halfSize * (1 - focalPoint),
        halfSize,
        0,
        halfSize,
        halfSize,
        halfSize - 0.5
      );
    }
  }

  /**
   * Adds a color stop to the gradient
   * @param offset - The position of the color stop (0-1)
   * @param color - The color value (any valid CSS color string)
   */
  addColorStop(offset: number, color: string) {
    if (this.gradient) {
      this.gradient.addColorStop(offset, color);
    }
  }

  /**
   * Renders the gradient and returns the texture with its transformation matrix
   * @param options - Render options
   * @param options.translate - Optional translation coordinates
   * @returns Object containing the texture and transformation matrix
   */
  render({ translate }: { translate?: { x: number; y: number } } = {}) {
    const { x0, y0, x1, y1, x2, y2, focalPoint } = this;
    const defaultSize = this.size;
    if (this.ctx && this.gradient) {
      this.ctx.fillStyle = this.gradient;
      this.ctx.fillRect(0, 0, defaultSize, defaultSize);

      this.texture = new Texture({
        source: new ImageSource({
          resource: this.canvas,
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge",
        }),
      });

      const m = new Matrix();
      const dx = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
      const dy = Math.sqrt((x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0));
      const angle = Math.atan2(y1 - y0, x1 - x0);

      // Calculate the scale factors correctly
      const scaleX = dx / defaultSize;
      const scaleY = dy / defaultSize;

      // Apply transformations in the correct order
      m.rotate(-angle);
      m.scale(scaleX, scaleY);
      if (translate) {
        m.translate(translate.x, translate.y);
      }

      this.transform = m;
    }

    return {
      texture: this.texture,
      matrix: this.transform,
    };
  }
}
