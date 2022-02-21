import React from 'react';
import { useAppState } from './useAppState';
import { Rooms } from './components/Rooms';
import { Estimates } from './components/Estimates';
import { Deets } from './components/Deets';

export const App: React.FC = () => {
  const state = useAppState();
  const { room, name } = state;

  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-xl font-bold'>Hello world!</h1>

      <div className={`font-bold ${state.connectionId !== undefined ? 'text-green-600' : 'text-red-600'}`}>
        {state.connectionId !== undefined ? 'connected' : 'not connected'}
      </div>

      <Deets name={name}/>

      {state.data !== undefined &&
        <Estimates estimates={state.data} room={room} name={name}/>}

      {state.rooms !== undefined && <Rooms rooms={state.rooms} room={room}/>}
    </div>
  );
}