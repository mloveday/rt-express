import { Response } from 'express';
import { MessageType } from '../MessageType';

// Sends SSE messages to the connected client
export class PubService {
  #res: Response;

  constructor(res: Response) {
    this.#res = res;
  }

  public sendMessage = (type: MessageType, message: any) => this.#res.write(`data: ${JSON.stringify({
    type,
    message
  })}\n\n`);
}
