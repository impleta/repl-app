module.exports = {
  files: [
    './@types/**/*.d.ts'
  ],
  "from": [
    /import (.*) from ['"](.*)['"];/g, 
    /export declare/g, 
    /export type/g,
    /export {}/g
  ],
  "to": [
    "", 
    "declare", 
    "declare type",
    ""
  ]
};