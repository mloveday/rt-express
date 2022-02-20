// contains current state
// todo replace with calls to redis to get this
export class ConnectionState<T = string|undefined> {
  #connectionId: string;
  #name: T;
  #roomId: T;

  constructor(connectionId: string, name: T, roomId: T) {
    this.#connectionId = connectionId;
    this.#name = name;
    this.#roomId = roomId;
  }

  public canJoinRoom = (): boolean => this.name !== undefined;

  public isInRoom = () => this.roomId !== undefined && this.name !== undefined;

  get connectionId(): string {
    return this.#connectionId;
  }

  set connectionId(value: string) {
    this.#connectionId = value;
  }

  get name(): T {
    return this.#name;
  }

  set name(value: T) {
    this.#name = value;
  }

  get roomId(): T {
    return this.#roomId;
  }

  set roomId(value: T) {
    this.#roomId = value;
  }

  get connection() {
    return {
      connectionId: this.connectionId,
      name: this.name,
      roomId: this.roomId,
    };
  }

  isFullConnectionState = (): this is ConnectionState<string> => this.#name !== undefined && this.#roomId !== undefined;
}