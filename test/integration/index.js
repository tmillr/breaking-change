import path from "node:path";
import os from "node:os";
import { writeFile, mkdtemp, rm, readFile } from "node:fs/promises";
import test from "ava";
import { execa } from "execa";
import yaml from "js-yaml";

const token = process.env.GITHUB_TOKEN || "abcd";
const testIssue = 7;
let tmpDir;

const mockEventPayload = ((tmpFile) =>
  async function mockEventPayload(jsonObj) {
    const pth = path.join(tmpDir, (tmpFile++).toString());
    await writeFile(pth, JSON.stringify(jsonObj));
    return pth;
  })(0);

const hasKey = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

test.before(async (t) => {
  /**
   * Abstracts away interface with runner (the runner's interface).
   */
  class Harness {
    constructor(opts) {
      Object.assign(this, opts);
      this.actionYAML = Harness.actionYAML;
      this.inputs ||= {};
    }

    /**
     * Action inputs are provided to actions via UPPERCASE environment variables
     * prefixed with `INPUT_`.
     */
    resolveInputs(inputs) {
      inputs = { ...inputs };

      for (const [k, v] of Object.entries(this.actionYAML.inputs))
        if (!hasKey(inputs, k) && hasKey(v, "default")) inputs[k] = v.default;

      for (const [k, v] of Object.entries(inputs)) {
        delete inputs[k];
        inputs["INPUT_" + k.toUpperCase()] = v;
      }

      return inputs;
    }

    /**
     * @returns Promise that rejects on non-zero exit code
     */
    async run(opts = {}) {
      const ctx = Object.assign({}, this, opts);

      for (const [k, v] of Object.entries(this.inputs))
        if (!hasKey(ctx.inputs, k)) ctx.inputs[k] = v;

      return await execa(
        process.execPath,
        [...process.execArgv, path.resolve(this.actionYAML.runs.main)],
        {
          timeout: 60000,
          env: {
            GITHUB_REPOSITORY: ctx.repo,
            GITHUB_EVENT_PATH: await mockEventPayload(ctx.payload),
            GITHUB_EVENT_NAME: ctx.event,
            ...this.resolveInputs(ctx.inputs),
          },
        },
      );
    }
  }

  Harness.actionYAML = yaml.load(await readFile("action.yml", "utf8"));

  tmpDir = await mkdtemp(
    os.tmpdir().replace(new RegExp(`${path.sep}+$`, "u"), "") + path.sep + "bc",
  );

  t.context.defaultHarness = new Harness({
    inputs: { token },
    repo: "tmillr/breaking-change",
    event: "push",
    payload: { commits: [] },
  });
});

test.after.always("cleanup: remove temp dir", async (t) => {
  try {
    await rm(tmpDir, { recursive: true, maxRetries: 20 });
  } catch (e) {}
});

test("smoke test: encounters no errors and exits zero/cleanly", async (t) => {
  await t.notThrowsAsync(
    t.context.defaultHarness.run({ inputs: { issueNumber: testIssue } }),
  );
});

test(`if event != "push": don't error but quickly bail/exit 0 and print warning`, async (t) => {
  const promise = t.context.defaultHarness.run({
    event: "release",
    payload: { action: "created" },
  });

  await t.notThrowsAsync(
    t.context.defaultHarness.run({
      event: "release",
      payload: { action: "created" },
    }),
  );

  const result = await promise;

  t.regex(
    result.stdout,
    /^\s*::\s*warning.*(?:title=|::)\s*unsupported\s*event/iu,
  );
});
