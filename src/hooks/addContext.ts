export const addContext = (element, key, value) => {
    element.props.context = {
        ...(element.props.context ?? {}),
        [key]: value
    }
}