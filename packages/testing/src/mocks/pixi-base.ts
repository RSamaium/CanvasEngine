import { vi } from 'vitest';

/**
 * Base class for creating mock event emitters
 * Provides event handling functionality similar to PixiJS EventEmitter
 */
class MockEventEmitter {
  #eventListeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function) {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, []);
    }
    this.#eventListeners.get(event)!.push(handler);
    return this;
  }

  off(event: string, handler?: Function) {
    if (!this.#eventListeners.has(event)) return this;
    if (handler) {
      const handlers = this.#eventListeners.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.#eventListeners.delete(event);
    }
    return this;
  }

  emit(event: string, data?: any) {
    if (this.#eventListeners.has(event)) {
      this.#eventListeners.get(event)!.forEach(handler => handler(data));
    }
    return this;
  }

  once(event: string, handler: Function) {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    return this.on(event, onceHandler);
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.#eventListeners.delete(event);
    } else {
      this.#eventListeners.clear();
    }
    return this;
  }
}

/**
 * Mock for PixiJS ObservablePoint
 * Represents a point that can be observed for changes
 */
export class MockObservablePoint {
  x: number;
  y: number;
  cb?: (point: MockObservablePoint) => void;

  constructor(x = 0, y = 0, cb?: (point: MockObservablePoint) => void) {
    this.x = x;
    this.y = y;
    this.cb = cb;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.cb?.(this);
    return this;
  }

  copyFrom(point: { x: number; y: number }) {
    this.x = point.x;
    this.y = point.y;
    this.cb?.(this);
    return this;
  }

  copyTo(point: { x: number; y: number }) {
    point.x = this.x;
    point.y = this.y;
    return point;
  }

  equals(point: { x: number; y: number }) {
    return this.x === point.x && this.y === point.y;
  }
}

/**
 * Mock for PixiJS Rectangle
 */
export class MockRectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains = vi.fn((x: number, y: number) => {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  });

  clone = vi.fn(() => {
    return new MockRectangle(this.x, this.y, this.width, this.height);
  });
}

/**
 * Mock for PixiJS Texture
 */
export class MockTexture {
  width: number;
  height: number;
  baseTexture: any;
  frame: MockRectangle;
  valid: boolean = true;

  constructor(width = 100, height = 100) {
    this.width = width;
    this.height = height;
    this.frame = new MockRectangle(0, 0, width, height);
    this.baseTexture = {
      width,
      height,
      valid: true,
    };
  }

  destroy = vi.fn();
  update = vi.fn();
  clone = vi.fn(() => new MockTexture(this.width, this.height));
}

/**
 * Mock for PixiJS Container
 * Base class for all display objects that can contain children
 */
export class MockContainer extends MockEventEmitter {
  x: number = 0;
  y: number = 0;
  position: MockObservablePoint = new MockObservablePoint(0, 0, (point) => {
    this.x = point.x;
    this.y = point.y;
  });
  width: number = 0;
  height: number = 0;
  alpha: number = 1;
  visible: boolean = true;
  rotation: number = 0;
  scale: MockObservablePoint = new MockObservablePoint(1, 1);
  anchor: MockObservablePoint = new MockObservablePoint(0, 0);
  pivot: MockObservablePoint = new MockObservablePoint(0, 0);
  skew: MockObservablePoint = new MockObservablePoint(0, 0);
  tint: number = 0xffffff;
  blendMode: number = 0;
  filters: any[] = [];
  mask: any = null;
  parent: MockContainer | null = null;
  children: MockContainer[] = [];
  eventMode: string = 'auto';
  destroyed: boolean = false;
  zIndex: number = 0;
  sortableChildren: boolean = false;
  sortDirty: boolean = false;

  addChild = vi.fn(function<T extends MockContainer>(this: MockContainer, child: T): T {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    return child;
  });

  addChildAt = vi.fn(function<T extends MockContainer>(this: MockContainer, child: T, index: number): T {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.splice(index, 0, child);
    return child;
  });

