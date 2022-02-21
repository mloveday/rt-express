import { Room } from './Room';
import { createRoom } from '../api';
import React, { useState } from 'react';

export const Rooms: React.FC<{rooms: string[], connectedRoom: string|undefined}> = ({rooms, connectedRoom}) => {
  const [room, setRoom] = useState('');
  return (
    <div className='border rounded p-2 flex flex-col gap-2'>
      <h2 className='font-bold'>Rooms</h2>
      {rooms.map((r) => <Room key={r} id={r} roomId={connectedRoom} />)}
      <div className='border rounded p-2'>
        <label className='flex items-center gap-2'>
          <span>New room</span>
          <input type="text" className='border rounded p-2' value={room} onChange={(e) => setRoom(e.target.value)}/>
        </label>
        <button className='border p-2' onClick={() => createRoom(room)}>Create {room}</button>
      </div>
    </div>
  );
}