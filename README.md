# Examples in NodeJS Concurrency

For Talk.JS @ 13 Mar 2019

Requires NodeJS v10.5 and later to use worker threads and the bigint primitive

Check package.json for npm scripts to start the various servers and tasks.

The Java Server can be used as a performance reference for the multithreaded/threadpooled versions of the NodeJS/fastify servers.

The loadtest.yml script in the server-examples folder is meant to be used with artillery.io. Run npm i -g artillery and then artillery run loadtest.yml to start the load test on the servers (run one first) to see the effects of multithreading on response times and peak load capacity, especially when using the threadpool.

Note: Although the performance of json stringifying using threads is barely faster than the single-threaded scenario, and in fact much worse without careful planning as seen in the v1 demo, the point of doing so is not to block the main thread in http servers that need to service incoming http requests under high load.