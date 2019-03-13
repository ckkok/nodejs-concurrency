import fs from 'fs';
import { Worker } from 'worker_threads';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const NUM_WORKERS = 8;

const data = [];
const pool = [];

// Read the huge data file
for (let i = 0; i < NUM_WORKERS; i++) {
    data[i] = JSON.parse(fs.readFileSync(__dirname + '/output.json', 'utf8'));
}

const script = fs.readFileSync(__dirname + '/worker-json-parse-eager.js', 'utf8');
console.log('=== Files read. Start ze _better_ workers! ===');
// Thread pool creation
const start = Date.now();

for (let i = 0; i < NUM_WORKERS; i++) {
    pool[i] = new Worker(script, { eval: true, workerData: data[i] });
}

const poolcreate = Date.now();
console.log('Thread creation:', poolcreate - start);

const output = [];
let counter = 0;
for (let i = 0; i < NUM_WORKERS; i++) {
    pool[i].on('message', response => {
        console.log(pool[i].threadId, 'done');
        if (++counter === NUM_WORKERS) {
            const end = Date.now();
            console.log('Stringifying data:', end - poolcreate);
            process.exit(0);
        }
    })
    pool[i].postMessage(0);
}

console.log('This is outside');