// ecosystem.config.cjs — PM2 config per Carbon Credits DB
module.exports = {
  apps: [
    {
      name: 'carbon-db',
      script: '/usr/local/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      cwd: '/home/user/webapp/backend',
      interpreter: 'none',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        PYTHONPATH: '/home/user/webapp/backend',
        DATABASE_URL: 'sqlite:///./data/carbon_db.sqlite',
      },
    },
  ],
};
