import React from 'react';
import { makeEstimate } from '../api';

export const EstimateCards: React.FC<{ roomId: string }> = ({ roomId }) => {
  const groups = [
    ['1', '1+'],
    ['2-', '2', '2+'],
    ['3-', '3', '3+'],
    ['5-', '5', '5+'],
    ['8-', '8']
  ];
  return (
    <>
      {groups.map(group =>
        <div className='flex gap-2 border p-2'>
          {group.map((estimate) =>
            <button key={estimate} className='border p-4 rounded'
                    onClick={() => makeEstimate(roomId, estimate)}>
              {estimate}
            </button>)}
        </div>)}
    </>
  );
}