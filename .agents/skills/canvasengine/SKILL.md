---
name: canvasengine
description: Work on CanvasEngine projects and .ce components using the official documentation. Use when Codex needs to explain, create, review, or modify CanvasEngine code, especially files ending in .ce, CanvasEngine reactivity with signals, computed, and effect, template directives such as @if and @for, component script/template/style structure, or CanvasEngine-specific syntax that mixes ideas from React, Vue, and Angular.
---

# CanvasEngine Project

## Documentation First

Before answering or editing CanvasEngine code, fetch and read the current documentation index:

```bash
curl -L https://canvasengine.net/llms.txt
```

If `curl` is unavailable, use an equivalent command or tool (`wget`, browser/web fetch, or another HTTP client). If network access is blocked, say that the current documentation could not be fetched and proceed only from local code plus any already available docs.

Use `llms.txt` as a table of contents:

1. Read the summary and section list.
2. Identify the Markdown documentation URLs relevant to the user request.
3. Fetch the relevant `.md` pages with `curl -L <url>` or an equivalent tool.
4. Base implementation and explanations on those pages, not on assumptions from React, Vue, Angular, or PixiJS.
5. Mention the specific docs or examples consulted when the answer depends on them.

## Project Model

Treat CanvasEngine components as `.ce` files with:

- a script block for state, imports, functions, signals, `computed`, and `effect`
- component content/template markup
- an optional CSS style block

Prefer existing project conventions for file layout, imports, naming, and component composition. Inspect nearby `.ce` files before adding new patterns.

## Reactivity

CanvasEngine reactivity is centered on signals plus `computed` and `effect`.

Use the documentation to confirm exact APIs before writing code. Do not assume that signal usage is identical to Solid, Angular, Vue, React, or another framework.

Important template rules:

- In a template, `<Rect x />` means bind the `x` variable from the script scope. `x` may be a signal or a plain value. Do not interpret this as a boolean-only JSX prop.
- For reactive conditions, pass the signal/reference to the directive: use `@if (show)`, not `@if (show())`.
- For reactive loops, pass the signal/reference to the directive in the same spirit: use `@for` with the reactive source itself rather than eagerly calling or unwrapping it, unless the official docs for the exact case say otherwise.
- Keep signal reads/writes consistent with the documented CanvasEngine syntax for the context: script code and template code may differ.

## Implementation Checklist

When modifying a CanvasEngine project:

1. Fetch `llms.txt` and the relevant Markdown docs.
2. Inspect local examples with `rg --files -g '*.ce'` and read nearby components.
3. Preserve `.ce` component structure: script, content/template, optional style.
4. Use CanvasEngine primitives and directives instead of importing framework habits from React/Vue/Angular.
5. Verify shorthand bindings, reactive `@if`, and reactive `@for` syntax before finishing.
6. Run the project’s relevant checks or at least a focused syntax/type check when available.
