import { MessageType } from '../MessageType';
import { useEffect, useReducer } from 'react';
import { Urls } from './api';

type State = {
  status: 'empty' | 'done';
  connectionId?: string; // connection id for user
  room?: string;
  name?: string; // user's display name
  rooms?: string[]; // list of all rooms
  data?: Record<string, string>; // current room's data
}
type Action = {
  type: MessageType;
  payload: any;
}
export const reducer = (state: State, action: Action): State => {
  console.log(`handling action`, action);
  switch (action.type) {
    case MessageType.Connection:
      return {
        ...state,
        connectionId: action.payload.connectionId,
        name: action.payload.name,
        room: action.payload.roomId
      }
    case MessageType.Rooms:
      return { ...state, rooms: action.payload }
    case MessageType.Room:
      return { ...state, data: action.payload }
    default:
      return state;
  }
}
export const initialState: State = { status: 'empty', data: undefined };

export const useAppState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    const sse = new EventSource(Urls.Connect);
    sse.onmessage = e => {
      const data = JSON.parse(e.data);
      console.log(`received message`, data);
      dispatch({ type: data.type, payload: data.message, })
    }
    sse.onerror = e => {
      console.log(`sse connection error, closing connection...`, e);
      sse.close();
    }
    return () => {
      console.log(`closing connection`);
      sse.close();
    }
  }, []);

  return state
}