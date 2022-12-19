const vm = require('vm');
const replicant = require('./replicant');
const fs = require('fs')

const args = process.argv.slice(2);

if (args.length <= 0) {
  global.Replicant = replicant;
  const repl = require('repl');
  repl.start({});
}
else {
  const replicantContext = {
    Replicant: replicant
  };
  
  const text = fs.readFileSync(args[0]);

  vm.runInNewContext(text, replicantContext);
}