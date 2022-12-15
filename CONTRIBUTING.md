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

> This feels like a fairly decent starting-point, but there might be some edge-case and scalability issues. Staging/prepping releases (e.g. via pr) becomes difficult or impossible since there might be commits which get added onto `dev` while such a pr is open that are incompatible with that staged release version number (e.g. the staged version is a patch version number change while the new commits introduce incompatibility or breaking behavior requiring a major version number change). Ommitting those breaking commits from the merge (i.e. not merging the branch head) into master means that no further commits may be added to the pr/head branch (`dev`) at that point since they'd come after the cutoff point/commit to be merged (the parent of the breaking change commit), while changing the cutoff point/commit to merge (e.g. to the branch head) in order to include last-minute changes means that the target version number for the staged release will need to be changed. A potential remedy is to use temporary or multiple branches for development instead of a long-living dev branch and require different types of changes (i.e. patch, feature, breaking) to each be committed to a different/separate branch. Or, incompatible commits may be reverted before release, and then re-applied after, although clearly this is not optimal.
