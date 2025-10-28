import { useEffect, useRef, useState } from 'react';

function useTimer(active, seconds, onDone){
	const [left, setLeft] = useState(seconds);
	useEffect(()=>{
		if (!active) return setLeft(seconds);
		setLeft(seconds);
		const t = setInterval(()=>setLeft((x)=>{
			if (x<=1){ clearInterval(t); onDone?.(); return 0; }
			return x-1;
		}), 1000);
		return ()=>clearInterval(t);
	}, [active, seconds]);
	return left;
}

export default function Play(){
	const [round, setRound] = useState(null);
	const [gallery, setGallery] = useState([]); // memes
	const [captions, setCaptions] = useState([]);
	const [voting, setVoting] = useState(false);
	const [leaderboard, setLeaderboard] = useState(null);
	const [error, setError] = useState('');
	const inputRef = useRef(null);
	const timeLeft = useTimer(voting, 30, async ()=>{
		if (!round) return; setVoting(false);
		const r = await fetch(`/api/rounds/${round.round_id}/finalize`, { method:'POST' });
		const j = await r.json();
		if (!r.ok) return setError(j.error||'Failed to finalize');
		setLeaderboard(j);
	});

	const newPrompt = async () => {
		setError(''); setLeaderboard(null);
		const r = await fetch('/api/rounds', { method: 'POST' });
		const j = await r.json();
		if (!r.ok) return setError(j.error || 'Failed to start round');
		setRound(j);
		setGallery([]); setCaptions([]); setVoting(false);
	};

	const sendCaption = async () => {
		const text = inputRef.current?.value?.trim();
		if (!text || !round) return;
		inputRef.current.value = '';
		const r = await fetch(`/api/rounds/${round.round_id}/caption`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text })
		});
		const j = await r.json();
		if (!r.ok) return setError(j.error||'Failed to add caption');
		setCaptions(j.captions);
		setGallery(j.memes);
	};

	const vote = async (meme_id, delta) => {
		if (!round || !voting) return;
		const r = await fetch(`/api/rounds/${round.round_id}/vote`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meme_id, delta })
		});
		if (!r.ok) { const j = await r.json(); setError(j.error||'Vote failed'); }
	};

	useEffect(()=>{ newPrompt(); }, []);

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-5 gap-6">
			<section className="lg:col-span-2 card p-5">
				<h2 className="text-xl font-semibold mb-3">Prompt Card</h2>
				{!round ? <div className="opacity-80">Loading…</div> : (
					<div>
						<div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10">
							{round.prompt?.thumb ? <img alt="prompt" src={round.prompt.thumb} className="w-full h-full object-cover"/> : null}
						</div>
						<div className="mt-3">
							<div className="text-sm opacity-80">Seed</div>
							<div className="text-lg font-medium">{round.prompt?.seed_phrase}</div>
							<div className="text-sm opacity-80 mt-1">Idea</div>
							<div className="text-base">{round.prompt?.image_idea}</div>
						</div>
						<div className="mt-4 flex gap-3">
							<button className="btn" onClick={newPrompt}>New Prompt</button>
							<button className="btn-ghost" disabled={voting || !gallery.length} onClick={()=>setVoting(true)}>Vote Now</button>
							{voting ? <div className="ml-auto opacity-80">⏱️ {timeLeft}s</div> : null}
						</div>
					</div>
				)}
			</section>

			<section className="lg:col-span-3">
				<div className="card p-5">
					<h2 className="text-xl font-semibold mb-3">Meme Gallery</h2>
					{!gallery.length ? <div className="opacity-80">No memes yet — add a caption!</div> : (
						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{gallery.map(m => (
								<div key={m.id} className={`relative group border border-white/10 rounded-xl overflow-hidden bg-white/5`}>
									<img src={m.url} alt={m.id} className="w-full h-auto"/>
									<div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
										<button onClick={()=>vote(m.id, 1)} disabled={!voting} className="px-3 py-1 rounded-lg bg-green-500/80 hover:bg-green-500 text-black">▲</button>
										<button onClick={()=>vote(m.id, -1)} disabled={!voting} className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-black">▼</button>
									</div>
									{leaderboard?.winner?.meme_id === m.id ? (
										<div className="absolute inset-0 ring-4 ring-yellow-300 rounded-xl pointer-events-none"></div>
									) : null}
								</div>
							))}
						</div>
					)}
				</div>
				<div className="card p-5 mt-4">
					<div className="flex gap-3 items-center">
						<input ref={inputRef} type="text" placeholder="Type your caption…" className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10" onKeyDown={(e)=>{ if (e.key==='Enter') sendCaption(); }}/>
						<button className="btn" onClick={sendCaption}>Send</button>
					</div>
					{leaderboard ? (
						<div className="mt-4">
							<div className="font-medium mb-1">Results</div>
							<div className="text-sm opacity-80">Winner: {leaderboard.winner ? leaderboard.winner.meme_id : '—'}</div>
							<div className="mt-2 text-sm opacity-80">Leaderboard:</div>
							<ul className="text-sm">
								{(leaderboard.leaderboard||[]).map((e)=> (
									<li key={e.meme_id}>{e.meme_id} — {e.score}</li>
								))}
							</ul>
							<button className="btn mt-3" onClick={newPrompt}>Next Meme</button>
						</div>
					) : null}
					{error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
				</div>
			</section>
		</div>
	);
}
