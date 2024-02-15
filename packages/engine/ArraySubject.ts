import { BehaviorSubject } from 'rxjs';

export type ArrayChange<T> = {
  type: 'add' | 'remove' | 'update' | 'init' | 'reset';
  index?: number;
  items: T[];
};

/**
 * ArraySubject extends BehaviorSubject to monitor and notify about specific array modifications.
 * It distinguishes between additions, removals, and updates to array elements.
 */
export class ArraySubject<T> extends BehaviorSubject<ArrayChange<T>> {
  private _items: T[] = [];

  constructor(items: T[] = []) {
    super({ type: 'init', items }); // Initial dummy emission
    this.createProxy(items);
  }

  private createProxy(items) {
    this._items = new Proxy(items, {
      get: (target, prop, receiver) => {
        const origMethod = target[prop];
        // Intercept function calls (e.g., push, pop)
        if (typeof origMethod === 'function') {
          return (...args) => {
            let changeType: 'add' | 'remove' | 'update' = 'update';
            let index: number | undefined = undefined;

            switch (prop) {
              case 'push':
                index = target.length;
                changeType = 'add';
                break;
              case 'pop':
                index = target.length - 1;
                changeType = 'remove';
                break;
              case 'unshift':
                index = 0;
                changeType = 'add';
                break;
              case 'shift':
                index = 0;
                changeType = 'remove';
                break;
              case 'splice':
                index = args[0];
                changeType = args.length > 2 ? 'add' : 'remove';
                break;
            }

            const result = origMethod.apply(target, args);
            // Notify subscribers after the method call
            this.next({ type: changeType, index, items: args });

            return result;
          };
        }
        // Return property value for direct access
        return Reflect.get(target, prop, receiver);
      },
      set: (target, prop, value) => {
        const index = !isNaN(Number(prop)) ? Number(prop) : undefined;
        target[prop] = value;
        this.next({ type: 'update', index, items: [value] });
        return true; // Indicate success
      }
    });
  }


  get items(): T[] {
    return this._items;
  }

  set items(newItems: T[]) {
    this.createProxy(newItems);
    this.next({ type: 'reset', items: newItems });
  }
}