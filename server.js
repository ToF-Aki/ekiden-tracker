const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const express = require('express');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  
  // プロキシ信頼設定
  expressApp.set('trust proxy', 1);

  // ヘルスチェックエンドポイント
  expressApp.get('/healthz', (req, res) => {
    res.status(200).send('ok');
  });

  // Next.jsのハンドラーをミドルウェアとして使用
  expressApp.use(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const server = createServer(expressApp);

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('✅ クライアントが接続しました:', socket.id);

    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`📍 クライアントがイベント ${eventId} に参加しました`);
    });

    socket.on('record-created', (data) => {
      console.log('📝 新しい記録:', data);
      io.to(`event-${data.eventId}`).emit('record-created', data);
    });

    socket.on('disconnect', () => {
      console.log('❌ クライアントが切断しました:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
