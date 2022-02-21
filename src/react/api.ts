import { JoinType } from '../JoinType';

export enum Urls {
  Connect = '/api/connect',
  Name = '/api/connection/name',
  Room = '/api/room',
}

export const createRoom = async (roomId: string) => {
  console.log(`Creating room ${roomId}`);
  await fetch(Urls.Room, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(() => console.log(`Request to create room ${roomId} complete`));
}

export const joinRoom = async (roomId: string) => {
  console.log(`Joining room ${roomId}`);
  await fetch(Urls.Room, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, type: JoinType.Join })
  }).then(() => console.log(`Request to connect to room ${roomId} complete`));
}

export const viewRoom = async (roomId: string) => {
  console.log(`Viewing room ${roomId}`);
  await fetch(Urls.Room, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, type: JoinType.View })
  }).then(() => console.log(`Request to view room ${roomId} complete`));
}

const leaveRoom = async (roomId: string) => {
  console.log(`Leaving room ${roomId}`);
  await fetch(Urls.Room, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, type: JoinType.Leave })
  }).then(() => console.log(`Request to leave room ${roomId} complete`));
}

export const deleteRoom = async (roomId: string) => {
  console.log(`Deleting room ${roomId}`);
  await fetch(Urls.Room, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(() => console.log(`Request to delete room ${roomId} complete`));
}

export const makeEstimate = async (roomId: string, estimate: string) => {
  console.log(`Estimating ${roomId}`);
  await fetch(Urls.Room, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estimate })
  }).then(() => console.log(`Request to make estimate in room ${roomId} complete`));
}

export const saveName = async (name: string) => {
  console.log(`Naming myself ${name}`);
  await fetch(Urls.Name, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(() => console.log(`Request to name myself ${name} complete`));
}