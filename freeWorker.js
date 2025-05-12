import { Queue } from 'bullmq';
import { connection } from './config/redis-connection.js';


const myQueue = new Queue('subscription', {
  connection
});


await myQueue.waitUntilReady();

// Clean up jobs in different states
await myQueue.drain(); // Removes waiting, delayed, and active jobs
await myQueue.clean(0, 0, 'completed'); // Remove completed jobs
await myQueue.clean(0, 0, 'failed');    // Remove failed jobs

console.log('All jobs cleared.');
await connection.quit();
