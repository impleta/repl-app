module.exports = {
  files: [
    './@types/**/*.d.ts'
  ],
  "from": [/import (.*) from ['"](.*)['"];/g, /export declare/],
  "to": ["", "declare"]
};