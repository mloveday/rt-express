import express from 'express';
import * as path from 'path';

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/assets/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/app.js'));
});

app.get('/api/rt', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  const INITIAL_VALUE = 10;
  res.write(`data: ${JSON.stringify({ type: 'init', message: INITIAL_VALUE })}\n\n`);

  let counter = INITIAL_VALUE;
  const interval = setInterval(() => {
    counter++;
    res.write(`data: ${JSON.stringify({ type: 'update', message: counter })}\n\n`);
  }, 2000);

  res.on('close', () => {
    console.log('client disconnected');
    clearInterval(interval);
    res.end();
  });
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});