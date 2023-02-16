// Intellisense is available for types declared in @types
let ml1 = new MyLib1();
ml1.Method1('hello');

let ml2 = new MyLib2();
ml2.Method1('Hello Hello');

let ret = await ml2.Method2('Hola');
console.log(ret);
