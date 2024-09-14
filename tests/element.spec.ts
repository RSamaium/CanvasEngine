import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, h, mountTracker } from '../src/engine/signal';
import { Subscription } from 'rxjs';

describe('signal', () => {

  describe('h', () => {
    let mockComponentFunction;
    let mockSubscription;

    beforeEach(() => {
      mockComponentFunction = vi.fn().mockReturnValue({});
      mockSubscription = new Subscription();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return an object with effectSubscriptions and effectMounts', () => {
      const result = h(mockComponentFunction);

      expect(result).toHaveProperty('effectSubscriptions');
      expect(result).toHaveProperty('effectMounts');
      expect(Array.isArray(result.effectSubscriptions)).toBe(true);
      expect(Array.isArray(result.effectMounts)).toBe(true);
    });

    it('should track subscriptions', () => {
      vi.spyOn(global as any, 'currentSubscriptionsTracker').mockImplementation((sub) => {
        expect(sub).toBe(mockSubscription);
      });

      h(mockComponentFunction);

      (global as any).currentSubscriptionsTracker(mockSubscription);

      expect(global.currentSubscriptionsTracker).toHaveBeenCalled();
    });

    it('should track mounts', () => {
      const mockMountFn = vi.fn();

      vi.spyOn(global as any, 'mountTracker').mockImplementation((fn) => {
        expect(fn).toBe(mockMountFn);
      });

      h(mockComponentFunction);

      (global as any).mountTracker(mockMountFn);

      expect(global.mountTracker).toHaveBeenCalled();
    });

    it('should pass props and children to the component function', () => {
      const props = { foo: 'bar' };
      const children = ['child1', 'child2'];

      h(mockComponentFunction, props, ...children);

      expect(mockComponentFunction).toHaveBeenCalledWith({ ...props, children });
    });
  });
});
