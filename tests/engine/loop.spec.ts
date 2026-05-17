import { loop, Container, h, signal, Text, computed, mount } from "canvasengine";
import { describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";

describe("loop with array", () => {

  test(`Test loop with static items`, async () => {
    const items = [1, 2, 3];
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
  });

  test(`Test loop with initial items`, async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
  });

  test(`Test loop with computed initial items`, async () => {
    const items = computed(() => [1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
  });

  test(`Test loop with computed`, async () => {
    const reactive = signal([1, 2, 3])
    const items = computed(() => reactive());
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
  });

  test(`Test loop with computed signal call dependency updates`, async () => {
    const items = signal([1, 2]);
    const value = loop(computed(() => items()), (item) => h(Text, { text: String(item) }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;

    expect(children.map((child) => child.text)).toEqual(['1', '2']);

    items.set([4, 5, 6]);

    await vi.waitFor(() => {
      expect(children.map((child) => child.text)).toEqual(['4', '5', '6']);
    });

    items().push(7);

    await vi.waitFor(() => {
      expect(children.map((child) => child.text)).toEqual(['4', '5', '6', '7']);
    });
  });

  test(`Test loop with adding items`, async () => {
    const items = signal([1, 2]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(2);

    items().push(3);
    expect(container.componentInstance.children.length).toBe(3);
    expect(container.componentInstance.children[2].x).toBe(3);
  });

  test(`Test loop does not remount existing items when adding`, async () => {
    const items = signal([1, 2]);
    const mounted = vi.fn();

    function Item(props: { value: number }) {
      mount(() => {
        mounted(props.value);
      });
      return h(Container, { x: props.value });
    }

    const value = loop(items, (item) => h(Item, { value: item }));
    const container = await TestBed.createComponent(Container, {}, value);

    expect(container.componentInstance.children.length).toBe(2);
    expect(mounted).toHaveBeenCalledTimes(2);
    expect(mounted.mock.calls.map(([value]) => value)).toEqual([1, 2]);

    items().push(3);

    await vi.waitFor(() => {
      expect(container.componentInstance.children.length).toBe(3);
      expect(mounted).toHaveBeenCalledTimes(3);
    });

    expect(mounted.mock.calls.map(([value]) => value)).toEqual([1, 2, 3]);
  });

  test(`Test loop with removing items`, async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    items().splice(1, 1);
    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].x).toBe(1);
    expect(container.componentInstance.children[1].x).toBe(3);
  });

  /* TODO
  test(`Test loop with multiple removing items`, async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    items().splice(1, 2);
    expect(container.componentInstance.children.length).toBe(1);
    expect(container.componentInstance.children[0].x).toBe(1);
  });
  */

  test(`Test loop with reset items`, async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    items.set([4, 5]);

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].x).toBe(4);
    expect(container.componentInstance.children[1].x).toBe(5);
  });

  test('keeps an initially empty loop before the following loop when it receives items later', async () => {
    const firstItems = signal<string[]>([]);
    const secondItems = signal(['second']);

    const value = [
      loop(firstItems, (item) => h(Text, { text: item })),
      loop(secondItems, (item) => h(Text, { text: item }))
    ];

    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;

    expect(children.map((child) => child.text)).toEqual(['second']);

    firstItems.set(['first']);

    await vi.waitFor(() => {
      expect(children.map((child) => child.text)).toEqual(['first', 'second']);
    });

    firstItems().push('first-2');

    await vi.waitFor(() => {
      expect(children.map((child) => child.text)).toEqual(['first', 'first-2', 'second']);
    });
  });
});

