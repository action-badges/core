# `action-badges/core` Github Action

Example:

```yaml
name: Generate Badges
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # badges can use static values
      - name: Make Black Code Style badge
        uses: action-badges/core@0.3.0
        with:
          label: code style
          message: black
          message-color: "000"
          file-name: black.svg
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      ## ..or you can generate them dynamically
      - run: echo "github_sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
      - name: Make Latest Commit badge
        uses: action-badges/core@0.3.0
        with:
          label: latest commit
          message: "${{ env.github_sha_short }}"
          message-color: blue
          file-name: latest-commit.svg
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```

## Parameters

These parameters are available when using action-badges/core in a yaml workflow or composite action. They are also inherited by all javascript actions based on action-badges/core.

### Action Parameters

- `github-token`: (required) The `GITHUB_TOKEN` secret. This allows the action to commit SVG images back to the repo
- `file-name`: (required) Name of the SVG badge file to write
- `badge-branch`: (optional) Branch to store SVG badges on (uses your default branch if not supplied)

### Badge Parameters

- `label`: Badge label text (left side of the badge)
- `label-color`: Label color
- `message`: Badge message text (right side of the badge)
- `message-color`: Message color
- `style`: Visual style of the badge. One of:

| style           | preview                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `flat`          | ![flat](https://raw.githubusercontent.com/action-badges/core/main/docs/img/flat.svg)                   |
| `flat-square`   | ![flat-square](https://raw.githubusercontent.com/action-badges/core/main/docs/img/flat-square.svg)     |
| `plastic`       | ![plastic](https://raw.githubusercontent.com/action-badges/core/main/docs/img/plastic.svg)             |
| `for-the-badge` | ![for-the-badge](https://raw.githubusercontent.com/action-badges/core/main/docs/img/for-the-badge.svg) |
| `social`        | ![social](https://raw.githubusercontent.com/action-badges/core/main/docs/img/social.svg)               |

## Storing your badges

If the `badge-branch` param is not specified, badges will be saved to your default branch (usually `main` or `master`). To keep your default branch's history clean the recommended usage pattern is to store your badges on an [orphan branch](https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt---orphanltnewbranchgt). You can initialize this yourself but the easiest way to create ensure an orphan branch exists is to use the [create-orphan-branch action](https://github.com/action-badges/create-orphan-branch). For example:


```yaml
name: Generate Badges
on:
  issues:
    types: [opened, edited, deleted, transferred, closed, reopened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: action-badges/create-orphan-branch@0.1.0
        with:
          branch-name: badges

      - name: Make Open Issues badge
        uses: action-badges/core@0.3.0
        with:
          label: open issues
          message: "${{ github.event.repository.open_issues }}"
          message-color: ${{ github.event.repository.open_issues == 0 && 'yellow' || 'brightgreen' }}
          file-name: open-issues.svg
          badge-branch: badges
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```


To create an orphan branch manually:

```
git checkout --orphan badges
git rm -rf .
rm -f .gitignore
echo '# Badges' > README.md
git add README.md
git commit -m 'init'
git push origin badges
```

Having created an orphan branch, badges can now be saved on the new orphan branch by setting

```yml
badge-branch: badges
```

in your workflow or action yaml.

## Embedding badges in your README

After a successful run your workflow will output a markdown snippet to embed your badge.
