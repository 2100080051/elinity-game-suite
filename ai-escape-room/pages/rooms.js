import useSWR from 'swr';
const fetcher = (u) => fetch(u).then(r=>r.json());

export default function Rooms() {
  const { data } = useSWR('/api/rooms', fetcher, { refreshInterval: 3000 });
  const rooms = data || [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Saved Plays</h1>
      <div className="panel mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="opacity-70 text-left">
              <th className="p-2">Room</th>
              <th className="p-2">Players</th>
              <th className="p-2">Points</th>
              <th className="p-2">Time Left</th>
              <th className="p-2">Open</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-2">#{r.id}</td>
                <td className="p-2">{(r.players||[]).join(', ')}</td>
                <td className="p-2">{r.points}</td>
                <td className="p-2">{r.time_left}s</td>
                <td className="p-2"><a className="underline" href={`/room?id=${r.id}`}>Open</a></td>
              </tr>
            ))}
            {rooms.length===0 && <tr><td className="p-4 opacity-70" colSpan={5}>No rooms yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
