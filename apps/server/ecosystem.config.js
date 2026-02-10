module.exports = {
  apps: [
    {
      name: 'snake-server',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      watch: false,
      autorestart: true,
    },
  ],
};
