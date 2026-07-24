import { connectMongo } from '../config/mongo.js';
import { FailedJob } from '../models/FailedJob.js';

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
