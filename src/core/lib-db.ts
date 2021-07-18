import chalk from 'chalk';
import { MongoClient } from 'mongodb';

export function initializeDb() {
  const database = new MongoClient(process.env.MONGO_URI);
  return database.connect().then(() => {
    console.log(chalk.bold('Connected to MongoDB'));
  });
}
