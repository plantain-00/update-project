module.exports = {
  include: [
    'bin/*',
    'dist/*.js',
    'package.json',
    'yarn.lock'
  ],
  exclude: [
  ],
  postScript: [
    'cd "[dir]" && yarn --production',
    'node [dir]/dist/index.js "demo" --exclude "test" --exclude-lib "uglify-js" --check',
    'node [dir]/dist/index.js "demo" --exclude "test" --exclude-lib "uglify-js"'
  ]
}
