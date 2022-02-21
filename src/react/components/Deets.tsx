import React, { useState } from 'react';
import { saveName } from '../api';

export const Deets: React.FC<{connectedName: string|undefined}> = ({connectedName}) => {
  const [name, setName] = useState('');
  return (
    <div className='border rounded p-2'>
      <label className='flex items-center gap-2'>
        <span>Name</span>
        <input type="text" className='border rounded p-2' value={name} onChange={(e) => setName(e.target.value)}/>
        <button className='border p-2' onClick={() => saveName(name)}>Save</button>
      </label>
      {connectedName !== undefined && <div className=''>{connectedName}</div>}
    </div>
  );
}