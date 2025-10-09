const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

(async () => {
  try {
    await nextApp.prepare();

    const server = express();

    // プロキシを信頼（HTTPS判定などで必須）
    server.set('trust proxy', 1);

    // 超軽量ヘルスチェック
    server.get('/healthz', (_req, res) => res.status(200).send('ok'));

    // それ以外は Next に委譲
    server.all('*', (req, res) => handle(req, res));

    server.listen(PORT, HOST, () => {
      console.log(`Ready on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Boot error:', err);
    process.exit(1);
  }
})();
