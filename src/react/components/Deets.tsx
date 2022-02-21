import React, { useState } from 'react';
import { saveName } from '../api';

export const Deets: React.FC<{name: string|undefined}> = ({name}) => {
  const [localName, setLocalName] = useState('');
  return (
    <div className='border rounded p-2'>
      <label className='flex items-center gap-2'>
        <span>Name</span>
        <input type="text" className='border rounded p-2' value={localName} onChange={(e) => setLocalName(e.target.value)}/>
        <button className='border p-2' onClick={() => saveName(localName)}>Save</button>
      </label>
      {name !== undefined && <div className=''>{name}</div>}
    </div>
  );
}