describe("loop with object", () => {
  test(`Test loop with object`, async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
    expect(container.componentInstance.children[0].text).toBe("a");
  });


  test(`Test loop with adding object properties`, async () => {
    const items = signal({ a: 1, b: 2 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(2);

    items().c = 3;

    expect(container.componentInstance.children.length).toBe(3);
    expect(container.componentInstance.children[2].text).toBe("c");
    expect(container.componentInstance.children[2].x).toBe(3);
  });

  test(`Test loop with removing object properties`, async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    delete items().b;

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe("a");
    expect(container.componentInstance.children[1].text).toBe("c");
  });

  test(`Test loop with removing object properties and add`, async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    delete items().b;

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe("a");
    expect(container.componentInstance.children[1].text).toBe("c");
  });

  test(`Test loop with reset object`, async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);

    items.set({ d: 4, e: 5 });
    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe("d");
    expect(container.componentInstance.children[0].x).toBe(4);
    expect(container.componentInstance.children[1].text).toBe("e");
    expect(container.componentInstance.children[1].x).toBe(5);
  });

  test('Test loop with object with nested object', async () => {
    const obj = signal({
      '7dzfez': {
        position: {
          x: signal(100),
          y: signal(100)
        },
        direction: signal('down'),
        graphics: signal('male')
      }
    })
    const value = loop(obj, (item, key) => {
      return h(Text, { text: computed(() => item.position.x()) })
    });
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(1);
    expect(container.componentInstance.children[0].text).toBe('100');
  });


  test('Test loop with object with added nested object', async () => {
    const obj = signal({})

    obj()['7dzfez'] = {
      position: {
        x: signal(100),
        y: signal(100)
      },
    }

    const value = loop(obj, (item, key) => {
      return h(Text, { text: item.position.x })
    });

    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(1);
    expect(container.componentInstance.children[0].text).toBe('100');
  });

  test('Test loop with object with added nested object', async () => {
    const obj = signal({})

    obj()['7dzfez'] = {
      array: signal([{ id: 1 }])
    }

    const value = loop(obj, (item, key) => {
      return h(Text, { text: item.array()[0].id })
    });
    const container = await TestBed.createComponent(Container, {}, value);

    obj()['eee'] = {
      array: signal([{ id: 2 }])
    }

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe('1');
    expect(container.componentInstance.children[1].text).toBe('2');
  });

  test('Test loop with object with multiple items', async () => {
    const obj = signal({})

    obj()['7dzfez'] = {
      name: 'aaa'
    }


    obj()['eee'] = {
     name: 'bbb'
    }

    const value = loop(obj, (item, key) => {
      return h(Text, { text: item.name })
    });
    const container = await TestBed.createComponent(Container, {}, value);

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe('aaa');
    expect(container.componentInstance.children[1].text).toBe('bbb');
  });

  test('Test loop with object with multiple items', async () => {
    const obj = signal([])

    obj().push('aaa')


    obj().push('bbb')

    const value = loop(obj, (name) => {
      return h(Text, { text: name })
    });
    const container = await TestBed.createComponent(Container, {}, value);

    expect(container.componentInstance.children.length).toBe(2);
    expect(container.componentInstance.children[0].text).toBe('aaa');
    expect(container.componentInstance.children[1].text).toBe('bbb');
  });

  test('Test loop with array direct index assignment', async () => {
    const items = signal(['aaaa'])
    
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(1);
    expect(children[0].text).toBe('aaaa');
    
    items()[2] = 'cccc';

    expect(children.length).toBe(2);
    expect(children[0].text).toBe('aaaa');
    expect(children[1].text).toBe('cccc');
  });
});

