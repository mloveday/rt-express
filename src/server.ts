import express from 'express';
import * as path from 'path';

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/assets/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/web.js'));
});

app.get('/api/hello', (req, res) => {
  res.json({message: 'hey you'});
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});