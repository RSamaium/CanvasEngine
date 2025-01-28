import { loop, Container, h, signal, Text, computed } from "canvasengine";
import { describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";

describe("loop with array", () => {
  test(`Test loop with initial items`, async () => {
    const items = signal([1, 2, 3]);
    const value = loop(items, (item) => h(Container, { x: item }));
    const container = await TestBed.createComponent(Container, {}, value);
    expect(container.componentInstance.children.length).toBe(3);
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
});
