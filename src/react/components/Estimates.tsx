import React from 'react';
import { joinRoom } from '../api';
import { Estimate } from '../../server/Estimate';
import { EstimateCards } from './EstimateCards';

type Props = { connectedRoom: string | undefined, connectedName: string | undefined, estimates: Record<string, string> };

export const Estimates: React.FC<Props> = ({ connectedRoom, connectedName, estimates }) => {
  return (
    <div className='flex flex-col gap-2'>
      <h2>Current room: {connectedRoom}</h2>
      {connectedRoom !== undefined &&
        <button className='border p-2' onClick={() => joinRoom(connectedRoom)}>Leave</button>}
      <div className='flex gap-4'>
        {Object.entries(estimates).map(([name, estimate]) => <div
          className='border rounded p-2 flex flex-col gap-2'>
          <div className='flex justify-center'>{name}</div>
          <div
            className='flex justify-center'>{estimate === Estimate.None ? '🕑' : (estimate === Estimate.View ? '👀' : estimate)}</div>
        </div>)}
      </div>
      <div className='flex gap-4'>
        {connectedRoom !== undefined && true && connectedName !== undefined && estimates[connectedName] !== Estimate.View
          && <EstimateCards roomId={connectedRoom}/>}
      </div>
    </div>
  )
}