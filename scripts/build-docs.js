import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import yaml from "js-yaml";

const usageFilePath = path.resolve("examples/usage.yml");
const readmeFilePath = path.resolve("README.md");

const usageFile = prettier.format(await readFile(usageFilePath, "utf8"), {
  filepath: usageFilePath,
  ...(await prettier.resolveConfig(usageFilePath, {
    useCache: false,
  })),
});

const { inputs, outputs } = yaml.load(await readFile("action.yml", "utf8"));

const error = (msg) => {
  throw new Error(msg);
};

const toMarkdownTable = (tbl) =>
  tbl
    .map(
      (row) =>
        `| ${row
          .map((cell) =>
            cell
              .toString()
              .replace(/([\\]+)\|/gu, "$1$1|")
              .replace(/\|/gu, "\\|")
          )
          .join(" | ")} |`
    )
    .join("\n");

const snippets = {
  usage: () =>
    `~~~yaml
${usageFile
  .split(/^[\t ]*steps:/mu)[1]
  .replace(
    /(?<!\$)\{\{\s*CURRENT_MAJOR\s*\}\}/gu,
    `${
      (
        process.env.npm_package_version ||
        error("unable to get package version from env var $npm_package_version")
      ).match(/^.*?[1-9]/u)[0]
    }`
  )
  .replace(/^\n+|\n+$/gu, "")}
~~~`,

  inputsTable: () => {
    const table = [
      ["Key", "Description", "Required", "Default"].map(
        (title) => `**${title}**`
      ),
    ];

    table.push(table[0].map((arr) => "---"));

    for (const [key, val] of Object.entries(inputs))
      table.push([
        key,
        val.description || "",
        val.required || "",
        val.default || "",
      ]);

    return toMarkdownTable(table);
  },

  outputsTable: () => {
    const table = [["Key", "Description"].map((title) => `**${title}**`)];
    table.push(table[0].map((arr) => "---"));

    for (const [key, val] of Object.entries(outputs))
      table.push([key, val.description || ""]);

    return toMarkdownTable(table);
  },
};

const readme = (await readFile("README_TEMPLATE.md", "utf8")).replace(
  /<!--.*?@include\s+(\S+).*?-->/gmu,
  (m, p1) => snippets[p1]?.() || error("unrecognized @include directive: " + m)
);

await writeFile(
  readmeFilePath,
  prettier.format(readme, {
    filepath: readmeFilePath,
    ...(await prettier.resolveConfig(readmeFilePath, {
      useCache: false,
    })),
  })
);
