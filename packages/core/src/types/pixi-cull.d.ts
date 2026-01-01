declare module "pixi-cull" {
  export class Simple {
    constructor(options?: any);
    lists: Array<any>;
    cull(bounds: any): void;
  }
}
