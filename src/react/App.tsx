import React, { useEffect, useReducer } from 'react';

type State = {
  status: 'empty' | 'done';
  data: number | undefined;
}

type Action = {
  type: 'init' | 'update';
  payload: number;
}

const reducer = (state: State, action: Action): State => {
  console.log(`handling action`, action);
  switch (action.type) {
    case 'init':
    case 'update':
      return {
        status: 'done',
        data: action.payload,
      }
    default:
      return state;
  }
}

const initialState: State = { status: 'empty', data: undefined };

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const sse = new EventSource('/api/rt');
    sse.onmessage = e => {
      const data = JSON.parse(e.data);
      console.log(`received message`, data);
      dispatch({ type: data.type, payload: data.message, })
    }
    return () => {
      console.log(`closing connection`);
      sse.close();
    }
  }, []);

  return (
    <div>
      <h1>Hello world!</h1>
      <p>Counter value is currently {state.data ?? '[not initialised]'}</p>
    </div>
  );
}