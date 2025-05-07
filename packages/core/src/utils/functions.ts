export function isPercent(value?: string | number) {
    if (!value) return false
    if (typeof value === "string") {
        return value.endsWith("%")
    }
    return false
}