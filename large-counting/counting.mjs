const start = Date.now();
let count = 0;
for (let i = 0; i < 10e6; i++) {
  count++;
}
console.log('Time taken:', Date.now() - start)
console.log(count);