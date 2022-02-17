import express from 'express';
import * as path from 'path';
import {createClient} from "redis";

const redis = createClient({
  url: 'redis://127.0.0.1:6379'
});

// todo generate room in redis
// todo on connect -> store connection in redis, link to room, store name against connection, post to existing connections in room, send current state of room
// todo on post -> store number against room / name combo, send to existing connections in room

// just getting ideas, not used for anything
type Connection = {
  id: string; // some uuid
  name: string; // person's name
  room: string; // room id
  tickets: {
    id: string; // SUBE-XXX
    name: string;
    estimate: string;
  }[];
};

const KEY_ROOMS = 'rooms';
const createRoom = (roomId: string) => redis.SADD(KEY_ROOMS, roomId);
const getRooms = () => redis.SMEMBERS(KEY_ROOMS);
const publishRoomChange = async () => redis.PUBLISH(KEY_ROOMS, JSON.stringify(await getRooms()));

const getConnectionKey = (connectionId: string) => `connection:${connectionId}`;
const setConnectionName = (connectionId: string, name: string) => redis.HSET(getConnectionKey(connectionId), 'name', name);
const setConnectionRoom = (connectionId: string, roomId: string) => redis.HSET(getConnectionKey(connectionId), 'roomId', roomId);
const getConnection = (connectionId: string) => redis.HGETALL(getConnectionKey(connectionId));
const publishConnectionChange = async (connectionId: string) => redis.PUBLISH(getConnectionKey(connectionId), JSON.stringify(await getConnection(connectionId)));

const getRoomKey = (roomId: string) => `room:${roomId}`;
const addEstimate = (roomId: string, name: string, estimate: number) => redis.HSET(getRoomKey(roomId), name, estimate);
const resetRoom = (roomId: string) => redis.DEL(getRoomKey(roomId));
const getEstimates = (roomId: string) => redis.HGETALL(getRoomKey(roomId));

const app = express();

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
  res.flushHeaders(); // flush the headers to establish SSE with client

  const connectionSubscriber = redis.duplicate();
  const roomsSubscriber = redis.duplicate();
  const roomSubscriber = redis.duplicate();

  const connectionId = 'some-random-string'; // todo use uuid
  // to be updated when changes to name & roomId are posted to connectionId channel
  let name;
  let roomId;

  await connectionSubscriber.subscribe(getConnectionKey(connectionId), (message) => {
    // todo update name & roomId variables, subscribe to room if updated
    //  message is JSON-stringified version of HGETALL result for given connection
    //  if room is now specified, subscribe to room & **** send current state down the wire ****
    const subscribeToRoom = async (id: string) => {
      await roomSubscriber.unsubscribe(getRoomKey(id));
      await roomSubscriber.subscribe(getRoomKey(id), (message) => {
        // todo send events on changes to the channel
      });
      roomId = id; // update local state
    };
    const data = JSON.parse(message);
    if (data.roomId !== undefined) subscribeToRoom(data.roomId);
    name = data.name;
  });

  await roomsSubscriber.subscribe(KEY_ROOMS, (message) => {
    // todo send events on changes to list of rooms
    //  updates list of rooms so one can be selected
    //  unsubscribe from room if current room has been deleted, send to client
  });

  // todo remove this nonsense
  const INITIAL_VALUE = 10;
  res.write(`data: ${JSON.stringify({type: 'init', message: INITIAL_VALUE})}\n\n`);
  let counter = INITIAL_VALUE;
  const interval = setInterval(() => {
    counter++;
    res.write(`data: ${JSON.stringify({type: 'update', message: counter})}\n\n`);
  }, 2000);

  res.on('close', () => {
    console.log('client disconnected');
    clearInterval(interval);
    res.end();
  });
});

app.post('/api/create-room', async (req, res) => {
  const connectionId = req.body.connectionId;
  const roomId = req.body.roomId;
  await setConnectionRoom(connectionId, roomId);
  await publishConnectionChange(connectionId);
  await publishRoomChange();
});

app.post('/api/join-room', async (req, res) => {
  const connectionId = req.body.connectionId;
  const roomId = req.body.roomId;
  await setConnectionRoom(connectionId, roomId);
  await publishConnectionChange(connectionId);
});

app.post('/api/name-myself', async (req, res) => {
  const connectionId = req.body.connectionId;
  const roomId = req.body.name;
  await setConnectionRoom(connectionId, roomId);
  await publishConnectionChange(connectionId);
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});