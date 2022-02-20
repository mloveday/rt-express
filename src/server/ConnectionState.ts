// contains current state
// todo replace with calls to redis to get this
export class ConnectionState {
  #connectionId: string;
  #name?: string;
  #roomId?: string;

  constructor(connectionId: string, name: string, roomId: string) {
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

  get name(): string|undefined {
    return this.#name;
  }

  set name(value: string|undefined) {
    this.#name = value;
  }

  get roomId(): string|undefined {
    return this.#roomId;
  }

  set roomId(value: string|undefined) {
    this.#roomId = value;
  }

  get connection() {
    return {
      connectionId: this.connectionId,
      name: this.name,
      roomId: this.roomId,
    };
  }
}