export function isTiledFormat(val: any): boolean {
    return typeof val == 'object' && val.version && val.orientation
}
/**
 * Join path segments with forward slashes
 * @param {...string} segments - Path segments to join
 * @returns {string} Joined path
 * @example
 * joinPath('base', 'static', 'file.json') // returns 'base/static/file.json'
 */

export function joinPath(...segments: string[]): string {
    return segments
        .filter(segment => segment && segment.length > 0)
        .join('/')
        .replace(/\/+/g, '/') // Replace multiple slashes with single slash
}


export function getBaseName(path: string): string {
    return path.substring(0, path.lastIndexOf('/') + 1)
}