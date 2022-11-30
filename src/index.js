import assert from "node:assert/strict";
import github from "@actions/github";
import core from "@actions/core";
import {
  getOctokit,
  filterFn,
  humanReadableTypeOf,
  inputWasProvided,
} from "./utils.js";

let foundBreakingChange = false;
let error;

try {
  const { repo, eventName, payload } = github.context;
  const owner = repo.owner;
  const name = repo.repo;
  const octokit = getOctokit();

  if (eventName !== "push") {
    core.warning(`This action only works with "push" events`, {
      title: `Unsupported Event "${eventName}"`,
    });

    process.exit(0);
  }

  const commits = (() => {
    const ret = payload.commits;
    assert(ret !== undefined, 'missing "commits" field of event payload ');

    assert(
      Array.isArray(ret),
      `"commits" field of event payload is the wrong type: expected "Array", found "${humanReadableTypeOf(
        ret
      )}"`
    );

    return ret.filter((cm) => filterFn(cm.message));
  })();

  /*** Begin Validation ***/

  let issueNumber = core.getInput("issueNumber", {
    required: false,
    trimWhitespace: true,
  });

  let discussionNumber = core.getInput("discussionNumber", {
    required: false,
    trimWhitespace: true,
  });

  let headerLevel = core.getInput("headerLevel", {
    required: false,
    trimWhitespace: true,
  });

  assert(
    inputWasProvided(issueNumber) || inputWasProvided(discussionNumber),
    'missing input: one or both of "discussionNumber" or "issueNumber" must be provided'
  );

  if (inputWasProvided(issueNumber)) {
    assert(
      /^\d+$/.test(issueNumber),
      'invalid input provided for "issueNumber": not a valid integer'
    );

    issueNumber = parseInt(issueNumber, 10);
  }

  if (inputWasProvided(discussionNumber)) {
    assert(
      /^\d+$/.test(
        discussionNumber,
        'invalid input provided for "discussionNumber": not a valid integer'
      )
    );

    discussionNumber = parseInt(discussionNumber, 10);
  }

  let commitTitlePrefix = "";

  if (/^(?:false|0)$/i.test(headerLevel)) {
    // no-op
  } else if (/^true$/i.test(headerLevel)) {
    commitTitlePrefix = "#".repeat(3) + " ";
  } else {
    assert(
      /^[123456]$/.test(headerLevel),
      `invalid input provided for "headerLevel": expected an integer between 1 and 6 inclusive, or "false"`
    );

    commitTitlePrefix = "#".repeat(parseInt(headerLevel, 10)) + " ";
  }

  /*** End Validation ***/

  // NOTE: the order of requests (comments) is important here!
  // TODO: logging/summary and/or outputs of results or note lack thereof
  for (const commit of commits) {
    foundBreakingChange = true;
    const body = `###### Breaking Change ${
      commit.id
    }\n${commitTitlePrefix}${commit.message.trim()}`;

    if (typeof issueNumber == "number")
      await octokit.addIssueComment(
        await octokit.getIssueOrDiscussionId(owner, name, issueNumber, "issue"),
        body
      );

    if (typeof discussionNumber == "number")
      await octokit.addDiscussionComment(
        await octokit.getIssueOrDiscussionId(
          owner,
          name,
          discussionNumber,
          "discussion"
        ),
        body
      );
  }
} catch (e) {
  error = e;
} finally {
  if (foundBreakingChange) core.setOutput("found", foundBreakingChange);
  if (error) core.setFailed(error.message);
}
