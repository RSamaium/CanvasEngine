import { isSignal, signal } from "@signe/reactive"
import { isPrimitive } from "../engine/reactive"
import { currentDefinePropsTracker } from "../engine/signal"
import { isTrigger } from "../engine/trigger"

/**
 * Converts props into reactive signals if they are primitive values.
 * 
 * @param {object} props - The properties to convert.
 * @param {object} [defaults={}] - Default values for properties.
 * @returns {object} An object with reactive signals.
 * 
 * @example
 * const props = useProps({ count: 0, name: "John" });
 * console.log(props.count()); // 0
 * props.count.set(1);
 * console.log(props.count()); // 1
 */
export const useProps = (props, defaults = {}): any => {
    if (isSignal(props)) {
        return props()
    }
    const obj = {}
    for (let key in props) {
        const value = props[key]
        obj[key] = isPrimitive(value) ? signal(value) : value
    }
    for (let key in defaults) {
        if (!(key in obj)) {
            obj[key] = isPrimitive(defaults[key]) ? signal(defaults[key]) : defaults[key]
        }
    }
    return obj
}

type PropType = NumberConstructor | StringConstructor | BooleanConstructor | 
                FunctionConstructor | ObjectConstructor | ArrayConstructor | 
                null | (new (...args: any[]) => any);

interface PropConfig {
    type?: PropType | PropType[];
    required?: boolean;
    default?: any | ((props: any) => any);
    validator?: (value: any, props: any) => boolean;
}

type PropSchema = {
    [key: string]: PropType | PropType[] | PropConfig;
}

const DEFINE_PROPS_CALLABLE_SIGNAL_VALUE = "__canvasEngineCallableSignalValue"

const createCallablePropSignal = (value: (...args: any[]) => any) => {
    const valueSignal: any = signal(value)
    const callable: any = (...args: any[]) => valueSignal()(...args)

    callable[DEFINE_PROPS_CALLABLE_SIGNAL_VALUE] = valueSignal
    callable.set = valueSignal.set
    callable.freeze = valueSignal.freeze
    callable.unfreeze = valueSignal.unfreeze
    callable.mutate = valueSignal.mutate
    callable.update = valueSignal.update
    callable.observable = valueSignal.observable
    callable._subject = valueSignal._subject

    Object.defineProperty(callable, "_isFrozen", {
        get: () => valueSignal._isFrozen,
        set: (value) => {
            valueSignal._isFrozen = value
        }
    })

    return callable
}

const toPropSignal = (value: any) => {
    if (isSignal(value) || isTrigger(value)) return value
    if (typeof value === 'function') return createCallablePropSignal(value)
    return signal(value)
}

const definePropSignals = (props: any): any => {
    const obj: any = {}
    for (let key in props) {
        obj[key] = toPropSignal(props[key])
    }
    return obj
}

/**
 * Validates and defines properties based on a schema.
 * 
 * @param {object} props - The properties to validate.
 * @returns {function} A function that takes a schema and returns validated properties.
 * 
 * @example
 * const schema = {
 *   age: { type: Number, required: true },
 *   name: { type: String, default: "Anonymous" }
 * };
 * const validatedProps = useDefineProps({ age: 25 })(schema);
 * console.log(validatedProps.age()); // 25
 * console.log(validatedProps.name()); // "Anonymous"
 */
export const useDefineProps = (props: any) => {
    return (schema?: PropSchema) => {
        const rawProps = isSignal(props) ? props() : props
        const validatedProps: { [key: string]: any } = {}

        for (const key in schema) {
            const propConfig = schema[key]
            const value = rawProps[key]
            let validatedValue: any

            // Handle simple type definition
            if (typeof propConfig === 'function') {
                validateType(key, value, [propConfig])
                validatedValue = value
            }
            // Handle array of types
            else if (Array.isArray(propConfig)) {
                validateType(key, value, propConfig)
                validatedValue = value
            }
            // Handle detailed configuration object
            else if (propConfig && typeof propConfig === 'object') {
                // Check required prop
                if (propConfig.required && value === undefined) {
                    throw new Error(`Missing required prop: ${key}`)
                }
                
                // Validate type if specified
                if (propConfig.type) {
                    const types = Array.isArray(propConfig.type) ? propConfig.type : [propConfig.type]
                    validateType(key, value, types)
                }
                
                // Run custom validator if provided
                if (propConfig.validator && !propConfig.validator(value, rawProps)) {
                    throw new Error(`Invalid prop: custom validation failed for prop "${key}"`)
                }
                
                // Set default value if value is undefined
                if (value === undefined && 'default' in propConfig) {
                    validatedValue = typeof propConfig.default === 'function' 
                        ? propConfig.default(rawProps)
                        : propConfig.default
                } else {
                    validatedValue = value
                }
            }

            validatedProps[key] = toPropSignal(validatedValue)
        }
        
        const definedProps = {
            ...definePropSignals(rawProps),
            ...validatedProps
        }
        currentDefinePropsTracker?.(definedProps)

        return definedProps
    }
}

const getRawProps = (props: any) => isSignal(props) ? props() : (props ?? {})

const getEmitHandler = (handler: any) => {
    if (handler?.[DEFINE_PROPS_CALLABLE_SIGNAL_VALUE]) return handler
    if (isSignal(handler)) return handler()
    return handler
}

/**
 * Defines event emitters from component props.
 *
 * @param {object} props - The raw component props containing event handlers.
 * @returns {function} A function returning named emit callbacks.
 *
 * @example
 * const { select } = useDefineEmits({ select: (item) => item.id })();
 * select({ id: 1 });
 */
export const useDefineEmits = (props: any) => {
    return () => new Proxy({}, {
        get(_target, key) {
            if (typeof key !== 'string') {
                return undefined
            }

            return (...args: any[]) => {
                const rawProps = getRawProps(props)
                const handler = getEmitHandler(rawProps[key])

                if (handler === undefined || handler === null) {
                    return undefined
                }

                if (typeof handler !== 'function') {
                    throw new Error(`Invalid emit handler: "${key}" must be a function`)
                }

                return handler(...args)
            }
        }
    })
}

/**
 * Validates the type of a property.
 * 
 * @param {string} key - The property key.
 * @param {any} value - The property value.
 * @param {any[]} types - The expected types.
 * @throws Will throw an error if the type check fails.
 */
function validateType(key: string, value: any, types: any[]) {
    if (value === undefined || value === null) return
    
    // Si c'est un signal, on vérifie la valeur du signal
    const valueToCheck = isSignal(value) ? value() : value
    
    const valid = types.some(type => {
        if (type === Number) return typeof valueToCheck === 'number'
        if (type === String) return typeof valueToCheck === 'string'
        if (type === Boolean) return typeof valueToCheck === 'boolean'
        if (type === Function) return typeof valueToCheck === 'function'
        if (type === Object) return typeof valueToCheck === 'object'
        if (type === Array) return Array.isArray(valueToCheck)
        if (type === null) return valueToCheck === null
        return valueToCheck instanceof type
    })
    
    if (!valid) {
        throw new Error(
            `Invalid prop: type check failed for prop "${key}". ` +
            `Expected ${types.map(t => t.name).join(' or ')}`
        )
    }
}