  removeChild = vi.fn(function<T extends MockContainer>(this: MockContainer, child: T): T {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return child;
  });

  removeChildAt = vi.fn(function(this: MockContainer, index: number): MockContainer {
    const child = this.children[index];
    if (child) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return child;
  });

  removeChildren = vi.fn(function(this: MockContainer, beginIndex = 0, endIndex = this.children.length): MockContainer[] {
    const removed = this.children.splice(beginIndex, endIndex - beginIndex);
    removed.forEach(child => { child.parent = null; });
    return removed;
  });

  getChildAt = vi.fn(function(this: MockContainer, index: number): MockContainer {
    return this.children[index];
  });

  getChildIndex = vi.fn(function(this: MockContainer, child: MockContainer): number {
    return this.children.indexOf(child);
  });

  setChildIndex = vi.fn(function(this: MockContainer, child: MockContainer, index: number): void {
    const currentIndex = this.children.indexOf(child);
    if (currentIndex > -1) {
      this.children.splice(currentIndex, 1);
      this.children.splice(index, 0, child);
    }
  });

  swapChildren = vi.fn(function(this: MockContainer, child: MockContainer, child2: MockContainer): void {
    const index1 = this.children.indexOf(child);
    const index2 = this.children.indexOf(child2);
    if (index1 > -1 && index2 > -1) {
      [this.children[index1], this.children[index2]] = [this.children[index2], this.children[index1]];
    }
  });

  destroy = vi.fn(function(this: MockContainer, options?: any): void {
    this.destroyed = true;
    this.removeChildren();
    this.removeAllListeners();
  });

  updateTransform = vi.fn();
  render = vi.fn();
  calculateBounds = vi.fn();
  getLocalBounds = vi.fn(() => new MockRectangle(0, 0, this.width, this.height));
  getBounds = vi.fn(() => new MockRectangle(this.x, this.y, this.width, this.height));
  toLocal = vi.fn((point: { x: number; y: number }) => ({ x: point.x - this.x, y: point.y - this.y }));
  toGlobal = vi.fn((point: { x: number; y: number }) => ({ x: point.x + this.x, y: point.y + this.y }));
  setMask = vi.fn(function(this: MockContainer, options: { mask?: any; inverse?: boolean } = {}) {
    this.mask = options.mask ?? null;
    (this as any)._maskOptions = { inverse: options.inverse ?? false };
    return this;
  });
}

/**
 * Mock for PixiJS Graphics
 */
export class MockGraphics extends MockContainer {
  geometry: any = null;

  clear = vi.fn(() => this);
  rect = vi.fn(() => this);
  circle = vi.fn(() => this);
  ellipse = vi.fn(() => this);
  polygon = vi.fn(() => this);
  lineTo = vi.fn(() => this);
  moveTo = vi.fn(() => this);
  beginFill = vi.fn(() => this);
  endFill = vi.fn(() => this);
  lineStyle = vi.fn(() => this);
  drawRect = vi.fn(() => this);
  drawCircle = vi.fn(() => this);
  drawEllipse = vi.fn(() => this);
  drawPolygon = vi.fn(() => this);
  roundRect = vi.fn(() => this);
  fill = vi.fn(() => this);
  stroke = vi.fn(() => this);
}

/**
 * Mock for PixiJS Sprite
 */
export class MockSprite extends MockContainer {
  texture: MockTexture;
  anchor: MockObservablePoint = new MockObservablePoint(0.5, 0.5);

  constructor(texture?: MockTexture) {
    super();
    this.texture = texture || new MockTexture(100, 100);
    this.width = this.texture.width;
    this.height = this.texture.height;
  }

  static from = vi.fn((source: string | MockTexture) => {
    if (typeof source === 'string') {
      return new MockSprite(new MockTexture(100, 100));
    }
    return new MockSprite(source);
  });
}

/**
 * Mock for PixiJS Text
 */
export class MockText extends MockContainer {
  text: string = '';
  style: any = {};
  canvas: HTMLCanvasElement | null = null;
  context: CanvasRenderingContext2D | null = null;
  resolution: number = 1;

