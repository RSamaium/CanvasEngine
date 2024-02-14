import { BehaviorSubject } from 'rxjs';

type ArrayChange<T> = {
  type: 'add' | 'remove' | 'update' | 'init';
  index: number | null; // Index concerned by the change, null for bulk updates
  items: T[];
};

/**
 * ArraySubject extends BehaviorSubject to monitor and notify about specific array modifications.
 * It distinguishes between additions, removals, and updates to array elements.
 */
export class ArraySubject<T> extends BehaviorSubject<ArrayChange<T>> {
  private _items: T[] = [];

  constructor(items: T[] = []) {
    super({ type: 'init', index: null, items }); // Initial dummy emission

    this._items = new Proxy(items, {
      get: (target, prop, receiver) => {
        const origMethod = target[prop];
        // Intercept function calls (e.g., push, pop)
        if (typeof origMethod === 'function') {
          return (...args) => {
            let changeType: 'add' | 'remove' | 'update' = 'update';
            let index: number | null = null;

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
              default:
                index = null; // Bulk update or non-standard operation
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
        const index = !isNaN(Number(prop)) ? Number(prop) : null;
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
    this._items = new Proxy(newItems, this._items);
    this.next({ type: 'init', items: newItems });
  }
}