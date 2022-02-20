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
    await this.publishRoomChange();
  };

  public getRooms = () => this.#redis.SMEMBERS(KEY_ROOMS);

  public publishRoomChange = async () => this.#redis.PUBLISH(KEY_ROOMS, JSON.stringify(await this.getRooms()));

  public setConnectionName = async (connectionId: string, name: string) => {
    const connection = await this.getConnection(connectionId);

    // update name in current room
    const roomKey = getRoomKey(connection.roomId);
    await this.#redis.HSET(roomKey, name, (await this.getRoomEstimates(connection.roomId))[connection.name] ?? Estimate.None)
    await this.#redis.HDEL(roomKey, connection.name);
    await this.publishToRoom(connection.roomId);

    // update connection
    return this.#redis.HSET(getConnectionKey(connectionId), 'name', name);
  };

  public setConnectionRoom = async (connectionId: string, roomId: string) => {
    console.log(`[setConnectionRoom]: adding ${connectionId} to ${roomId}`)
    const connection = await this.getConnection(connectionId);
    // update current connection
    await this.#redis.HSET(getConnectionKey(connectionId), 'roomId', roomId);
    await this.publishConnectionChange(connectionId);
    // leave old room
    await this.leaveRoom(connection.roomId, connection.name);
    await this.publishToRoom(connection.roomId);
    // join new room
    await this.joinRoom(roomId, connection.name);
    await this.publishToRoom(roomId);
  };

  public getConnection = async (connectionId: string): Promise<Record<string, string>> => ({
    ...(await this.#redis.HGETALL(getConnectionKey(connectionId))),
    connectionId,
  });

  public publishConnectionChange = async (connectionId: string) => this.#redis.PUBLISH(getConnectionKey(connectionId), JSON.stringify(await this.getConnection(connectionId)));

  public leaveRoom = (roomId: string, name: string) => this.#redis.HDEL(getRoomKey(roomId), name);

  public viewRoom = (roomId: string, name: string) => this.#redis.HSET(getRoomKey(roomId), name, Estimate.View);

  public joinRoom = (roomId: string, name: string) => this.#redis.HSET(getRoomKey(roomId), name, Estimate.None);

  public makeEstimate = (roomId: string, name: string, estimate: number) => this.#redis.HSET(getRoomKey(roomId), name, estimate);

  public resetRoom = async (roomId: string) => {
    const names = Object.keys(await this.getRoomEstimates(roomId));
    await Promise.all(names.map((name) => this.#redis.HSET(getRoomKey(roomId), name, -1)));
  }

  public deleteRoom = (roomId: string) => this.#redis.DEL(getRoomKey(roomId));

  public getRoomEstimates = (roomId: string) => this.#redis.HGETALL(getRoomKey(roomId));

  public publishToRoom = async (roomId: string) => this.#redis.PUBLISH(getRoomKey(roomId), JSON.stringify(await this.getRoomEstimates(roomId)));
}
