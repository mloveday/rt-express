import React, { useEffect, useReducer, useState } from 'react';
import { MessageType } from '../MessageType';
import { JoinType } from '../JoinType';

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

const reducer = (state: State, action: Action): State => {
  console.log(`handling action`, action);
  switch (action.type) {
    case MessageType.Connection:
      return {
        ...state,
        connectionId: action.payload.connectionId ?? state.connectionId,
        name: action.payload.name ?? state.name,
        room: action.payload.roomId ?? state.room
      }
    case MessageType.Rooms:
      return { ...state, rooms: action.payload }
    case MessageType.Room:
      return { ...state, data: action.payload }
    default:
      return state;
  }
}

const initialState: State = { status: 'empty', data: undefined };

enum Urls {
  Connect = '/api/connect',
  Name = '/api/connection/name',
  Room = '/api/room',
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const createRoom = async (roomId: string) => {
    console.log(`Creating room ${roomId}`);
    await fetch(Urls.Room, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId })
    }).then(() => console.log(`Request to create room ${roomId} complete`));
  }

  const joinRoom = async (roomId: string) => {
    console.log(`Joining room ${roomId}`);
    await fetch(Urls.Room, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, type: JoinType.Join })
    }).then(() => console.log(`Request to connect to room ${roomId} complete`));
  }

  const viewRoom = async (roomId: string) => {
    console.log(`Viewing room ${roomId}`);
    await fetch(Urls.Room, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, type: JoinType.View })
    }).then(() => console.log(`Request to view room ${roomId} complete`));
  }

  const leaveRoom = async (roomId: string) => {
    console.log(`Leaving room ${roomId}`);
    await fetch(Urls.Room, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, type: JoinType.Leave })
    }).then(() => console.log(`Request to leave room ${roomId} complete`));
  }

  const deleteRoom = async (roomId: string) => {
    console.log(`Deleting room ${roomId}`);
    await fetch(Urls.Room, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId })
    }).then(() => console.log(`Request to delete room ${roomId} complete`));
  }

  const makeEstimate = async (roomId: string, estimate: string) => {
    console.log(`Estimating ${roomId}`);
    await fetch(Urls.Room, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimate })
    }).then(() => console.log(`Request to make estimate in room ${roomId} complete`));
  }

  const saveName = async (name: string) => {
    console.log(`Naming myself ${name}`);
    await fetch(Urls.Name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(() => console.log(`Request to name myself ${name} complete`));
  }

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

  const {
    room: connectedRoom,
    name: connectedName,
  } = state;

  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-xl font-bold'>Hello world!</h1>

      <div
        className={`font-bold ${state.connectionId !== undefined ? 'text-green-600' : 'text-red-600'}`}>{state.connectionId !== undefined ? 'connected' : 'not connected'}</div>

      <div className='border rounded p-2'>
        <label className='flex items-center gap-2'>
          <span>Name</span>
          <input type="text" className='border rounded p-2' value={name} onChange={(e) => setName(e.target.value)}/>
          <button className='border p-2' onClick={() => saveName(name)}>Save</button>
        </label>
        {connectedName !== undefined && <div className=''>{connectedName}</div>}
      </div>

      {state.data !== undefined && (
        <div className='flex flex-col gap-2'>
          <h2>Current room: {connectedRoom}</h2>
          {connectedRoom !== undefined &&
            <button className='border p-2' onClick={() => joinRoom(connectedRoom)}>Leave</button>}
          <div className='flex gap-4'>
            {Object.entries(state.data).map(([name, estimate]) => <div
              className='border rounded p-2 flex flex-col gap-2'>
              <div className='flex justify-center'>{name}</div>
              <div
                className='flex justify-center'>{estimate === '-1' ? '🕑' : (estimate === '-2' ? '👀' : estimate)}</div>
            </div>)}
          </div>
          <div className='flex gap-4'>
            {connectedRoom !== undefined && [['1', '1+'], ['2-', '2', '2+'], ['3-', '3', '3+'], ['5-', '5', '5+'], ['8-', '8']].map((group) =>
              <div className='flex gap-2 border p-2'>
                {group.map((estimate) =>
                  <button key={estimate} className='border p-4 rounded' onClick={() => makeEstimate(connectedRoom, estimate)}>
                    {estimate}
                  </button>)}
              </div>)}
          </div>
        </div>
      )}

      {state.rooms !== undefined && <div className='border rounded p-2 flex flex-col gap-2'>
        <h2 className='font-bold'>Rooms</h2>
        {state.rooms.map((r) => <div key={r} className='flex gap-2 items-center border rounded p-2'>
          <span className={`${state.room === r ? 'font-bold' : ''}`}>{r}</span>
          <button className='border p-2' onClick={() => joinRoom(r)}>Join</button>
        </div>)}
        <div className='border rounded p-2'>
          <label className='flex items-center gap-2'>
            <span>New room</span>
            <input type="text" className='border rounded p-2' value={room} onChange={(e) => setRoom(e.target.value)}/>
          </label>
          <button className='border p-2' onClick={() => createRoom(room)}>Create {room}</button>
        </div>
      </div>}
    </div>
  );
}