  constructor(text = '', style?: any) {
    super();
    this.text = text;
    this.style = style || {};
  }

  updateText = vi.fn((respectDirty = true) => {});
  updateTransform = vi.fn();
}

/**
 * Mock for PixiJS Mesh
 */
export class MockMesh extends MockContainer {
  geometry: any = null;
  shader: any = null;
  texture: MockTexture | null = null;

  constructor(geometry?: any, shader?: any, texture?: MockTexture) {
    super();
    this.geometry = geometry;
    this.shader = shader;
    this.texture = texture || null;
  }
}

/**
 * Mock for PixiJS TilingSprite
 */
export class MockTilingSprite extends MockContainer {
  texture: MockTexture;
  tilePosition: MockObservablePoint = new MockObservablePoint(0, 0);
  tileScale: MockObservablePoint = new MockObservablePoint(1, 1);

  constructor(texture: MockTexture, width = 100, height = 100) {
    super();
    this.texture = texture;
    this.width = width;
    this.height = height;
  }
}

/**
 * Mock for PixiJS NineSlicePlane
 */
export class MockNineSlicePlane extends MockContainer {
  texture: MockTexture;
  leftWidth: number = 10;
  topHeight: number = 10;
  rightWidth: number = 10;
  bottomHeight: number = 10;

  constructor(texture: MockTexture, leftWidth = 10, topHeight = 10, rightWidth = 10, bottomHeight = 10) {
    super();
    this.texture = texture;
    this.leftWidth = leftWidth;
    this.topHeight = topHeight;
    this.rightWidth = rightWidth;
    this.bottomHeight = bottomHeight;
  }
}

/**
 * Mock for PixiJS DOMElement
 */
export class MockDOMElement extends MockContainer {
  element: HTMLElement | null = null;

  constructor(element?: HTMLElement | string) {
    super();
    if (typeof element === 'string') {
      this.element = document.createElement(element);
    } else {
      this.element = element || null;
    }
  }
}

/**
 * Mock for PixiJS DOMContainer
 */
export class MockDOMContainer extends MockContainer {
  constructor() {
    super();
  }
}

/**
 * Mock for PixiJS Application
 */
export class MockApplication extends MockEventEmitter {
  stage: MockContainer = new MockContainer();
  screen: MockRectangle = new MockRectangle(800, 600);
  view: HTMLCanvasElement;
  destroyed: boolean = false;
  renderer: any = {
    width: 800,
    height: 600,
    resolution: 1,
    plugins: {},
    render: vi.fn(),
    destroy: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
  };
  ticker: any = {
    add: vi.fn(),
    remove: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  loader: any = {
    add: vi.fn(),
    load: vi.fn(),
  };

  constructor(options?: any) {
    super();
    const canvas = document.createElement('canvas');
    canvas.width = options?.width || 800;
    canvas.height = options?.height || 600;
    this.view = canvas;
    this.screen.width = options?.width || 800;
    this.screen.height = options?.height || 600;
  }

  render = vi.fn(() => {});
  destroy = vi.fn((removeView = false) => {
    this.destroyed = true;
    if (removeView && this.view.parentNode) {
      this.view.parentNode.removeChild(this.view);
    }
  });
  resize = vi.fn((width: number, height: number) => {
    this.screen.width = width;
    this.screen.height = height;
    this.view.width = width;
    this.view.height = height;
  });
}

/**
 * Mock for PixiJS VideoResource (for Video component)
 */
export class MockVideoResource {
  source: HTMLVideoElement | null = null;
  width: number = 0;
  height: number = 0;
  valid: boolean = false;

  constructor(source?: HTMLVideoElement) {
    this.source = source || null;
    if (source) {
      this.width = source.videoWidth || 0;
      this.height = source.videoHeight || 0;
      this.valid = true;
    }
  }

  load = vi.fn(() => Promise.resolve(this));
  destroy = vi.fn();
}
