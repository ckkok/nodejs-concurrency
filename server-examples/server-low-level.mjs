import net from 'net';
import path from 'path';
import { ThreadPool } from '../ThreadPool/threadpool';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const pool = new ThreadPool({
  file: __dirname + '/worker.mjs',
  toEval: false,
  initialSize: 4,
  maxSize: 8,
  bufferSize: Int32Array.BYTES_PER_ELEMENT * 8,
  name: 'DeadPool'
});

let httpHeader = 'HTTP/1.1 200 OK';
httpHeader += '\r\n';
httpHeader += 'Connection: close\r\n';
httpHeader += 'Server: Test Server\r\n';
httpHeader += 'Content-Type: application/json\r\n';
httpHeader += '\r\n';

const server = net.createServer(socket => {
  socket.on('data', data => {
    const path = data.toString().split('\n')[0].split(' ')[1].split('/');
    const length = path.length - 1;
    const start = Date.now();
    const limit = parseInt(path[length], 10);
    pool.getThread().then(worker => {
      return worker.sendMessage(limit);
    })
    .then(stage => {
      socket.write(httpHeader);
      socket.write('{"result": ' + stage.response + ', "processingTime": ' + (Date.now() - start) + '}');
      socket.end();
      stage.worker.release();
    })
  });
});

server.listen(8080, () => {
  console.log('Server bound');
})