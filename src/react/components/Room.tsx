import React from 'react';
import { deleteRoom, joinRoom, viewRoom } from '../api';

export const Room: React.FC<{id: string, roomId?: string}> = ({id, roomId}) => {
  return (
    <div className='flex gap-2 items-center border rounded p-2'>
      <span className={`${roomId === id ? 'font-bold' : ''}`}>{id}</span>
      <button className='border p-2' onClick={() => joinRoom(id)}>Join</button>
      <button className='border p-2' onClick={() => viewRoom(id)}>View</button>
      <button className='border p-2' onClick={() => deleteRoom(id)}>Delete</button>
    </div>
  );
}