# Breaking Change

[![codecov](https://codecov.io/github/tmillr/breaking-change/branch/master/graph/badge.svg?token=CdtcYcijqb)](https://codecov.io/github/tmillr/breaking-change)

This GitHub action automatically detects breaking changes by scanning the messages of commits pushed to your repository for [conventional commit](https://www.conventionalcommits.org) syntax. For each commit that signals a breaking change, its message content will be posted as a comment on a preselected/predetermined GitHub issue and/or discussion (whose number is specified via the action's inputs). The action will error if neither an issue or discussion is specified, although both may be specified. The order of commits are preserved and are reflected in the order of the comments. Such a discussion or issue not only serves as a central, autonomous, chronological log of breaking changes, but also as a source of breaking change notifications for users who subscribe to the issue/discussion.

## Usage

<!-- prettier-ignore-start -->

<!-- @include usage -->

<!-- prettier-ignore-end -->

### Inputs

<!-- @include inputsTable -->

### Outputs

<!-- @include outputsTable -->

## Tips

- Lock the issue/discussion used for reporting breaking changes (only allow maintainers etc. to comment).

## Caveats

- Using the issue/discussion method alone, it may not be clear or obvious which reported breaking changes belong to which versions/releases of the software.

- Only detects [conventional commits](https://www.conventionalcommits.org).
