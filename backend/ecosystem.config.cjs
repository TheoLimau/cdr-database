// ecosystem.config.cjs — PM2 config per Carbon Credits DB
module.exports = {
  apps: [
    {
      name: 'carbon-db',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000 --reload',
      cwd: '/home/user/webapp/backend',
      interpreter: 'python3',
      interpreter_args: '-m',
      // Trick: usa python -m uvicorn invece di chiamare uvicorn direttamente
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
