// Intellisense is available for types declared in @types
let ml1 = new MyLib1();
ml1.Method1('hello');

let ml2 = new MyLib2();
ml2.Method1('Hello Hello');

let ret = ml2.Method2('Hola'); console.log(await ret);

const myAsync = async () => await Promise.resolve("Something");

let otherRet = await myAsync();
console.log(otherRet);

let someOtherRet = await Promise.resolve("Works!");
console.log(someOtherRet);

