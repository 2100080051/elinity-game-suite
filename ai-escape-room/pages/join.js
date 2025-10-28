import { useState } from 'react';

export default function Join() {
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  async function doJoin() {
    try {
      if (!room) return;
      const res = await fetch('/api/rooms/join', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: room }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to join');
      location.href = `/room?id=${room}`;
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-bold">Join Room</h1>
      <div className="panel mt-6 grid gap-3">
        <input value={room} onChange={(e)=>setRoom(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10" placeholder="Room ID" />
        <button onClick={doJoin} className="glass px-4 py-2">Join</button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </div>
    </div>
  );
}
