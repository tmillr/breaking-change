/*
 *
 * Unit Tests
 *
 */

import test from "ava";
import { getOctokit } from "./utils.js";
const octokit = getOctokit();

const repoOwner = "tmillr",
  repoName = "breaking-change",
  issueNum = 7,
  discussionNum = 8;

let issueId, discussionId;

test.serial(
  "getDiscussionOrIssueId(): get issue id from issue number",
  async (t) => {
    const id = await octokit.getIssueOrDiscussionId(
      repoOwner,
      repoName,
      issueNum,
      "issue"
    );

    t.log("id:", id);
    t.is(typeof id, "string");
    t.true(id.length > 0, "id length is 0!");
    issueId = id;
  }
);

test.serial(
  "getDiscussionOrIssueId(): get discussion id from discussion number",
  async (t) => {
    const id = await octokit.getIssueOrDiscussionId(
      repoOwner,
      repoName,
      discussionNum,
      "discussion"
    );

    t.log("id:", id);
    t.is(typeof id, "string");
    t.true(id.length > 0, "id length is 0!");
    discussionId = id;
  }
);

test.serial("addIssueComment()", async (t) => {
  const expectedUrl = new URL(
    `https://github.com/${repoOwner}/${repoName}/issues/${issueNum}#issuecomment-`
  );

  let url = await octokit.addIssueComment(issueId, "test comment");
  t.log("comment url:", url);
  t.is(typeof url, "string");
  url = new URL(url);
  url.hash = url.hash.replace(/\d+/, "");
  t.deepEqual(url, expectedUrl);
});

test.serial("addDiscussionComment()", async (t) => {
  const expectedUrl = new URL(
    `https://github.com/${repoOwner}/${repoName}/discussions/${discussionNum}#discussioncomment-`
  );

  let url = await octokit.addDiscussionComment(discussionId, "test comment");
  t.log("comment url:", url);
  t.is(typeof url, "string");
  url = new URL(url);
  url.hash = url.hash.replace(/\d+/, "");
  t.deepEqual(url, expectedUrl);
});
