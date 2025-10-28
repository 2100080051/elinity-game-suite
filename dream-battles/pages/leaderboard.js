import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Leaderboard() {
  const { data } = useSWR('/api/leaderboard', fetcher, { refreshInterval: 3000 });
  const scores = data || [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <div className="mt-6 glass">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm opacity-70">
              <th className="p-3">Rank</th>
              <th className="p-3">Player</th>
              <th className="p-3">Dream Points</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row, i) => (
              <tr key={row.player} className="border-t border-white/10">
                <td className="p-3">{i+1}</td>
                <td className="p-3 font-semibold">{row.player}</td>
                <td className="p-3">{row.points}</td>
              </tr>
            ))}
            {scores.length===0 && (
              <tr><td className="p-6 opacity-70" colSpan={3}>No scores yet. Start a duel!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
