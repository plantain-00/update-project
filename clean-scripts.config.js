const { checkGitStatus } = require('clean-scripts')

const tsFiles = `"src/**/*.ts" "spec/**/*.ts"`
const jsFiles = `"*.config.js"`

module.exports = {
  build: [
    'rimraf dist/',
    'tsc -p src/',
    [
      'cd demo && yarn',
      `node dist/index.js "demo" --exclude "test" --exclude-lib "uglify-js" --check`,
      `node dist/index.js "demo" --exclude "test" --exclude-lib "uglify-js"`
    ]
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src --at-least 96'
  },
  test: [
    'tsc -p spec',
    'jasmine',
    'clean-release --config clean-run.config.js',
    () => checkGitStatus()
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`
  }
}
