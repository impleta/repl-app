module.exports = {
  files: './build/src/replicant.config.js',
  "from": /import (.*) from "(\.\/.*)";/g,
  "to": "import $1 from '$2.js';"
};