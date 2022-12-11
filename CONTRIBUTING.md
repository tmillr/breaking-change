# CONTRIBUTING

## Branches

### `dev`

A long-living branch. The development branch.

### `master`

A long-living branch. The default branch. Semantically, also the release branch, because it seems that GitHub Marketplace treats the default branch as the release branch. GitHub Marketplace uses the `README.md` on the default branch as the action's landing page, and it's probably best that this document matches the latest version/release instead of potentially including descriptions of things that haven't been released yet or are still in development (which could be the case if the default branch were the development branch).

### `v*` (e.g. `v1`)

A long-living, (major) version-tracking branch. The head of this branch should always reference the latest tag/version for that major version number (using a branch because moving tags feels awkward and git recommends against it as well, but the standard practice on GitHub does appear to be dynamic tags).

**TLDR:** Checkout and commit to the `dev` branch. Forks should similarly target `dev` as the base branch of a pull request.

## Release Process

> Releasing custom actions on the GitHub Marketplace, it would seem, is not a totally straightforward process.

1. If all checks are passing for the latest/head commit on `dev`, run `npm release` while on `dev`, then commit and push the result to `dev` **(do not force push!!!)**. That commit will/should now be tagged (i.e. a git tag) with a version (e.g. `v1.0.0`).`npm release` should be made to: create a tag, create a commit, update manifests, and take care of anything else needed for release (e.g. build/update docs (for example to update version references in `README.md`), software).

2. Merge that tagged commit into `master`. If via pr, we probably don't want to squash or rebase when doing so since `dev` is a long-lived branch that will be merged into `master` again in the future, and on a continual basis. Squash and rebase pr merges create brand-new commits that git will not later recognize as having been already merged. A fast-forward merge is ok too, if not preferred? (no merge commit, linear history, etc.).

3. Create a GitHub `release` from the tag that was created in step 1. This can normally be automated, but it doesn't seem to be possible to automate releases to the Marketplace. Even if automated, you will still have to find and edit the release on github.com and manually select the checkbox to propagate the release to the Marketplace. Finally, fast-forward merge `master` into the appropriate major version branch (e.g. `v1`) (can be automated); if the branch doesn't exist yet, create it and push it.

4. ...

5. Profit the BIG BUCKS!!!
