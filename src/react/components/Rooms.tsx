import { Room } from './Room';
import { createRoom } from '../api';
import React, { useState } from 'react';

export const Rooms: React.FC<{rooms: string[], room: string|undefined}> = ({rooms, room}) => {
  const [localRoom, setLocalRoom] = useState('');
  return (
    <div className='border rounded p-2 flex flex-col gap-2'>
      <h2 className='font-bold'>Rooms</h2>
      {rooms.map((r) => <Room key={r} id={r} roomId={room} />)}
      <div className='border rounded p-2'>
        <label className='flex items-center gap-2'>
          <span>New room</span>
          <input type="text" className='border rounded p-2' value={localRoom} onChange={(e) => setLocalRoom(e.target.value)}/>
        </label>
        <button className='border p-2' onClick={() => createRoom(localRoom)}>Create {localRoom}</button>
      </div>
    </div>
  );
}