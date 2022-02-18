import express from 'express';
import * as path from 'path';
import {createClient, RedisClientType} from "redis";
import {Response} from "express";
import {v4 as uuid} from 'uuid';

const redis = createClient({
    url: 'redis://127.0.0.1:6379'
});

const KEY_ROOMS = 'rooms';
const createRoom = (roomId: string) => redis.SADD(KEY_ROOMS, roomId);
const getRooms = () => redis.SMEMBERS(KEY_ROOMS);
const publishRoomChange = async () => redis.PUBLISH(KEY_ROOMS, JSON.stringify(await getRooms()));

const getConnectionKey = (connectionId: string) => `connection:${connectionId}`;
const setConnectionName = (connectionId: string, name: string) => redis.HSET(getConnectionKey(connectionId), 'name', name);
const setConnectionRoom = (connectionId: string, roomId: string) => redis.HSET(getConnectionKey(connectionId), 'roomId', roomId);
const getConnection = (connectionId: string) => redis.HGETALL(getConnectionKey(connectionId));
const publishConnectionChange = async (connectionId: string) => redis.PUBLISH(getConnectionKey(connectionId), JSON.stringify(await getConnection(connectionId)));

const VIEW_ROOM_ONLY = -2;
const NO_ESTIMATE = -1;
const getRoomKey = (roomId: string) => `room:${roomId}`;
const viewRoom = (roomId: string, name: string) => redis.HSET(getRoomKey(roomId), name, VIEW_ROOM_ONLY);
const joinRoom = (roomId: string, name: string) => redis.HSET(getRoomKey(roomId), name, NO_ESTIMATE);
const makeEstimate = (roomId: string, name: string, estimate: number) => redis.HSET(getRoomKey(roomId), name, estimate);
const resetRoom = async (roomId: string) => {
    const names = Object.keys(await getEstimates(roomId));
    await Promise.all(names.map((name) => redis.HSET(getRoomKey(roomId), name, -1)));
}
const deleteRoom = (roomId: string) => redis.DEL(getRoomKey(roomId));
const getEstimates = (roomId: string) => redis.HGETALL(getRoomKey(roomId));
const publishToRoom = async (roomId: string) => redis.PUBLISH(getRoomKey(roomId), JSON.stringify(await getEstimates(roomId)));

const sendMessage = (res: Response, type: string, message: any) => res.write(`data: ${JSON.stringify({
    type,
    message
})}\n\n`);

const ensureConnected = async (client: RedisClientType<any, any>) => {
    try {
        await client.connect();
    } catch (e) {
        if (e instanceof Error && e.message === 'Socket already opened') return;
        console.log('Failed to connect to Redis', e);
    }
}

const app = express();
app.use(express.json());

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

    await ensureConnected(redis);
    const connectionSubscriber = redis.duplicate();
    await ensureConnected(connectionSubscriber);
    const roomsSubscriber = redis.duplicate();
    await ensureConnected(roomsSubscriber);
    const roomSubscriber = redis.duplicate();
    await ensureConnected(roomSubscriber);

    const connectionId = uuid();
    sendMessage(res, 'connection', { connectionId });

    // to be updated when changes to name & roomId are posted to connectionId channel
    let name;
    let roomId;

    console.log(`[connectionSubscriber]: ${connectionId} subscribing to connection`);
    await connectionSubscriber.subscribe(getConnectionKey(connectionId), (message) => {
        console.log(`[connectionSubscriber]: ${connectionId} received ${message}`);
        const subscribeToRoom = async (id: string) => {
            console.log(`[roomSubscriber]: ${connectionId} subscribed to ${id}`);
            // await roomSubscriber.unsubscribe(getRoomKey(roomId));
            await roomSubscriber.subscribe(getRoomKey(id), async (message) => {
                console.log(`[roomSubscriber]: ${connectionId} received update message`, message);
                sendMessage(res, 'room', JSON.parse(message));
            });
            roomId = id; // update local state
        };
        const data = JSON.parse(message);
        if (data.roomId !== undefined) subscribeToRoom(data.roomId);
        name = data.name;
        sendMessage(res, 'connection', data);
    });
    sendMessage(res, 'rooms', await getRooms());

    console.log(`[roomsSubscriber]: ${connectionId} subscribing to rooms`);
    await roomsSubscriber.subscribe(KEY_ROOMS, async (message) => {
        // todo send events on changes to list of rooms
        //  updates list of rooms so one can be selected
        //  unsubscribe from room if current room has been deleted, send to client
        console.log(`[roomSubscriber]: received rooms update message`, message);
        sendMessage(res, 'rooms', JSON.parse(message));
    });

    res.on('close', () => {
        console.log('client disconnected');
        connectionSubscriber.unsubscribe();
        roomsSubscriber.unsubscribe();
        roomSubscriber.unsubscribe();
        res.end();
    });
});

app.post('/api/create-room', async (req, res) => {
    const connectionId = req.body.connectionId;
    const roomId = req.body.roomId;
    console.log(`creating ${roomId} for ${connectionId}`);
    await ensureConnected(redis);
    await createRoom(roomId);
    await publishRoomChange();
    await setConnectionRoom(connectionId, roomId);
    await publishConnectionChange(connectionId);
    res.end();
});

app.post('/api/join-room', async (req, res) => {
    const connectionId = req.body.connectionId;
    const roomId = req.body.roomId;
    console.log(`connecting ${connectionId} to ${roomId}`);
    await ensureConnected(redis);
    await setConnectionRoom(connectionId, roomId);
    await publishConnectionChange(connectionId);
    res.end();
});

app.post('/api/name-myself', async (req, res) => {
    const connectionId = req.body.connectionId;
    const name = req.body.name;
    console.log(`naming ${connectionId} to ${name}`);
    await ensureConnected(redis);
    await setConnectionName(connectionId, name);
    await publishConnectionChange(connectionId);
    res.end();
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});