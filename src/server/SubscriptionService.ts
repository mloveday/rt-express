import { RedisClientType } from 'redis';
import { StateService } from './StateService';
import { ConnectionState } from './ConnectionState';
import { getConnectionKey, getRoomKey, KEY_ROOMS } from './keys';
import { PubService } from './PubService';
import { MessageType } from '../MessageType';

// Handles subscriptions to channels
export class SubscriptionService {
  #stateService: StateService;
  #pubService: PubService;
  #state: ConnectionState;
  #connectionSubscriber: RedisClientType;
  #roomSubscriber: RedisClientType;
  #roomsSubscriber: RedisClientType;

  public constructor(stateService: StateService, pubService: PubService, state: ConnectionState) {
    this.#stateService = stateService;
    this.#pubService = pubService;
    this.#state = state;
    this.#connectionSubscriber = stateService.createSubscriber();
    this.#roomSubscriber = stateService.createSubscriber();
    this.#roomsSubscriber = stateService.createSubscriber();
  }

  public connect = async () =>  {
    await this.#connectionSubscriber.connect();
    await this.#roomsSubscriber.connect();
    await this.#roomSubscriber.connect();
    return this;
  }

  public subscribe = async () => {
    await this.#subscribeToConnectionUpdates();
    await this.#subscribeToRoomsListUpdates();
    await this.#subscribeToCurrentRoomUpdates();
    console.log(`[handler]: subscriptions created, sending connection message`)
    this.#pubService.sendMessage(MessageType.Connection, this.#state.connection);
    return this;
  }

  public unsubscribe = async () => {
    await this.#connectionSubscriber.unsubscribe();
    await this.#roomsSubscriber.unsubscribe();
    await this.#roomSubscriber.unsubscribe();
    return this;
  }

  #subscribeToRoom = async (id: string) => {
    if (this.#state.roomId !== undefined) {
      console.log(`[roomSubscriber]: ${this.#state.connectionId} subscribed to ${id}`);
      await this.#roomSubscriber.unsubscribe(getRoomKey(this.#state.roomId));
    }
    await this.#roomSubscriber.subscribe(getRoomKey(id), async (message) => {
      console.log(`[roomSubscriber]: ${this.#state.connectionId} received update message`, message);
      this.#pubService.sendMessage(MessageType.Room, JSON.parse(message));
    });
    this.#state.roomId = id;
  };

  #subscribeToConnectionUpdates = async () => {
    console.log(`[connectionSubscriber]: ${this.#state.connectionId} subscribing to connection`);
    await this.#connectionSubscriber.subscribe(getConnectionKey(this.#state.connectionId), (message) => {
      console.log(`[connectionSubscriber]: ${this.#state.connectionId} received ${message}`);
      const data = JSON.parse(message);
      if (data.roomId !== undefined) this.#subscribeToRoom(data.roomId);
      this.#state.name = data.name;
      this.#pubService.sendMessage(MessageType.Connection, data);
    });
  }

  #subscribeToRoomsListUpdates = async () => {
    console.log(`[roomsSubscriber]: ${this.#state.connectionId} subscribing to rooms`);
    this.#pubService.sendMessage(MessageType.Rooms, await this.#stateService.getRooms());
    await this.#roomsSubscriber.subscribe(KEY_ROOMS, async (message) => {
      // todo unsubscribe from room if current room has been deleted, send to client
      console.log(`[roomSubscriber]: received rooms update message`, message);
      this.#pubService.sendMessage(MessageType.Rooms, JSON.parse(message));
    });
  }

  #subscribeToCurrentRoomUpdates = async () => {
    if (this.#state.roomId !== undefined) {
      console.log(`[subscribeToRoom]: creating subscription for ${this.#state.connectionId} to ${this.#state.roomId}`);
      await this.#subscribeToRoom(this.#state.roomId);
      this.#pubService.sendMessage(MessageType.Room, await this.#stateService.getRoomEstimates(this.#state.roomId));
    }
  }
}