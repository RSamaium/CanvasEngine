import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  createMockElement,
  createMockComponentInstance,
  spyOnElement,
  spyOnElementMultiple,
  MockContainer,
  MockSprite,
  MockText,
} from '@canvasengine/testing';

/**
 * Example test file demonstrating how to use @canvasengine/testing
 * 
 * This file shows various ways to use the testing package to test
 * CanvasEngine components without requiring a full PixiJS environment.
 */

describe('Testing Package Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Mock Elements', () => {
    test('should create a basic mock element', () => {
      const element = createMockElement('Container', {
        x: 100,
        y: 50,
        width: 200,
        height: 150,
      });

      expect(element.tag).toBe('Container');
      expect(element.props.x).toBe(100);
      expect(element.props.y).toBe(50);
      expect(element.componentInstance.x).toBe(100);
      expect(element.componentInstance.y).toBe(50);
    });

    test('should create element with custom componentInstance', () => {
      const customSprite = new MockSprite();
      customSprite.x = 200;
      customSprite.y = 300;

      const element = createMockElement('Sprite', { image: 'hero.png' }, customSprite);

      expect(element.componentInstance).toBe(customSprite);
      expect(element.componentInstance.x).toBe(200);
      expect(element.componentInstance.y).toBe(300);
    });

    test('should create element with all required properties', () => {
      const element = createMockElement('Container');

      expect(element).toHaveProperty('tag');
      expect(element).toHaveProperty('props');
      expect(element).toHaveProperty('componentInstance');
      expect(element).toHaveProperty('propSubscriptions');
      expect(element).toHaveProperty('effectSubscriptions');
      expect(element).toHaveProperty('directives');
      expect(element).toHaveProperty('destroy');
      expect(element).toHaveProperty('allElements');
      expect(element).toHaveProperty('isFrozen');
    });
  });

  describe('Using PixiJS Mocks', () => {
    test('should create and manipulate MockContainer', () => {
      const container = new MockContainer();
      container.x = 100;
      container.y = 50;
      container.width = 200;
      container.height = 150;

      expect(container.x).toBe(100);
      expect(container.y).toBe(50);
      expect(container.width).toBe(200);
      expect(container.height).toBe(150);
    });

    test('should add and remove children from MockContainer', () => {
      const parent = new MockContainer();
      const child1 = new MockSprite();
      const child2 = new MockText();

      parent.addChild(child1);
      parent.addChild(child2);

      expect(parent.children).toHaveLength(2);
      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
      expect(child1.parent).toBe(parent);
      expect(child2.parent).toBe(parent);

      parent.removeChild(child1);
      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBe(child2);
      expect(child1.parent).toBeNull();
    });

    test('should handle events on MockContainer', () => {
      const container = new MockContainer();
      const clickHandler = vi.fn();

      container.on('click', clickHandler);
      container.emit('click', { x: 100, y: 100 });

      expect(clickHandler).toHaveBeenCalledWith({ x: 100, y: 100 });
    });
  });

  describe('Spying on Elements', () => {
    test('should spy on componentInstance methods', () => {
      const element = createMockElement('Container');
      const addChildSpy = spyOnElement(element, 'addChild');

      const child = new MockSprite();
      element.componentInstance.addChild(child);

      expect(addChildSpy).toHaveBeenCalledWith(child);
      expect(addChildSpy).toHaveBeenCalledTimes(1);
    });

    test('should spy on multiple methods at once', () => {
      const element = createMockElement('Container');
      const spies = spyOnElementMultiple(element, ['addChild', 'removeChild', 'destroy']);

      const child = new MockSprite();
      element.componentInstance.addChild(child);
      element.componentInstance.removeChild(child);
      element.componentInstance.destroy();

      expect(spies.addChild).toHaveBeenCalled();
      expect(spies.removeChild).toHaveBeenCalled();
      expect(spies.destroy).toHaveBeenCalled();
    });

    test('should verify method calls with spies', () => {
      const element = createMockElement('Container');
      const addChildSpy = spyOnElement(element, 'addChild');

      const child1 = new MockSprite();
      const child2 = new MockText();

      element.componentInstance.addChild(child1);
      element.componentInstance.addChild(child2);

      expect(addChildSpy).toHaveBeenCalledTimes(2);
      expect(addChildSpy).toHaveBeenNthCalledWith(1, child1);
      expect(addChildSpy).toHaveBeenNthCalledWith(2, child2);
    });
  });

  describe('Creating Mock Component Instances', () => {
    test('should create mock instance for Container', () => {
      const instance = createMockComponentInstance('Container');
      expect(instance).toBeInstanceOf(MockContainer);
    });

    test('should create mock instance for Sprite', () => {
      const instance = createMockComponentInstance('Sprite');
      expect(instance).toBeInstanceOf(MockSprite);
    });

    test('should create mock instance for Text', () => {
      const instance = createMockComponentInstance('Text');
      expect(instance).toBeInstanceOf(MockText);
    });

    test('should default to Container for unknown types', () => {
      const instance = createMockComponentInstance('UnknownType');
      expect(instance).toBeInstanceOf(MockContainer);
    });
  });

  describe('Real-world Testing Scenarios', () => {
    test('should test component position updates', () => {
      const element = createMockElement('Sprite', { x: 0, y: 0 });

      // Simulate position update
      element.componentInstance.x = 100;
      element.componentInstance.y = 50;

      expect(element.componentInstance.x).toBe(100);
      expect(element.componentInstance.y).toBe(50);
    });

    test('should test parent-child relationships', () => {
      const parent = createMockElement('Container');
      const child = createMockElement('Sprite');

      const addChildSpy = spyOnElement(parent, 'addChild');
      parent.componentInstance.addChild(child.componentInstance);

      expect(addChildSpy).toHaveBeenCalledWith(child.componentInstance);
      expect(parent.componentInstance.children).toContain(child.componentInstance);
      expect(child.componentInstance.parent).toBe(parent.componentInstance);
    });

    test('should test event handling', () => {
      const element = createMockElement('Sprite');
      const clickHandler = vi.fn();
      const mouseOverHandler = vi.fn();

      element.componentInstance.on('click', clickHandler);
      element.componentInstance.on('mouseover', mouseOverHandler);

      element.componentInstance.emit('click', { x: 100, y: 100 });
      element.componentInstance.emit('mouseover', { x: 50, y: 50 });

      expect(clickHandler).toHaveBeenCalledWith({ x: 100, y: 100 });
      expect(mouseOverHandler).toHaveBeenCalledWith({ x: 50, y: 50 });
    });

    test('should test element destruction', () => {
      const element = createMockElement('Container');
      const child1 = createMockElement('Sprite');
      const child2 = createMockElement('Text');

      element.componentInstance.addChild(child1.componentInstance);
      element.componentInstance.addChild(child2.componentInstance);

      const destroySpy = spyOnElement(element, 'destroy');
      element.componentInstance.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(element.componentInstance.destroyed).toBe(true);
      expect(element.componentInstance.children).toHaveLength(0);
    });

    test('should test multiple elements interaction', () => {
      const container = createMockElement('Container');
      const sprite1 = createMockElement('Sprite', { x: 10, y: 10 });
      const sprite2 = createMockElement('Sprite', { x: 20, y: 20 });

      container.componentInstance.addChild(sprite1.componentInstance);
      container.componentInstance.addChild(sprite2.componentInstance);

      expect(container.componentInstance.children).toHaveLength(2);
      expect(container.componentInstance.getChildAt(0)).toBe(sprite1.componentInstance);
      expect(container.componentInstance.getChildAt(1)).toBe(sprite2.componentInstance);
    });
  });

  describe('Element Properties and State', () => {
    test('should access and modify element properties', () => {
      const element = createMockElement('Container', {
        x: 100,
        y: 50,
        alpha: 0.5,
        visible: true,
      });

      expect(element.props.x).toBe(100);
      expect(element.props.y).toBe(50);
      expect(element.componentInstance.alpha).toBe(0.5);
      expect(element.componentInstance.visible).toBe(true);

      // Modify properties
      element.componentInstance.alpha = 0.8;
      element.componentInstance.visible = false;

      expect(element.componentInstance.alpha).toBe(0.8);
      expect(element.componentInstance.visible).toBe(false);
    });

    test('should test element freezing state', () => {
      const element = createMockElement('Container');
      
      expect(element.isFrozen).toBe(false);
      
      element.isFrozen = true;
      expect(element.isFrozen).toBe(true);
    });
  });
});
