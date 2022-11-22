import assert from "node:assert";
import github from "@actions/github";
import core from "@actions/core";

/**
 * @param {unknown} obj
 * @return {string}
 */
export function humanReadableTypeOf(obj) {
  if (obj === null) return "null";
  if (typeof obj === "object") return obj.constructor.name;
  return typeof obj;
}

/** Filters out non-breaking-change commits based on their message */
export const filterFn = (msg) =>
  /^[^:]+!:/u.test(msg.trim().split("\n")[0]) || /^\s*BREAKING/mu.test(msg);

export function getOctokit(
  auth = core.getInput("token", {
    required: true,
    trimWhitespace: true,
  })
) {
  const methods = {
    getIssueOrDiscussionId: (() => {
      const cache = {};

      return async function (repoOwner, repoName, number, which) {
        const x = `${repoOwner} ${repoName} ${number} ${which}`;

        if ({}.constructor.prototype.hasOwnProperty.call(cache, x))
          return cache[x];

        return (cache[x] = (
          await this.graphql(
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
        ).repository[which].id);
      };
    })(),

    // /*
    //  * @param {{ body: string, clientMutationId?: string, subjectId: string }} input
    //  */
    addIssueComment: async function (issueId, comment) {
      return (
        await this.graphql(
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
          { input: { subjectId: issueId, body: comment } }
        )
      ).addComment.commentEdge.node.url;
    },

    addDiscussionComment: async function (discussionId, comment) {
      return (
        await this.graphql(
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
              body: comment,
              discussionId,
            },
          }
        )
      ).addDiscussionComment.comment.url;
    },
  };

  const octokit = github.getOctokit(auth);

  for (const k of Object.keys(methods)) {
    assert(!(k in octokit));
    octokit[k] = methods[k];
  }

  return octokit;
}

export function inputWasProvided(input) {
  return input !== "";
}
