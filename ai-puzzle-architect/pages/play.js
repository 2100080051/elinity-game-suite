import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function Markdown({text=''}){ return <div className="prose max-w-none" dangerouslySetInnerHTML={{__html: text.replace(/\n/g,'<br/>')}}/> }

function WordAnswer({value,setValue,onSubmit}){
  return (
    <div className="flex gap-2 mt-3">
      <input className="input flex-1" value={value||''} placeholder="Your answer" onChange={e=>setValue(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') onSubmit(); }} />
      <button className="btn btn-primary" onClick={onSubmit}>Submit</button>
    </div>
  );
}

function Grid({size=5, value=[], setValue}){
  const toggle=(r,c)=>{
    const key=`${r},${c}`;
    const set=new Set(value);
    if (set.has(key)) set.delete(key); else set.add(key);
    setValue(Array.from(set));
  };
  return (
    <div className="mt-3 grid" style={{gridTemplateColumns:`repeat(${size}, minmax(0,1fr))`}}>
      {Array.from({length:size}).map((_,r)=> (
        Array.from({length:size}).map((_,c)=> (
          <button key={`${r}-${c}`} className={`h-10 border ${value.includes(`${r},${c}`)?'bg-puzzle-400 text-white':'bg-white'}`} onClick={()=>toggle(r,c)} />
        ))
      ))}
    </div>
  );
}

function ImageCanvas({value=[], setValue, onSubmit}){
  const ref = useRef(null);
  const [marks, setMarks] = [value, setValue];
  const handleClick=(e)=>{
    const rect = ref.current.getBoundingClientRect();
    const x = Math.round(((e.clientX-rect.left)/rect.width)*100);
    const y = Math.round(((e.clientY-rect.top)/rect.height)*100);
    setValue([...(marks||[]), {x,y}]);
  };
  return (
    <div className="mt-3">
      <div ref={ref} onClick={handleClick} className="relative w-full h-64 bg-gradient-to-br from-puzzle-100 to-white rounded-lg border">
        {(marks||[]).map((m,i)=> (
          <div key={i} className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-puzzle-600 shadow-glow" style={{left:`${m.x}%`, top:`${m.y}%`}} />
        ))}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-8 opacity-10">
          {Array.from({length:8*8}).map((_,i)=> <div key={i} className="border" />)}
        </div>
      </div>
      <div className="mt-3">
        <button className="btn btn-primary" onClick={onSubmit}>Submit</button>
      </div>
    </div>
  );
}

export default function Play(){
  const router = useRouter();
  const { id, p } = router.query; // session id, puzzle id
  const [session, setSession] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [answerWord, setAnswerWord] = useState('');
  const [answerGrid, setAnswerGrid] = useState([]);
  const [answerImage, setAnswerImage] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const player_id = 'You';

  useEffect(()=>{ (async()=>{
    if (!router.isReady) return;
    if (!p) return;
    const r = await fetch(`/api/puzzle?id=${p}`);
    const j = await r.json();
    if (r.ok) { setPuzzle(j.puzzle); setSession(j.session||null); }
  })(); }, [router.isReady, p]);

  const submit = async ()=>{
    if (!puzzle) return;
    setLoading(true);
    const payload = { player_id, puzzle_id: puzzle.id, answer: puzzle.type==='word' ? answerWord : (puzzle.type==='logic'? answerGrid : answerImage) };
    const r = await fetch('/api/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return alert(j.error||'Failed');
    setResult(j.result); setFeedback(j.feedback_markdown||'');
  };

  const next = async ()=>{
    setLoading(true);
    const r = await fetch('/api/next', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: session?.id, last_result: result, fallback: { type: puzzle?.type, difficulty: puzzle?.difficulty } }) });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return alert(j.error||'Failed');
    setPuzzle(j.puzzle); setFeedback(''); setResult(null); setAnswerWord(''); setAnswerGrid([]); setAnswerImage([]);
    router.replace(`/play?id=${j.session?.id}&p=${j.puzzle?.id}`);
  };

  return (
    <div className="space-y-5">
      {!puzzle ? <div className="card"><div className="card-inner">Loading…</div></div> : (
        <div className="card animate-fadeInUp">
          <div className="card-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="badge">{puzzle.type}</span>
                <span className="badge">{puzzle.difficulty}</span>
                {session?.players?.length ? (
                  <span className="score-badge">Players: {session.players.length}</span>
                ) : null}
              </div>
              {result && <button className="btn btn-primary" onClick={next}>Next</button>}
            </div>

            <h2 className="text-2xl font-semibold mt-2">Puzzle</h2>
            <div className="mt-2 text-white/90 whitespace-pre-wrap">{puzzle.prompt_markdown}</div>

            {puzzle.type==='word' && (
              <WordAnswer value={answerWord} setValue={setAnswerWord} onSubmit={submit} />
            )}

            {puzzle.type==='logic' && (
              <div>
                <Grid size={5} value={answerGrid} setValue={setAnswerGrid} />
                <div className="mt-3"><button className="btn btn-primary" onClick={submit}>Submit</button></div>
              </div>
            )}

            {puzzle.type==='image' && (
              <ImageCanvas value={answerImage} setValue={setAnswerImage} onSubmit={submit} />
            )}

            {result && (
              <div className="mt-5 p-4 rounded-xl border border-white/10 bg-white/10">
                <div className="flex items-center gap-3">
                  <span className={`badge ${result.is_correct? 'bg-green-500/20 text-green-200 border-green-400/30':'bg-red-500/20 text-red-200 border-red-400/30'}`}>{result.is_correct? 'Correct':'Try Again'}</span>
                  <span className="text-sm text-white/80">Score: {result.score}</span>
                </div>
                {feedback && (
                  <div className="mt-3 text-white/90 whitespace-pre-wrap">{feedback}</div>
                )}
              </div>
            )}

            {loading && <div className="mt-3 text-white/70 animate-pulseSoft">Checking…</div>}
          </div>
        </div>
      )}
    </div>
  );
}
