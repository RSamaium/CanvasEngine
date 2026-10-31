// Generates the parser of the template (`src/template-parser.generated.js`) from `grammar2.pegjs`, so that nothing is generated
// from text when a component is compiled: a Worker does not allow `eval` nor `new Function`. Run it when the grammar changes:
// `pnpm --filter @canvasengine/compiler run generate:parser` (a test fails while the file is out of date).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import peggy from "peggy";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const grammar = fs.readFileSync(path.join(dirname, "..", "grammar2.pegjs"), "utf8");
fs.writeFileSync(path.join(dirname, "..", "src", "template-parser.generated.js"), peggy.generate(grammar, { output: "source", format: "es" }));
