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
/*
  async function content(path: string) {  
    return await readFile(path, 'utf8')
  }
  */
  const replicantContext = {
    Replicant: require('./replicant')
  };
  
  const text = fs.readFileSync(args[0]);
  // console.log(text);
  vm.runInNewContext(text, replicantContext);
  process.exit(0)
}

// export {}