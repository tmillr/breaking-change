import assert from "node:assert/strict";
import github from "@actions/github";
import core from "@actions/core";

try {
  const getIssueOrDiscussionId = (() => {
    const cache = {};

    return async (repoOwner, repoName, number, which) => {
      cache[which] ??= (
        await octokit.graphql(
          `
            query($owner: String!, $name: String!, $number: Int!) {
              repository(owner: $owner, name: $name) {
                ${which}(number: $number) {
                  id
                }
              }
            }
`,
          { owner: repoOwner, name: repoName, number }
        )
      ).repository[which].id;

      return cache[which];
    };
  })();

  /*
   * @param {{ body: string, clientMutationId?: string, subjectId: string }} input
   */
  async function addIssueComment(input) {
    return (
      await octokit.graphql(
        `
          mutation ($input: AddCommentInput!) {
            addComment(input: $input) {
              commentEdge {
                node {
                  url
                }
              }
            }
          }
`,
        { input }
      )
    ).addComment.commentEdge.node.url;
  }

  /** Filters out non-breaking-change commits based on their message */
  const filterFn = (msg) =>
    /^[^:]+!:/u.test(msg.trim().split("\n")[0]) || /^\s*BREAKING/mu.test(msg);

  const token = core.getInput("token", {
    required: true,
    trimWhitespace: false,
  });

  const { repo, eventName, payload } = github.context;
  const owner = repo.owner;
  const name = repo.repo;
  const octokit = github.getOctokit(token);

  /* Begin Validation */

  if (eventName !== "push") {
    core.warning(`This action only works with "push" events`, {
      title: `Unsupported Event "${eventName}"`,
    });

    process.exit(0);
  }

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
    issueNumber || discussionNumber,
    'missing input: one or both of "discussionNumber" or "issueNumber" must be provided'
  );

  if (issueNumber) {
    assert(
      /^\d+$/.test(issueNumber),
      'invalid input: "issueNumber" is not a valid integer'
    );

    issueNumber = parseInt(issueNumber, 10);
  }

  if (discussionNumber) {
    assert(
      /^\d+$/.test(
        discussionNumber,
        'invalid input: "discussionNumber" is not a valid integer'
      )
    );

    discussionNumber = parseInt(discussionNumber, 10);
  }

  let commitTitlePrefix = "";

  if (/^(?:false|0)$/i.test(headerLevel)) {
  } else if (/^true$/i.test(headerLevel)) {
    commitTitlePrefix = "#".repeat(3) + " ";
  } else {
    assert(
      /^[123456]$/.test(headerLevel),
      `invalid input: "headerLevel" must be an integer between 1 and 6 inclusive, or "false"`
    );

    commitTitlePrefix = "#".repeat(parseInt(headerLevel, 10)) + " ";
  }

  /* End Validation */

  const commits = payload.commits.filter((cm) => filterFn(cm.message));

  // NOTE: the order of requests (comments) is important here!
  // TODO: logging/summary and/or outputs of results or note lack thereof
  for (const commit of commits) {
    let body = commit.message.trim();
    body += `###### Breaking Change ${commit.id}\n${commitTitlePrefix}`;

    if (typeof issueNumber == "number")
      await addIssueComment({
        body,
        subjectId: getIssueOrDiscussionId(owner, name, issueNumber, "issue"),
      });

    if (typeof discussionNumber == "number")
      await octokit.graphql(
        `
          mutation ($input: AddDiscussionCommentInput!) {
            addDiscussionComment(input: $input) {
              comment {
                url
              }
            }
          }
  `,
        {
          input: {
            body: body,
            discussionId: getIssueOrDiscussionId(
              owner,
              name,
              discussionNumber,
              "discussion"
            ),
          },
        }
      );
  }
} catch (err) {
  core.setFailed(err.message);
}
