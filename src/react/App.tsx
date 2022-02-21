import React from 'react';
import { useAppState } from './useAppState';
import { Rooms } from './components/Rooms';
import { Estimates } from './components/Estimates';
import { Deets } from './components/Deets';

export const App: React.FC = () => {
  const state = useAppState();

  const {
    room: connectedRoom,
    name: connectedName,
  } = state;

  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-xl font-bold'>Hello world!</h1>

      <div className={`font-bold ${state.connectionId !== undefined ? 'text-green-600' : 'text-red-600'}`}>
        {state.connectionId !== undefined ? 'connected' : 'not connected'}
      </div>

      <Deets connectedName={connectedName}/>

      {state.data !== undefined &&
        <Estimates estimates={state.data} connectedRoom={connectedRoom} connectedName={connectedName}/>}

      {state.rooms !== undefined && <Rooms rooms={state.rooms} connectedRoom={connectedRoom}/>}
    </div>
  );
}