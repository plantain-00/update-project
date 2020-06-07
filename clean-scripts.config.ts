import { checkGitStatus } from 'clean-scripts'

const tsFiles = `"src/**/*.ts"`
const jsFiles = `"*.config.js"`

export default {
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
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src --strict'
  },
  test: [
    'ava',
    'clean-release --config clean-run.config.ts',
    () => checkGitStatus()
  ],
  fix: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`
}