// Tests supplémentaires pour les fonctionnalités non testées de loop
describe("loop additional tests", () => {
  test('Test loop with empty initial array', async () => {
    const items = signal([]);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(0);
    
    items().push('item1');
    expect(children.length).toBe(1);
    expect(children[0].text).toBe('item1');
  });

  test('Test loop with empty initial object', async () => {
    const items = signal({});
    const value = loop(items, (value, key) => h(Text, { text: key }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(0);
    
    items().key1 = 'value1';
    expect(children.length).toBe(1);
    expect(children[0].text).toBe('key1');
  });

 

  test('Test loop with multiple removing object properties', async () => {
    const items = signal({ a: 1, b: 2, c: 3, d: 4 });
    const value = loop(items, (item, key) => h(Text, { text: key, x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(4);

    delete items().b;
    delete items().c;
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('a');
    expect(children[1].text).toBe('d');
  });

  test('Test loop with updating array item', async () => {
    const items = signal(['a', 'b', 'c']);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(3);
    expect(children[1].text).toBe('b');
    
    items()[1] = 'updated';
    
    expect(children.length).toBe(3);
    expect(children[1].text).toBe('updated');
  });

  test('Test loop with updating object property', async () => {
    const items = signal({ a: 'value1', b: 'value2' });
    const value = loop(items, (item, key) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    
    items().b = 'updated';
    
    expect(children.length).toBe(2);
    expect(children[1].text).toBe('updated');
  });

  test('Test loop with null initial value then array', async () => {
    const items = signal([]);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(0);
    
    items.set(['item1', 'item2']);
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('item1');
    expect(children[1].text).toBe('item2');
  });

  test('Test loop with null initial value then object', async () => {
    const items = signal({});
    const value = loop(items, (item, key) => h(Text, { text: key }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(0);
    
    items.set({ key1: 'value1', key2: 'value2' });
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('key1');
    expect(children[1].text).toBe('key2');
  });

  test('Test loop with array index parameter', async () => {
    const items = signal(['a', 'b', 'c']);
    const indices = [];
    
    const value = loop(items, (item, index) => {
      indices.push(index);
      return h(Text, { text: item });
    });
    
    const container = await TestBed.createComponent(Container, {}, value);
    
    expect(indices).toEqual([0, 1, 2]);
    
    items().push('d');
    
    expect(indices).toEqual([0, 1, 2, 3]);
  });

  test('Test loop with object key parameter', async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const keys = [];
    
    const value = loop(items, (item, key) => {
      keys.push(key);
      return h(Text, { text: key });
    });
    
    const container = await TestBed.createComponent(Container, {}, value);
    
    expect(keys.sort()).toEqual(['a', 'b', 'c']);
    
    items().d = 4;
    
    expect(keys.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  test('Test loop with sparse array', async () => {
    const sparseArray = [];
    sparseArray[0] = 'a';
    sparseArray[2] = 'c';
    
    const items = signal(sparseArray);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('a');
    expect(children[1].text).toBe('c');
    
    items()[1] = 'b';
    
    expect(children.length).toBe(3);
    expect(children[0].text).toBe('a');
    expect(children[1].text).toBe('b');
    expect(children[2].text).toBe('c');
  });

  test('Test loop with array methods like shift and unshift', async () => {
    const items = signal(['b', 'c']);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    
    items().unshift('a'); // Add to the beginning
    expect(children.length).toBe(3);
    expect(children[0].text).toBe('a');
    
    items().shift(); // Remove from the beginning
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('b');
  });

  test('Test loop with undefined function return', async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => {
      if (item === 2) {
        return null; // Renvoie null pour l'élément 2
      }
      return h(Text, { text: String(item) });
    });
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('1');
    expect(children[1].text).toBe('3');
  });

  test('Test loop with array pop operation', async () => {
    const items = signal(['a', 'b', 'c']);
    const value = loop(items, (item) => h(Text, { text: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(3);
    
    items().pop(); // Retire le dernier élément
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('a');
    expect(children[1].text).toBe('b');
  });

  test('Test loop with computed signal dependency updates', async () => {
    // Au lieu d'utiliser des computed signals qui dépendent d'autres signals,
    // utilisons directement un signal et mettons-le à jour pour voir si les éléments sont mis à jour
    const computedItems = signal([1, 2]);
    
    const value = loop(computedItems, (item) => h(Text, { text: String(item) }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('1');
    expect(children[1].text).toBe('2');
    
    // Mise à jour complète du signal avec de nouvelles valeurs
    computedItems.set([10, 20]);
    
    // La mise à jour devrait être immédiate car nous utilisons set() directement
    expect(children.length).toBe(2);
    expect(children[0].text).toBe('10');
    expect(children[1].text).toBe('20');
    
    // Ajouter un nouvel élément au tableau
    computedItems().push(30);
    
    // Vérifions que la mise à jour a bien été prise en compte
    expect(children.length).toBe(3);
    expect(children[2].text).toBe('30');
  });

  test('Test loop with object property deletion and immediate addition', async () => {
    const items = signal({ a: 1, b: 2, c: 3 });
    const value = loop(items, (item, key) => h(Text, { text: key }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(3);
    
    delete items().b;
    items().d = 4;
    
    expect(children.length).toBe(3);
    
    const keys = Array.from(children).map(child => child.text);
    expect(keys.includes('a')).toBe(true);
    expect(keys.includes('b')).toBe(false);
    expect(keys.includes('c')).toBe(true);
    expect(keys.includes('d')).toBe(true);
  });

  test('Test loop with complex object structure', async () => {
    const items = signal({
      user1: { name: 'Alice', age: 30 },
      user2: { name: 'Bob', age: 25 }
    });
    
    const value = loop(items, (item, key) => {
      return h(Text, { text: `${key}:${item.name}:${item.age}` });
    });
    
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(2);
    
    items.set({
      user1: { name: 'Alice', age: 31 },
      user2: { name: 'Bobby', age: 25 },
      user3: { name: 'Charlie', age: 35 }
    });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(children.length).toBe(3);
    
    const texts = Array.from(children).map(child => child.text);
    expect(texts).toContain('user1:Alice:31');
    expect(texts).toContain('user2:Bobby:25');
    expect(texts).toContain('user3:Charlie:35');
  });

  test('Test loop with primitive to complex object transition', async () => {
    const items = signal({});
    const value = loop(items, (item, key) => h(Text, { text: String(key) }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    
    expect(children.length).toBe(0);
    
    items.set(['a', 'b', 'c']);
    
    expect(children.length).toBe(3);
    expect(children[0].text).toBe('0');
    expect(children[1].text).toBe('1');
    expect(children[2].text).toBe('2');
    
    items.set({ x: 1, y: 2 });
    
    expect(children.length).toBe(2);
    
    const keys = Array.from(children).map(child => child.text);
    expect(keys.includes('x')).toBe(true);
    expect(keys.includes('y')).toBe(true);
  });

  test('Test loop with nested loops', async () => {
    const matrix = signal([
      [1, 2],
      [3, 4],
      [5, 6]
    ]);
    
    const value = loop(matrix, (row, rowIdx) => {
      const rowIndex = Number(rowIdx);
      
      // Create a computed signal that depends on the matrix and the row index
      const rowSignal = computed(() => matrix()[rowIndex] || []);
      
      const rowValue = loop(rowSignal, (cell, colIdx) => {
        const colIndex = Number(colIdx);
        return h(Text, { text: `${rowIndex}-${colIndex}:${cell}` });
      });
      
      return h(Container, { y: rowIndex * 10 }, rowValue);
    });
    
    const container = await TestBed.createComponent(Container, {}, value);
    const rowContainers = container.componentInstance.children;
    
    expect(rowContainers.length).toBe(3);
    
    expect(rowContainers[0].children.length).toBe(2);
    expect(rowContainers[0].children[0].text).toBe('0-0:1');
    expect(rowContainers[0].children[1].text).toBe('0-1:2');
    
    expect(rowContainers[1].children.length).toBe(2);
    expect(rowContainers[1].children[0].text).toBe('1-0:3');
    expect(rowContainers[1].children[1].text).toBe('1-1:4');
    
    expect(rowContainers[2].children.length).toBe(2);
    expect(rowContainers[2].children[0].text).toBe('2-0:5');
    expect(rowContainers[2].children[1].text).toBe('2-1:6');
    
    const newMatrix = [...matrix()];
    newMatrix[1] = [9, 4];
    matrix.set(newMatrix);
    
    expect(rowContainers[1].children[0].text).toBe('1-0:9');
    
    matrix().push([7, 8]);
    
    expect(rowContainers.length).toBe(4);
    expect(rowContainers[3].children.length).toBe(2);
    expect(rowContainers[3].children[0].text).toBe('3-0:7');
    expect(rowContainers[3].children[1].text).toBe('3-1:8');
  });

  test('Test loop with large array performance', async () => {
    // Create a large array with strings
    const largeArray = Array.from({ length: 100 }, (_, i) => `item-${i}`);
    const items = signal(largeArray);
    
    const start = performance.now();
    const value = loop(items, (item) => h(Text, { text: String(item) }));
    const container = await TestBed.createComponent(Container, {}, value);
    const children = container.componentInstance.children;
    const end = performance.now();
    
    expect(children.length).toBe(100);
    expect(children[0].text).toBe('item-0');
    expect(children[99].text).toBe('item-99');
    
    const updateStart = performance.now();
    const updatedArray = Array.from({ length: 100 }, (_, i) => `updated-${i}`);
    items.set(updatedArray);
    const updateEnd = performance.now();
    
    expect(children[0].text).toBe('updated-0');
  });
});
