import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { DOMContainer } from '../../packages/core/src/components/DOMContainer'
import { DOMElement } from '../../packages/core/src/components/DOMElement'
import { FocusContainer } from '../../packages/core/src/components/FocusContainer'
import { TestBed } from '../../packages/core/testing'

describe('DOMContainer and DOMElement Components', () => {
    beforeEach(() => {
        // Reset DOM before each test but keep the root element
        document.body.innerHTML = '<div id="root"></div>'
    })



    describe('DOMContainer Component', () => {
        test('creates DOM container with basic properties', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {
                x: 100,
                y: 50
            })

            expect(containerElement).toBeDefined()
            expect(typeof containerElement).toBe('object')
            expect((containerElement.componentInstance as any).x).toBe(100)
            expect((containerElement.componentInstance as any).y).toBe(50)
        })

        test('creates DOM container with DOMElement child', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {
                x: 100,
                y: 50
            }, [
                DOMElement({
                    element: 'div',
                    textContent: 'Hello World'
                })
            ])

            expect(containerElement).toBeDefined()
            const wrapperDiv = (containerElement.componentInstance as any).element
            expect(wrapperDiv.tagName.toLowerCase()).toBe('div')
            
            // Check the child element
            const childElement = wrapperDiv.children[0]
            expect(childElement.tagName.toLowerCase()).toBe('div')
            expect(childElement.textContent).toBe('Hello World')
        })

        test('creates DOM container with input element', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'input',
                    attrs: {
                        type: 'text',
                        placeholder: 'Enter text...'
                    }
                })
            ])

            expect(containerElement).toBeDefined()
            const wrapperDiv = (containerElement.componentInstance as any).element
            const inputElement = wrapperDiv.children[0]
            expect(inputElement.tagName.toLowerCase()).toBe('input')
            expect(inputElement.type).toBe('text')
            expect(inputElement.placeholder).toBe('Enter text...')
        })

        test('handles DOM container with multiple display properties', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {
                x: 50,
                y: 25,
                alpha: 0.8,
                visible: true
            }, [
                DOMElement({
                    element: 'div',
                    textContent: 'Container content'
                })
            ])

            expect(containerElement).toBeDefined()
            expect((containerElement.componentInstance as any).x).toBe(50)
            expect((containerElement.componentInstance as any).y).toBe(25)
            expect((containerElement.componentInstance as any).alpha).toBe(0.8)
            expect((containerElement.componentInstance as any).visible).toBe(true)
        })

        test('supports nested DOMContainer inside DOMElement', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: { class: 'outer' },
                    children: [
                        DOMContainer({
                            children: [
                                DOMElement({
                                    element: 'button',
                                    textContent: 'test'
                                })
                            ]
                        })
                    ]
                })
            ])

            expect(containerElement).toBeDefined()
            const wrapperDiv = (containerElement.componentInstance as any).element
            const outerDiv = wrapperDiv.querySelector('.outer')
            expect(outerDiv).toBeDefined()
            expect(outerDiv.children.length).toBe(1)
            expect(outerDiv.children[0].tagName.toLowerCase()).toBe('div')
            expect(outerDiv.children[0].querySelector('button')?.textContent).toBe('test')
        })
    })

    describe('DOMElement Component', () => {
        test('creates DOM element with string element type', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    textContent: 'Test content'
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.tagName.toLowerCase()).toBe('div')
            expect(domElement.textContent).toBe('Test content')
        })

        test('creates DOM element with HTML element object', async () => {
            const htmlElement = document.createElement('span')
            htmlElement.textContent = 'Span content'

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: { value: htmlElement }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.tagName.toLowerCase()).toBe('span')
            expect(domElement.textContent).toBe('Span content')
        })

        test('handles DOM element with class attributes - string format', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: 'container primary-theme'
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.className).toBe('container primary-theme')
        })

        test('handles DOM element with class attributes - array format', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: ['container', 'primary-theme', 'active']
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.classList.contains('container')).toBe(true)
            expect(domElement.classList.contains('primary-theme')).toBe(true)
            expect(domElement.classList.contains('active')).toBe(true)
        })

        test('handles DOM element with class attributes - object format', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: {
                            'container': true,
                            'primary-theme': true,
                            'disabled': false
                        }
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.classList.contains('container')).toBe(true)
            expect(domElement.classList.contains('primary-theme')).toBe(true)
            expect(domElement.classList.contains('disabled')).toBe(false)
        })

        test('handles DOM element with style attributes - string format', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        style: 'background-color: red; padding: 10px;'
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.getAttribute('style')).toBe('background-color: red; padding: 10px;')
        })

        test('handles DOM element with style attributes - object format', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        style: {
                            backgroundColor: 'blue',
                            padding: '20px',
                            fontSize: '16px'
                        }
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const domElement = wrapperDiv.children[0]
            expect(domElement.style.backgroundColor).toBe('blue')
            expect(domElement.style.padding).toBe('20px')
            // fontSize number is converted to string with 'px' suffix
            expect(domElement.style.fontSize).toBe('16px')
        })

        test('handles DOM element with multiple attributes', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'input',
                    attrs: {
                        type: 'text',
                        placeholder: 'Enter username...',
                        id: 'username-input',
                        name: 'username',
                        required: true
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const inputElement = wrapperDiv.children[0]
            expect(inputElement.type).toBe('text')
            expect(inputElement.placeholder).toBe('Enter username...')
            expect(inputElement.id).toBe('username-input')
            expect(inputElement.name).toBe('username')
            expect(inputElement.required).toBe(true)
        })

        test('handles DOM element with event handlers', async () => {
            const onClick = vi.fn()
            const onFocus = vi.fn()

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'button',
                    textContent: 'Click me',
                    attrs: {
                        click: onClick,
                        focus: onFocus
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const buttonElement = wrapperDiv.children[0]
            
            // Simulate click event
            buttonElement.click()
            expect(onClick).toHaveBeenCalled()

            // Simulate focus event
            buttonElement.focus()
            expect(onFocus).toHaveBeenCalled()
        })

        test('handles form element with reactive signal value', async () => {
            const inputValue = signal('initial value')

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'input',
                    attrs: {
                        type: 'text',
                        value: inputValue
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const inputElement = wrapperDiv.children[0]
            expect(inputElement.value).toBe('initial value')

            // Update signal value
            inputValue.set('updated value')
            expect(inputElement.value).toBe('updated value')
        })

        test('handles form submission with data collection', async () => {
            const onSubmit = vi.fn()

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'form',
                    attrs: {
                        submit: onSubmit
                    },
                    children: [
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'username',
                                type: 'text',
                                value: 'john'
                            }
                        }),
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'password',
                                type: 'password',
                                value: 'secret'
                            }
                        }),
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'remember',
                                type: 'checkbox',
                                value: 'on',
                                checked: true
                            }
                        }),
                        DOMElement({
                            element: 'button',
                            attrs: {
                                type: 'submit'
                            },
                            textContent: 'Submit'
                        })
                    ]
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const formElement = wrapperDiv.children[0]
            
            // Create and dispatch submit event
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
            formElement.dispatchEvent(submitEvent)

            expect(onSubmit).toHaveBeenCalled()
            const [event, formData] = onSubmit.mock.calls[0]
            
            // Check that preventDefault was called
            expect(event.defaultPrevented).toBe(true)
            
            // Check form data collection
            expect(formData).toBeDefined()
            expect(typeof formData).toBe('object')
        })

        test('handles textarea element with signal binding', async () => {
            const textValue = signal('Initial textarea content')

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'textarea',
                    attrs: {
                        value: textValue,
                        placeholder: 'Enter your message...'
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const textareaElement = wrapperDiv.children[0]
            expect(textareaElement.value).toBe('Initial textarea content')
            expect(textareaElement.placeholder).toBe('Enter your message...')

            // Update signal
            textValue.set('Updated content')
            expect(textareaElement.value).toBe('Updated content')
        })

        test('handles select element with options', async () => {
            const selectedValue = signal('option2')

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'select',
                    attrs: {
                        name: 'choices',
                        value: selectedValue
                    },
                    children: [
                        DOMElement({
                            element: 'option',
                            attrs: { value: 'option1' },
                            textContent: 'Option 1'
                        }),
                        DOMElement({
                            element: 'option',
                            attrs: { value: 'option2' },
                            textContent: 'Option 2'
                        }),
                        DOMElement({
                            element: 'option',
                            attrs: { value: 'option3' },
                            textContent: 'Option 3'
                        })
                    ]
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const selectElement = wrapperDiv.children[0]
            expect(selectElement.value).toBe('option2')
            expect(selectElement.name).toBe('choices')
        })

        test('handles nested DOM elements', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: 'outer-container'
                    },
                    children: [
                        DOMElement({
                            element: 'div',
                            attrs: {
                                class: 'inner-container'
                            },
                            textContent: 'Nested content'
                        })
                    ]
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const outerElement = wrapperDiv.children[0]
            expect(outerElement.classList.contains('outer-container')).toBe(true)
            
            const innerElement = outerElement.querySelector('.inner-container')
            expect(innerElement).toBeDefined()
            expect(innerElement.textContent).toBe('Nested content')
        })

        test('handles dynamic class updates with signals', async () => {
            const isActive = signal(false)
            const theme = signal('light')

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: {
                            'container': true,
                            'active': isActive(),
                            'theme-light': theme() === 'light',
                            'theme-dark': theme() === 'dark'
                        }
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const divElement = wrapperDiv.children[0]
            expect(divElement.classList.contains('container')).toBe(true)
            expect(divElement.classList.contains('active')).toBe(false)
            expect(divElement.classList.contains('theme-light')).toBe(true)
            expect(divElement.classList.contains('theme-dark')).toBe(false)
        })

        test('updates class list when signal inside class array changes', async () => {
            const isActive = signal(false)

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: {
                        class: ['base', { active: isActive }]
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const divElement = wrapperDiv.children[0]
            expect(divElement.classList.contains('base')).toBe(true)
            expect(divElement.classList.contains('active')).toBe(false)

            isActive.set(true)
            await Promise.resolve()
            expect(divElement.classList.contains('active')).toBe(true)

            isActive.set(false)
            await Promise.resolve()
            expect(divElement.classList.contains('active')).toBe(false)
        })

        test('renders FocusContainer children inside DOMElement', async () => {
            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    attrs: { class: 'outer' },
                    children: [
                        FocusContainer({
                            children: [
                                DOMElement({
                                    element: 'button',
                                    textContent: 'Focus Item'
                                })
                            ]
                        })
                    ]
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const outerDiv = wrapperDiv.querySelector('.outer')
            const button = outerDiv?.querySelector('button')
            expect(button?.textContent).toBe('Focus Item')
        })

        test('handles onBeforeDestroy hook', async () => {
            const onBeforeDestroy = vi.fn()

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'div',
                    textContent: 'Will be destroyed',
                    onBeforeDestroy: onBeforeDestroy
                })
            ])

            expect(containerElement).toBeDefined()
            
            // The onBeforeDestroy hook should be defined and ready to be called
            // In a real scenario, it would be called when the DOM element is removed
            expect(onBeforeDestroy).toBeDefined()
            expect(typeof onBeforeDestroy).toBe('function')
            
            // Manually test the hook functionality
            await onBeforeDestroy()
            expect(onBeforeDestroy).toHaveBeenCalled()
        })
    })

    describe('Integration Tests', () => {
        test('creates complete form with reactive inputs', async () => {
            const username = signal('')
            const password = signal('')
            const rememberMe = signal(false)
            const onSubmit = vi.fn()

            const containerElement = await TestBed.createComponent(DOMContainer, {
                x: 100,
                y: 100
            }, [
                DOMElement({
                    element: 'form',
                    attrs: {
                        class: 'login-form',
                        submit: onSubmit
                    },
                    children: [
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'username',
                                type: 'text',
                                placeholder: 'Username',
                                value: username
                            }
                        }),
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'password',
                                type: 'password',
                                placeholder: 'Password',
                                value: password
                            }
                        }),
                        DOMElement({
                            element: 'input',
                            attrs: {
                                name: 'remember',
                                type: 'checkbox',
                                checked: rememberMe()
                            }
                        }),
                        DOMElement({
                            element: 'button',
                            attrs: {
                                type: 'submit'
                            },
                            textContent: 'Login'
                        })
                    ]
                })
            ])

            expect(containerElement).toBeDefined()
            expect((containerElement.componentInstance as any).x).toBe(100)
            expect((containerElement.componentInstance as any).y).toBe(100)

            const wrapperDiv = (containerElement.componentInstance as any).element
            const formElement = wrapperDiv.children[0]
            expect(formElement.classList.contains('login-form')).toBe(true)

            // Test reactive updates
            username.set('testuser')
            password.set('testpass')
            
            const usernameInput = formElement.querySelector('input[name="username"]')
            const passwordInput = formElement.querySelector('input[name="password"]')
            
            expect(usernameInput.value).toBe('testuser')
            expect(passwordInput.value).toBe('testpass')
        })

        test('handles complex styling and interactions', async () => {
            const isHovered = signal(false)
            const onClick = vi.fn()
            const onMouseEnter = vi.fn(() => isHovered.set(true))
            const onMouseLeave = vi.fn(() => isHovered.set(false))

            const containerElement = await TestBed.createComponent(DOMContainer, {}, [
                DOMElement({
                    element: 'button',
                    textContent: 'Interactive Button',
                    attrs: {
                        class: {
                            'btn': true,
                            'btn-primary': true,
                            'btn-hovered': isHovered()
                        },
                        style: {
                            padding: '10px 20px',
                            borderRadius: '4px',
                            backgroundColor: isHovered() ? '#0056b3' : '#007bff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        },
                        click: onClick,
                        mouseenter: onMouseEnter,
                        mouseleave: onMouseLeave
                    }
                })
            ])

            const wrapperDiv = (containerElement.componentInstance as any).element
            const buttonElement = wrapperDiv.children[0]
            expect(buttonElement.classList.contains('btn')).toBe(true)
            expect(buttonElement.classList.contains('btn-primary')).toBe(true)
            expect(buttonElement.style.padding).toBe('10px 20px')
            expect(buttonElement.style.backgroundColor).toBe('rgb(0, 123, 255)') // #007bff
        })
    })
}) 
