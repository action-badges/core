#!/bin/bash

set -euo pipefail

mkdir -p coverage
node --test \
  --experimental-test-coverage \
  --experimental-test-module-mocks \
  --test-coverage-include='**/*.js' \
  --test-coverage-exclude='**/*.test.js' \
  --test-coverage-exclude='dist/*' \
  --test-coverage-exclude='node_modules/**' \
  --test-reporter=cobertura \
  --test-reporter-destination=coverage/cobertura-coverage.xml \
  --test-reporter=spec \
  --test-reporter-destination=stdout
