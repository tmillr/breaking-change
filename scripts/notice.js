import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require(process.env.npm_package_json);
const file = "./NOTICE.txt";

fs.writeFileSync(
  file,
  `This software depends on, and bundles, the following npm packages:

${fs.readFileSync(file, { encoding: "utf8" })}`
);
