declare module '*.ce' {
    const content: import("./dist/index").ComponentFunction;
    export default content;
}