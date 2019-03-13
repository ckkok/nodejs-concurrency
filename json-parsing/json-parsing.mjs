import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const NUM_WORKERS = 8;

const data = [];
for (let i = 0; i < NUM_WORKERS; i++) {
    data[i] = JSON.parse(fs.readFileSync(__dirname + '/output.json', 'utf8'));
}
console.log('=== Files read. Let\'s go! ===');
const start = Date.now();
const output = [];
for (let i = 0; i < NUM_WORKERS; i++) {
    output[i] = JSON.stringify(data[i]);
    console.log(i+1, 'done');
}
const end = Date.now();
console.log('Stringifying data:', end - start);
console.log('This is outside');