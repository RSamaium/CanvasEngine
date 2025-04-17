import { effect, isSignal, signal } from '@signe/reactive';
import { Container, Rectangle, Point, FederatedPointerEvent } from 'pixi.js';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { snap } from 'popmotion';
import { addContext } from '../hooks/addContext';
import { Subscription } from 'rxjs';
import { useProps } from '../hooks/useProps';

export class Drop extends Directive {
    private elementRef: Element<Container> | null = null;

    onInit(element: Element<Container>) {
        this.elementRef = element;
    }

    onMount(element: Element<Container>) {
        addContext(element, 'drop', element);
    }

    onUpdate() {}

    onDestroy() {
        this.elementRef = null;
    }
}

export class Drag extends Directive {
    private elementRef: Element<Container> | null = null;
    private stageRef: Container | null = null;
    private offsetInParent = new Point();
    private isDragging = false;
    private viewport: any | null = null;
    private animationFrameId: number | null = null;
    private lastPointerPosition: Point = new Point();

    private onDragMoveHandler: (event: FederatedPointerEvent) => void = () => {};
    private onDragEndHandler: () => void = () => {};
    private onDragStartHandler: (event: FederatedPointerEvent) => void = () => {};

    private subscriptions: Subscription[] = [];

    onInit(element: Element<Container>) {
        this.elementRef = element;
        this.onDragMoveHandler = this.onDragMove.bind(this);
        this.onDragEndHandler = this.onDragEnd.bind(this);
        this.onDragStartHandler = this.onPointerDown.bind(this);
    }

    onMount(element: Element<Container>) {
        const { rootElement, canvasSize, viewport, tick } = element.props.context;
        const instance = element.componentInstance;
        const dragProps = this.dragProps;
        const haveNotProps = Object.keys(dragProps).length === 0;

        if (haveNotProps) {
            this.onDestroy();
            return;
        }
        
        if (!instance) return;
        this.stageRef = rootElement.componentInstance;
        if (!this.stageRef) return;
        this.viewport = viewport;

        instance.eventMode = 'static';
        this.stageRef.eventMode = 'static';

        const _effect = effect(() => {
            if (this.stageRef) {
                this.stageRef.hitArea = new Rectangle(0, 0, canvasSize().width, canvasSize().height);
            }
        });

        instance.on('pointerdown', this.onDragStartHandler);
        this.stageRef.on('pointerup', this.onDragEndHandler);
        this.stageRef.on('pointerupoutside', this.onDragEndHandler);

        this.subscriptions = [
            tick.observable.subscribe(() => {
                if (this.isDragging && this.viewport) {
                    this.updateViewportPosition(this.lastPointerPosition);
                }
            }),
            _effect.subscription
        ]
    }

    get dragProps() {
        const drag = this.elementRef?.props.drag
        const options = useProps(drag?.value ?? drag, {
            snap: 0,
            viewport: {},
            direction: 'all'
        });
        options.viewport = useProps(options.viewport, {
            edgeThreshold: 300,
            maxSpeed: 40
        });
        return options;
    }

    get axis() {
        const direction = this.dragProps.direction();
        const axis = {
            x: true,
            y: true,
        }
        if (direction === 'x') {
            axis.y = false;
        }
        if (direction === 'y') {
            axis.x = false;
        }
        return axis;
    }

    /**
     * Updates element position when dragging and starts continuous viewport movement
     * @param event The pointer event that triggered the drag move
     */
    private onDragMove(event: FederatedPointerEvent) {
        if (!this.isDragging || !this.elementRef?.componentInstance || !this.elementRef.componentInstance.parent) return;

        const instance = this.elementRef.componentInstance;
        const parent = instance.parent;
        const dragProps = this.dragProps;
        const propObservables = this.elementRef.propObservables;
        const snapTo = snap(dragProps?.snap() ?? 0);

        dragProps?.move?.(event);

        const currentParentLocalPointer = parent.toLocal(event.global);

        const newX = currentParentLocalPointer.x - this.offsetInParent.x;
        const newY = currentParentLocalPointer.y - this.offsetInParent.y;

        if (dragProps?.snap()) {
            instance.position.x = snapTo(newX);
            instance.position.y = snapTo(newY);
        } else {
           if (this.axis.x) instance.position.x = newX;
           if (this.axis.y) instance.position.y = newY;
        }

        // Store the last pointer position for continuous viewport movement
        this.lastPointerPosition.copyFrom(event.global);

        const { x: xProp, y: yProp } = propObservables as any;
        if (xProp !== undefined && isSignal(xProp)) {
            // xProp.set(instance.position.x)
        }
        if (yProp !== undefined && isSignal(yProp)) {
            // yProp.set(instance.position.y)
        }
    }

