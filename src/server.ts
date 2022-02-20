import express from 'express';
import * as path from 'path';
import { createClient, RedisClientType } from "redis";
import { v4 as uuid } from 'uuid';
import cookieParser from 'cookie-parser';
import { StateService } from './server/StateService';
import { ConnectionState } from './server/ConnectionState';
import { SubscriptionService } from './server/SubscriptionService';
import { PubService } from './server/PubService';
import { getConnectionKey } from './server/keys';

const redis = createClient({
  url: 'redis://127.0.0.1:6379'
});

const getConnection = async (client: RedisClientType<any, any>, connectionId: string): Promise<Record<string, string>> => ({
  ...(await client.HGETALL(getConnectionKey(connectionId))),
  connectionId,
});

const bootstrapClientAndState = async (connectionId: string) => {
  const client = redis.duplicate();
  await client.connect();
  const connection = await getConnection(client, connectionId);

  const state = new ConnectionState(connectionId, connection.name, connection.roomId);
  const stateService = await new StateService(client, state);
  return {
    state,
    stateService,
  };
}

const app = express();
app.use(express.json());
app.use(cookieParser('some super-secret key'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/assets/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/app.js'));
});

app.get('/api/rt', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  const connectionId = req.signedCookies.connectionId ?? uuid();
  res.cookie('connectionId', connectionId, { signed: true });
  console.log(`[handler]: ${connectionId} connected (${req.signedCookies.connectionId === undefined ? 'new id' : 'reusing id'})`);
  res.flushHeaders(); // flush the headers to establish SSE with client

  const { state, stateService } = await bootstrapClientAndState(connectionId);
  const subscriptionService = await new SubscriptionService(stateService, new PubService(res), state)
    .connect()
    .then(service => service.subscribe());

  res.on('close', async () => {
    console.log('client disconnected');
    await subscriptionService.unsubscribe();
    await stateService.disconnect();
    res.end();
  });
});

app.post('/api/create-room', async (req, res) => {
  const connectionId = req.body.connectionId;
  const roomId = req.body.roomId;
  console.log(`[/api/create-room]:creating ${roomId} for ${connectionId}`);
  const { stateService } = await bootstrapClientAndState(connectionId);
  await stateService.createRoom(roomId);
  await stateService.setConnectionRoom(connectionId, roomId);
  await stateService.publishConnectionChange(connectionId);
  res.end();
});

app.post('/api/join-room', async (req, res) => {
  const connectionId = req.body.connectionId;
  const roomId = req.body.roomId;
  console.log(`[/api/join-room]: connecting ${connectionId} to ${roomId}`);
  const { stateService } = await bootstrapClientAndState(connectionId);
  await stateService.setConnectionRoom(connectionId, roomId);
  res.end();
});

app.post('/api/name-myself', async (req, res) => {
  const connectionId = req.body.connectionId;
  const name = req.body.name;
  console.log(`naming ${connectionId} to ${name}`);
  const { stateService } = await bootstrapClientAndState(connectionId);
  await stateService.setConnectionName(connectionId, name);
  res.end();
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});