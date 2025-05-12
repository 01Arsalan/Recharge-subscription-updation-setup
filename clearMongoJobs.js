import { connectMongo } from './config/mongo-connection.js';
import { FailedJob } from './schema.js'; 

async function clearFailedJobs() {
  try {
    await connectMongo();
    const result = await FailedJob.deleteMany({});
    console.log(`Deleted ${result.deletedCount} failed jobs.`);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting failed jobs:', err);
    process.exit(1);
  }
}

clearFailedJobs();
