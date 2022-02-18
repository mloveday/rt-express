import React, {useEffect, useReducer, useState} from 'react';

type State = {
  status: 'empty' | 'done';
  connectionId?: string; // connection id for user
  room?: string;
  name?: string; // user's display name
  rooms?: string[]; // list of all rooms
  data?: Record<string, string>; // current room's data
}

type Action = {
  type: 'init' | 'update' | 'connection' | 'room' | 'rooms';
  payload: any;
}

const reducer = (state: State, action: Action): State => {
  console.log(`handling action`, action);
  switch (action.type) {
    case 'connection':
      return {
        ...state,
        connectionId: action.payload.connectionId ?? state.connectionId,
        name: action.payload.name ?? state.name,
        room: action.payload.roomId ?? state.room
      }
    case 'rooms':
      return {...state, rooms: action.payload}
    case 'room':
      return {...state, data: action.payload }
    default:
      return state;
  }
}

const initialState: State = { status: 'empty', data: undefined };

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const joinRoom = async (roomId: string) => {
    console.log(`Joining room ${roomId}`);
    await fetch('/api/join-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId: state.connectionId, roomId })
    }).then(() => console.log(`Request to connect to room ${roomId} complete`));
  }

  const createRoom = async (roomId: string) => {
    console.log(`Joining room ${roomId}`);
    await fetch('/api/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId: state.connectionId, roomId })
    }).then(() => console.log(`Request to connect to room ${roomId} complete`));
  }

  const saveName = async (name: string) => {
    console.log(`Naming myself ${name}`);
    await fetch('/api/name-myself', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId: state.connectionId, name })
    }).then(() => console.log(`Request to name myself ${name} complete`));
  }

  useEffect(() => {
    const sse = new EventSource('/api/rt');
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

  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-xl font-bold'>Hello world!</h1>

      <div className={`font-bold ${state.connectionId !== undefined ? 'text-green-600' : 'text-red-600'}`}>{state.connectionId !== undefined ? 'connected' : 'not connected'}</div>

      <div className='border rounded p-2'>
        <label className='flex items-center gap-2'>
          <span>Name</span>
          <input type="text" className='border rounded p-2' value={name} onChange={(e) => setName(e.target.value)} />
          <button className='border p-2' onClick={() => saveName(name)}>Save</button>
        </label>
        {state.name !== undefined && <div className=''>{state.name}</div>}
      </div>

      {state.rooms !== undefined && <div className='border rounded p-2 flex flex-col gap-2'>
        <h2 className='font-bold'>Name</h2>
        {state.rooms.map((r) => <div key={r} className='flex gap-2 items-center border rounded p-2'>
          <span className={`${state.room === r ? 'font-bold' : ''}`}>{r}</span>
          <button className='border p-2' onClick={() => joinRoom(r)}>Join {r}</button>
        </div>)}
        <div className='border rounded p-2'>
          <label className='flex items-center gap-2'>
            <span>New room</span>
            <input type="text" className='border rounded p-2' value={room} onChange={(e) => setRoom(e.target.value)} />
          </label>
          <button className='border p-2' onClick={() => createRoom(room)}>Create {room}</button>
        </div>
      </div>}
    </div>
  );
}