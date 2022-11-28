import { readFile, writeFile } from "node:fs/promises";
import yaml from "js-yaml";
const file = yaml.load(await readFile("action.yml", "utf8")).runs.main + ".map";
const json = JSON.parse(await readFile(file, "utf8"));

json.sources = json.sources.map((path) =>
  path.replace(
    new RegExp(`^(?:\\.\\.?[\\\\/])*webpack:[\\\\/]*(?:breaking-change[\\\\/])?`, "u"),
    ""
  )
);

await writeFile(file, JSON.stringify(json));
