import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function useQuery() {
  const router = useRouter();
  return useMemo(() => {
    const q = Object.create(null);
    if (!router?.asPath) return q;
    const idx = router.asPath.indexOf('?');
    if (idx === -1) return q;
    const sp = new URLSearchParams(router.asPath.slice(idx + 1));
    sp.forEach((v, k) => (q[k] = v));
    return q;
  }, [router?.asPath]);
}

function emojiOnly(str) {
  const s = String(str || '').trim();
  const ascii = /[A-Za-z0-9_\-\.:,;@#\$%&\*\+=\?\!\(\)\[\]\{\}\"\'\<\>]/g;
  return s.replace(ascii, '').trim();
}

function useAudioCue() {
  const ctxRef = useRef(null);
  return () => {
    try {
      const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 880; // A5
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
      o.stop(now + 0.3);
    } catch {}
  };
}

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = router.query || {};
  const query = useQuery();
  const [playerId, setPlayerId] = useState(query.playerId || '');
  const [name, setName] = useState('');

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emojis, setEmojis] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [error, setError] = useState('');
  const playDing = useAudioCue();
  const lastNarrRef = useRef(null);

  async function fetchState() {
    if (!roomId) return;
    try {
      const r = await fetch(`/api/state?roomId=${encodeURIComponent(roomId)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setState((prev) => {
        // play a cue when narration newly arrives
        if (prev?.narration?.story !== d?.narration?.story && d?.narration?.story) {
          if (lastNarrRef.current !== d.narration.story) {
            lastNarrRef.current = d.narration.story;
            playDing();
          }
        }
        return d;
      });
      setError('');
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    fetchState().finally(() => setLoading(false));
    const id = setInterval(fetchState, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function ensureJoined() {
    if (playerId || !roomId) return;
    if (!name.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/join_room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, name: name.trim() || 'Player' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Join failed');
      setPlayerId(d.playerId);
      router.replace({ pathname: router.pathname, query: { roomId, playerId: d.playerId } }, undefined, { shallow: true });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function startRound() {
    if (!roomId) return;
    setLoading(true);
    try {
      const r = await fetch('/api/start_round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Start failed');
      setState(d);
      setEmojis('');
      setCustomTheme('');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function pickTheme(theme) {
    if (!roomId || !theme) return;
    setLoading(true);
    try {
      const r = await fetch('/api/pick_theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, theme }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Pick failed');
      setState(d);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function sendEmojis() {
    if (!roomId || !playerId) return;
    const clean = emojiOnly(emojis).slice(0, 64);
    if (!clean) return;
    setSending(true);
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId, emojis: clean }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d?.error || 'Submit failed');
      setEmojis('');
      fetchState();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSending(false);
    }
  }

  async function narrate() {
    if (!roomId) return;
    setLoading(true);
    try {
      const r = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Narrate failed');
      setState(d);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleChaos() {
    if (!roomId) return;
    try {
      const r = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Chaos failed');
      setState(d);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  const canNarrate = (state?.messages?.length || 0) > 0 && !state?.narration;
  const canStart = !state || (state?.themes?.length || 0) === 0 && !state?.theme && !state?.narration;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="badge">Room</div>
          <div className="text-lg font-semibold select-all">{roomId}</div>
          {state?.round ? <div className="badge">Round {state.round}</div> : null}
          {state?.theme ? <div className="badge">Theme: {state.theme}</div> : null}
          {state?.chaos ? <div className="badge">Chaos Mode</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={toggleChaos}>⚡ Toggle Chaos</button>
          <button className="btn-primary" disabled={loading} onClick={startRound}>{loading ? '…' : 'Start Round'}</button>
        </div>
      </div>

      {/* Join fallback */}
      {!playerId && (
        <div className="panel p-4 flex items-center gap-3">
          <div className="text-white/80">Enter a name to join this room:</div>
          <input className="input w-64" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <button className="btn-primary" onClick={ensureJoined} disabled={!name.trim()}>Join</button>
        </div>
      )}

      {/* Theme picker */}
      {state?.themes && !state?.theme && (
        <div className="panel p-4">
          <div className="text-white/70 text-sm mb-2">Pick a theme for this round</div>
          <div className="flex flex-wrap gap-2">
            {state.themes.map((t, i) => (
              <button key={i} className="btn" onClick={() => pickTheme(t)}>{t}</button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input w-full" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="Or type your own (e.g., 🚀 Alien First Date)" />
            <button className="btn" onClick={() => pickTheme(customTheme)} disabled={!customTheme.trim()}>Pick</button>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: emoji input + messages */}
        <div className="space-y-3">
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/70 text-sm">Your emoji volley</div>
              <div className="text-white/50 text-xs">No words allowed</div>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={emojis}
                onChange={(e) => setEmojis(emojiOnly(e.target.value))}
                placeholder="🎭🔥🧠 Drop emojis only"
                maxLength={64}
              />
              <button className="btn-primary" onClick={sendEmojis} disabled={!playerId || !emojiOnly(emojis)}>
                Send
              </button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-white/70 text-sm mb-2">Recent volleys</div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {(state?.messages || []).slice(-50).map((m, i) => (
                <div key={i} className="chat">
                  <div className="text-white/60 text-xs">{m.name}</div>
                  <div className="text-xl leading-tight mt-1">{m.emojis}</div>
                </div>
              ))}
              {(!state?.messages || state.messages.length === 0) && (
                <div className="text-white/50 text-sm">No emojis yet. Be the first to strike.</div>
              )}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={narrate} disabled={!canNarrate || loading}>
                🎙️ Narrate round
              </button>
              {state?.narration && (
                <button className="btn" onClick={startRound} disabled={loading}>Next Round</button>
              )}
            </div>
          </div>
        </div>

        {/* Right: narration + leaderboard */}
        <div className="space-y-3">
          <div className="panel p-4">
            <div className="text-white/70 text-sm mb-2">Narrator</div>
            {state?.narration ? (
              <div className="space-y-3">
                <div className="text-lg font-semibold">{state.narration.theme}</div>
                <p className="text-white/90 leading-relaxed">{state.narration.story}</p>
                {state.narration?.scores && (
                  <div className="flex gap-2 text-sm text-white/80">
                    <div className="badge">Creativity {state.narration.scores.creativity}</div>
                    <div className="badge">Chaos {state.narration.scores.chaos}</div>
                    <div className="badge">Emotion {state.narration.scores.emotion}</div>
                  </div>
                )}
                <div className="text-white/80 italic">{state.narration.recap}</div>
                <div className="text-white/70 text-sm">{state.narration.next}</div>
              </div>
            ) : (
              <div className="text-white/50 text-sm">Waiting for narration… add emojis then press Narrate.</div>
            )}
          </div>

          <div className="panel p-4">
            <div className="text-white/70 text-sm mb-2">Leaderboard</div>
            <div className="space-y-2">
              {(state?.leaderboard || []).map((row) => (
                <div key={row.id} className={`leader flex items-center justify-between ${row.id === playerId ? 'ring-1 ring-white/20' : ''}`}>
                  <div className="px-2 py-1">{row.name}</div>
                  <div className="px-2 py-1 text-white/80">{row.score}</div>
                </div>
              ))}
              {(!state?.leaderboard || state.leaderboard.length === 0) && (
                <div className="text-white/50 text-sm">No scores yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-3 text-sm text-red-300 border-red-500/30">{error}</div>
      )}
    </div>
  );
}