    /**
     * Moves the viewport if the dragged element is near screen edges
     * @param globalPosition The global pointer position
     */
    private updateViewportPosition(globalPosition: Point) {
        if (!this.viewport || !this.elementRef) return;

        const dragProps = this.dragProps;
        const edgeThreshold = dragProps?.viewport?.edgeThreshold(); // Distance from edge to trigger viewport movement
        const maxSpeed = dragProps?.viewport?.maxSpeed(); // Maximum speed when element is at the very edge
        
        // Calculate screen boundaries
        const screenLeft = 0;
        const screenRight = this.viewport.screenWidth;
        const screenTop = 0;
        const screenBottom = this.viewport.screenHeight;
        const instance = this.elementRef.componentInstance;
        
        // Calculate distances from element to screen edges
        const distanceFromLeft = globalPosition.x - screenLeft;
        const distanceFromRight = screenRight - globalPosition.x;
        const distanceFromTop = globalPosition.y - screenTop;
        const distanceFromBottom = screenBottom - globalPosition.y;
        
        let moveX = 0;
        let moveY = 0;
        
        // Calculate horizontal movement with dynamic velocity
        if (distanceFromLeft < edgeThreshold) {
            // Velocity increases as distance decreases
            // When distance = 0, velocity = maxSpeed
            // When distance = threshold, velocity = 0
            const velocity = maxSpeed * (1 - (distanceFromLeft / edgeThreshold));
            moveX = -velocity;
        } else if (distanceFromRight < edgeThreshold) {
            const velocity = maxSpeed * (1 - (distanceFromRight / edgeThreshold));
            moveX = velocity;
        }
        
        // Calculate vertical movement with dynamic velocity
        if (distanceFromTop < edgeThreshold) {
            const velocity = maxSpeed * (1 - (distanceFromTop / edgeThreshold));
            moveY = -velocity;
        } else if (distanceFromBottom < edgeThreshold) {
            const velocity = maxSpeed * (1 - (distanceFromBottom / edgeThreshold));
            moveY = velocity;
        }
        
        // Apply movement with velocity-based displacement
        if (moveX !== 0 || moveY !== 0) {
            const lastViewValue = this.viewport.center;
            this.viewport.moveCenter(
                this.viewport.center.x + moveX,
                this.viewport.center.y + moveY
            );
            if (this.axis.x && lastViewValue.x !== this.viewport.center.x) {
                instance.position.x += moveX;
            }
            if (this.axis.y && lastViewValue.y !== this.viewport.center.y) {
                instance.position.y += moveY;
            }
        }
    }

    /**
     * Handles drag end event and stops viewport movement
     */
    private onDragEnd() {
        if (!this.isDragging || !this.elementRef) return;

        const dragProps = this.dragProps;
        this.isDragging = false;
        dragProps?.end?.();
        
        if (this.stageRef) {
            this.stageRef.off('pointermove', this.onDragMoveHandler);
        }
    }

    private onPointerDown(event: FederatedPointerEvent) {
        if (!this.elementRef?.componentInstance || !this.stageRef || !this.elementRef.componentInstance.parent) return;

        const instance = this.elementRef.componentInstance;
        const parent = instance.parent;
        const dragProps = this.dragProps;

        const parentLocalPointer = parent.toLocal(event.global);

        this.offsetInParent.x = parentLocalPointer.x - instance.position.x;
        this.offsetInParent.y = parentLocalPointer.y - instance.position.y;

        this.isDragging = true;
        
        // Store initial pointer position
        this.lastPointerPosition.copyFrom(event.global);
        
        dragProps?.start?.();
        this.stageRef.on('pointermove', this.onDragMoveHandler);
    }

    onUpdate(props) {
       if (props.type && props.type === 'reset') {
        this.onDestroy();
        this.onMount(this.elementRef);
       }
    }

    onDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        const instance = this.elementRef?.componentInstance;
        if (instance) {
            instance.off('pointerdown', this.onDragStartHandler);
        }
        if (this.stageRef) {
            this.stageRef.off('pointermove', this.onDragMoveHandler);
            this.stageRef.off('pointerup', this.onDragEndHandler);
            this.stageRef.off('pointerupoutside', this.onDragEndHandler);
        }
        this.stageRef = null;
        this.viewport = null;
    }
}

registerDirective('drag', Drag);
registerDirective('drop', Drop);