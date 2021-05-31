# action-badges/core

Serverless badge generation with Github Actions

![build](https://raw.githubusercontent.com/action-badges/core/badges/.badges/main/build-status.svg)
![coverage](https://raw.githubusercontent.com/action-badges/core/badges/.badges/main/coverage.svg)
![version](https://raw.githubusercontent.com/action-badges/core/badges/.badges/main/package-version.svg)
![license](https://raw.githubusercontent.com/action-badges/core/badges/.badges/main/package-license.svg)
![node](https://raw.githubusercontent.com/action-badges/core/badges/.badges/main/package-node-version.svg)

Action badges allows you to create custom badges using github actions and host them in your own github repo.

Unlike centralized services like [shields.io](https://shields.io/) and [badgen.net](https://badgen.net/), action badges can be used to:

- Generate badges using content in private repositories without hosting and maintaining your own instance of shields or badgen
- Make badges that need private tokens or secrets to generate the content
- Make badges that are slow to compute or rely on data that is not available from a HTTP API
- Generate badges without contacting any external services: compute is handled by github actions, badges are stored in github repo

There are two ways to use action-badges/core. It can be used directly as a Github Action to generate badges with yaml workflows or as an NPM library to create re-usable javascript actions.

- [Github Action](https://github.com/action-badges/core/blob/main/docs/github-action.md)
- [NPM Package](https://github.com/action-badges/core/blob/main/docs/npm-package.md)
