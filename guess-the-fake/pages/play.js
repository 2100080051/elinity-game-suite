import { useEffect, useState } from 'react';

function Bullet({ idx, text, onVote, disabled, isLie, showResult, votesCount }){
	return (
		<div className={`bullet ${showResult && isLie ? 'bad' : ''} animate-fadeUp`}>
			<div className="font-medium">❖ {text}</div>
			{onVote && (
				<button className="vote-btn btn" disabled={disabled} onClick={onVote}>
					{disabled ? 'Voted' : 'Guess this one'}
				</button>
			)}
			{showResult && (
				<div className="text-xs text-white/70 mt-1">Votes: {votesCount||0}</div>
			)}
		</div>
	);
}

export default function Play(){
	const [stage, setStage] = useState('seed'); // 'seed' | 'reveal' | 'guess' | 'results'
	const [seed, setSeed] = useState('I once performed music in a subway station.');
	const [playerId, setPlayerId] = useState('Player A');
	const [round, setRound] = useState(null);
	const [archive, setArchive] = useState([]);
	const [leaderboard, setLeaderboard] = useState({});
	const [votes, setVotes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [countdown, setCountdown] = useState(5);
	const [confetti, setConfetti] = useState(false);

	async function refresh(){
		const r = await fetch('/api/state');
		if(r.ok){ const d = await r.json(); setArchive(d.archive||[]); setLeaderboard(d.leaderboard||{}); }
	}
	useEffect(()=> { refresh(); },[]);

	async function start(){
		setLoading(true);
		try{
			const res = await fetch('/api/round/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, seed_text: seed }) });
			const data = await res.json();
			if(!res.ok) throw new Error(data.error||'Failed');
			setRound(data.round);
			setStage('reveal');
		}catch(e){ alert(e.message);}finally{ setLoading(false); }
	}

	function toGuess(){
		setStage('guess');
		setCountdown(5);
		const timer = setInterval(()=> setCountdown(c=> {
			if(c<=1){ clearInterval(timer); }
			return c-1;
		}), 1000);
	}

	async function submitVotes(v){
		if(!round) return;
		const res = await fetch(`/api/round/${round.id}/vote`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ votes: v }) });
		const data = await res.json();
		if(!res.ok) return alert(data.error||'Vote failed');
		setVotes(v);
		const r2 = await fetch(`/api/round/${round.id}/reveal`, { method:'POST' });
		const d2 = await r2.json();
		if(!r2.ok) return alert(d2.error||'Reveal failed');
		setRound(d2.round);
		setStage('results');
		setConfetti(true); setTimeout(()=> setConfetti(false), 1800);
		await refresh();
	}

	const items = round?.items;
	const lines = items ? [items.truths[0], items.truths[1], items.lie] : [];
	const correctIdx = items?.correct_index;
	const tally = round?.result?.votes?.reduce((acc,v)=>{ acc[v.guessed_index]=(acc[v.guessed_index]||0)+1; return acc; },{})||{};

	return (
		<div className="grid md:grid-cols-[1fr,340px] gap-5">
			{confetti && (
				<div className="confetti">
					{Array.from({length:40}).map((_,i)=> (
						<span key={i} style={{ left: (i*2.5)%100+'%', background: ['#a5f3fc','#ddd6fe','#fecdd3','#bbf7d0'][i%4], animationDelay: (i%10)*30+'ms' }} />
					))}
				</div>
			)}
			{/* Left: Active Panel */}
			<div className="space-y-5">
				<div className="panel stage">
					<div className="panel-inner">
						{stage==='seed' && (
							<div className="space-y-3 animate-fadeUp">
								<div className="text-xl font-semibold">Seed Stage</div>
								<div className="text-white/70">Type a short anecdote or fun fact to spark the round.</div>
								<div className="grid md:grid-cols-2 gap-3">
									<input className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/60" value={playerId} onChange={e=> setPlayerId(e.target.value)} />
									<input className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/60" value={seed} onChange={e=> setSeed(e.target.value)} />
								</div>
								<button className="btn btn-primary" onClick={start} disabled={loading}>{loading? 'Generating…':'Submit Seed'}</button>
							</div>
						)}

						{stage==='reveal' && round && (
							<div className="space-y-3 animate-fadeUp">
								<div className="text-xl font-semibold">Player {round.seed.player_id}'s Secret</div>
								<div className="italic text-white/80">“{round.seed.seed_text}”</div>
								<div className="grid gap-3">
									{lines.map((t,i)=> (
										<div className="flex items-start gap-3">
											<div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-lilac-100/30 border border-white/15 text-sm">{i+1}</div>
											<Bullet key={i} idx={i+1} text={t} />
										</div>
									))}
								</div>
								<div className="flex gap-3">
									<button className="btn btn-primary" onClick={toGuess}>Start Guessing</button>
									<button className="btn btn-secondary" onClick={()=> setStage('seed')}>New Seed</button>
								</div>
							</div>
						)}

						{stage==='guess' && round && (
							<div className="space-y-3 animate-fadeUp">
								<div className="text-xl font-semibold">Guessing Stage</div>
								<div className="text-white/80">Pick which line you think is the fake.</div>
								<div className="flex items-center gap-2 text-sm text-white/70">
									<div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-mint-200/30 border border-white/15">{Math.max(countdown,0)}</div>
									<span>seconds to lock</span>
								</div>
								<div className="grid gap-3">
									{lines.map((t,i)=> (
										<div key={i} className="flex items-start gap-3">
											<div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-lilac-100/30 border border-white/15 text-sm">{i+1}</div>
											<Bullet idx={i+1} text={t} onVote={(e)=> {
												const rect = e.currentTarget.getBoundingClientRect();
												const x = ((e.clientX - rect.left)/rect.width)*100;
												const y = ((e.clientY - rect.top)/rect.height)*100;
												e.currentTarget.style.setProperty('--x', x+'%');
												e.currentTarget.style.setProperty('--y', y+'%');
												submitVotes([{player_id:'Player B', guessed_index:i+1},{player_id:'Player C', guessed_index:i+1}]);
											}} />
										</div>
									))}
								</div>
							</div>
						)}

						{stage==='results' && round && (
							<div className="space-y-3 animate-fadeUp">
								<div className="text-xl font-semibold">Results</div>
								<div className="italic text-white/80">“{round.seed.seed_text}”</div>
								<div className="grid gap-3">
									{lines.map((t,i)=> (
										<div key={i} className="flex items-start gap-3">
											<div className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm ${i+1===correctIdx? 'bg-emerald-400/20 border-emerald-300/40':'bg-rose-400/20 border-rose-300/40'}`}>{i+1}</div>
											<Bullet idx={i+1} text={t} showResult isLie={i+1===correctIdx} votesCount={tally[i+1]||0} />
										</div>
									))}
								</div>
								<div className="text-white/80">Correct: #{correctIdx}. Scores: {Object.entries(round.result?.scores||{}).map(([k,v])=> `${k}: ${v}`).join(', ')||'—'}</div>
								<div className="flex gap-3">
									<button className="btn btn-primary" onClick={()=> { setStage('seed'); setRound(null); setVotes([]); }}>Next Round</button>
									<a className="btn btn-secondary" href="#archive">View Archive</a>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Right: Archive */}
			<div id="archive" className="panel md:sticky md:top-20 h-fit">
				<div className="panel-inner">
					<div className="text-lg font-semibold">Archive</div>
					<div className="text-white/70 text-sm">Past rounds and secrets</div>
					<div className="mt-3 space-y-2">
						{archive.length===0 && <div className="text-white/70 text-sm">No rounds yet.</div>}
						{archive.map(a=> (
							<div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
								<div className="font-medium">Player {a.seed.player_id}</div>
								<div className="text-white/80 text-sm truncate">“{a.seed.seed_text}”</div>
								<div className="mt-1 text-xs text-white/60">Lie was #{a.items.correct_index}</div>
							</div>
						))}
					</div>
					{Object.keys(leaderboard||{}).length>0 && (
						<div className="mt-4">
							<div className="text-lg font-semibold">Leaderboard</div>
							<div className="space-y-1 mt-1">
								{Object.entries(leaderboard).map(([p,sc])=> (
									<div key={p} className="flex items-center justify-between text-sm">
										<div className="text-white/80">{p}</div>
										<div className="font-semibold">{sc}</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
