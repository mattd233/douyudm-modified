module.exports = {
  apps: [
    {
      name: "douyudm-monitor",
      script: "src/main.js",
      cron_restart: "0 6 * * *", // Restart every day at 6:00 AM
    },
  ],
};
