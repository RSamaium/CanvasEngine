# Agent Guidelines

## Every public API must be documented

Any change that adds or modifies a public API ships with its documentation in the same change. A public API is anything a user can import or write in a template: components, their props and events, directives, hooks, presets, exported functions and types, and package entry points (for example `@canvasengine/3d`).

### Where

- Pages live in `docs/`, one page per component or feature, in the folder of its section: `docs/components/`, `docs/directives/`, `docs/presets/`, `docs/3d/`, `docs/api/`...
- Add each new page to the sidebar in `docs/.vitepress/config.ts`. A new section also needs its path in the `sidebar` map at the bottom of that file.
- Exported functions, classes and props interfaces also get JSDoc comments in the source, with an `@example`.

### What a page contains

1. What the API is for, in one or two sentences.
2. A **Basic Usage** example that works when copied as is (imports included).
3. A **Properties** table: every prop, its type, its default value and what it does.
4. Examples of the common use cases.
5. The pitfalls a user can hit, in `::: warning` or `::: tip` blocks.

Write the documentation in English, like the rest of the repository.

### Keep it accurate

- Check every example against the code: prop names, types, default values. Run it in the playground (`sample/`) when it shows behavior.
- When a prop or behavior changes, update its page in the same change. When an API is removed, remove or rewrite its documentation.
- Check that internal links and anchors resolve, then run the docs server (`.claude/launch.json`, configuration `docs`) to see that the pages render.
