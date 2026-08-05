import { transform } from "lightningcss";
import type { SelectorComponent } from "lightningcss";

/** Prefixes every style-rule selector with the component scope class. */
export function scopeStyles(css: string, scopeClass: string, filename = "component.css"): string {
  const prefix: SelectorComponent[] = [
    { type: "class", name: scopeClass },
    { type: "combinator", value: "descendant" },
  ];

  const result = transform({
    filename,
    code: Buffer.from(css),
    minify: false,
    visitor: {
      Rule: {
        style(rule) {
          rule.value.selectors = rule.value.selectors.map(selector => [
            ...prefix,
            ...selector,
          ]);
          return rule;
        },
      },
    },
  });

  return result.code.toString();
}
