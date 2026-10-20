module.exports = {
  apps: [
    {
      name: "fuze-api",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "fuze-worker",
      script: "dist/worker.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
