import { RedisClientType } from 'redis';
import { ConnectionState } from './ConnectionState';
import { getConnectionKey, getRoomKey, KEY_ROOMS } from './keys';
import { Estimate } from './Estimate';

// handles all get / set calls to redis
export class StateService {
  #redis: RedisClientType;
  #state: ConnectionState;

  constructor(redis: RedisClientType<any, any>, state: ConnectionState) {
    this.#redis = redis;
    this.#state = state;
  }

  public disconnect = async () => {
    const roomId = this.#state.roomId;
    const name = this.#state.name;
    if (roomId !== undefined && name !== undefined) await this.leaveRoom(roomId, name);
    await this.#redis.disconnect();
  }

  public createSubscriber = () => this.#redis.duplicate();

  public createRoom = async (roomId: string) => {
    await this.#redis.SADD(KEY_ROOMS, roomId);
    await this.publishRoomListChange();
  };

  public getRoomList = async () => this.#redis.SMEMBERS(KEY_ROOMS);

  public publishRoomListChange = async () => this.#redis.PUBLISH(KEY_ROOMS, JSON.stringify(await this.getRoomList()));

  public setConnectionName = async (connectionId: string, name: string) => {
    console.log(`[setConnectionName]: setting name of ${connectionId} to ${name}`);
    const connection = await this.getConnection(connectionId);

    // update name in current room
    const roomKey = getRoomKey(connection.roomId);
    await this.#redis.HSET(roomKey, name, (await this.getRoomEstimates(connection.roomId))[connection.name] ?? Estimate.None)
    await this.#redis.HDEL(roomKey, connection.name);
    await this.publishToRoom(connection.roomId);

    // update connection
    return this.#redis.HSET(getConnectionKey(connectionId), 'name', name);
  };

  public setConnectionRoom = async (connectionId: string, roomId: string, estimate?: Estimate) => {
    console.log(`[setConnectionRoom]: adding ${connectionId} to ${roomId}`);
    const connection = await this.getConnection(connectionId);
    const oldRoomId = connection.roomId;
    // update current connection
    await this.#redis.HSET(getConnectionKey(connectionId), 'roomId', roomId);
    await this.publishConnectionChange(connectionId);
    if (oldRoomId !== undefined) await this.leaveRoom(oldRoomId, connection.name);
    await this.joinRoom(roomId, estimate);
  };

  public getConnection = async (connectionId: string): Promise<Record<string, string>> => ({
    ...(await this.#redis.HGETALL(getConnectionKey(connectionId))),
    connectionId,
  });

  public publishConnectionChange = async (connectionId: string) => this.#redis.PUBLISH(getConnectionKey(connectionId), JSON.stringify(await this.getConnection(connectionId)));

  public leaveRoom = async (roomId: string, name: string) => {
    console.log(`[leaveRoom]: ${name} leaves ${roomId}`);
    await this.#redis.HDEL(getRoomKey(roomId), name);
    await this.publishToRoom(roomId);
  };

  public viewRoom = async (roomId: string) => {
    if (!this.#state.isFullConnectionState()) throw Error(`'Can't view a room without a name & room`)
    console.log(`[viewRoom]: ${this.#state.name} views ${roomId}`);
    await this.#redis.HSET(getRoomKey(roomId), this.#state.name, Estimate.View);
    await this.publishToRoom(roomId);
  };

  public joinRoom = async (roomId: string, estimate: Estimate = Estimate.None) => {
    if (!this.#state.isFullConnectionState()) throw Error(`'Can't join a room without a name & room`)
    console.log(`[joinRoom]: ${this.#state.name} joins ${roomId}`);
    await this.#redis.HSET(getRoomKey(roomId), this.#state.name, estimate);
    await this.publishToRoom(roomId);
  };

  public makeEstimate = async (estimate: number) => {
    if (!this.#state.isFullConnectionState()) throw Error(`'Can't estimate without a name & room`)
    console.log(`[makeEstimate]: ${this.#state.name} estimates ${estimate} in ${this.#state.roomId}`);
    await this.#redis.HSET(getRoomKey(this.#state.roomId), this.#state.name, estimate);
    await this.publishToRoom(this.#state.roomId);
  };

  public resetRoom = async (roomId: string) => {
    if (!this.#state.isFullConnectionState()) throw Error(`'Can't reset a room without a name & room`)
    console.log(`[resetRoom]: resetting ${roomId}`);
    const entries = Object.entries(await this.getRoomEstimates(roomId));
    for (const entry in entries) await this.#redis.HSET(getRoomKey(roomId), entry[0], entry[1] === Estimate.View ? Estimate.View : Estimate.None);
    await this.publishToRoom(roomId);
  }

  public deleteRoom = async (roomId: string) => {
    const names = Object.keys(await this.getRoomEstimates(roomId));
    for (const name in names) await this.leaveRoom(roomId, name);
    await this.#redis.DEL(getRoomKey(roomId));
  }

  public getRoomEstimates = async (roomId: string) => this.#redis.HGETALL(getRoomKey(roomId));

  public publishToRoom = async (roomId: string) => this.#redis.PUBLISH(getRoomKey(roomId), JSON.stringify(await this.getRoomEstimates(roomId)));
}
