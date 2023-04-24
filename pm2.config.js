const path = require('path');

const libPath = path.join(__dirname, '..', '/communi-design-system/lib');

module.exports = {
  apps: [
    {
      name: 'Remix',
      script: 'npm run dev:remix',
      ignore_watch: ['.'],
      watch: [libPath],
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'Wrangler',
      script: 'npm run dev:wrangler',
      ignore_watch: ['.'],
      env: {
        NODE_ENV: 'development',
        BROWSER: 'none',
      },
    },
  ],
};