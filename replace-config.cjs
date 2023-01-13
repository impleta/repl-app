module.exports = {
  files: [
    './build/**/*.js'
  ],
  "from": /import (.*) from ['"](\.(.*?))(?:\.js)?['"];/g,
  "to": "import $1 from '$2.js';"
};