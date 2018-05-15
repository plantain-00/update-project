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
    '[dir]/bin/update-project "demo" --exclude "test" --exclude-lib "uglify-js" --check',
    '[dir]/bin/update-project "demo" --exclude "test" --exclude-lib "uglify-js"'
  ]
}
