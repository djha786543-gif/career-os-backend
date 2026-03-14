import cron from 'node-cron';

export function scheduleDailyJob(fn: () => void) {
  // Runs every day at 2am
  cron.schedule('0 2 * * *', fn);
}
