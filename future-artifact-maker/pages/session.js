import { useEffect, useMemo, useState } from 'react';

const DEFAULT_PROMPTS = [
  "In 10 years, what tool lies on your desk?",
  "What personal object does your older self treasure most?",
  "What invention represents your dreams made real?",
  "What sits on your nightstand a decade from now?",
  "What gift would your future self send back to you now?",
];

export default function Session() {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [enableImage, setEnableImage] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  async function loadPrompt() {
    try {
      setLoadingPrompt(true);
      const res = await fetch('/api/prompt', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPrompt(data.prompt || '');
        setError('');
      } else {
        const err = await res.json().catch(()=>({}));
        setError(err?.error || 'Failed to load prompt (AI)');
        setPrompt('');
      }
    } catch {
      setError('Failed to load prompt (network)');
      setPrompt('');
    } finally {
      setLoadingPrompt(false);
    }
  }

  function randomLocalPrompt() { return ''; }

  async function submit() {
    if (!input.trim()) return;
    setSubmitting(true);
    setArtifact(null);
    try {
      const res = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: input.trim(),
          prompt,
          imageRequested: enableImage,
          save: true,
        })
      });
      if (!res.ok) throw new Error('Failed to create artifact');
      const data = await res.json();
      setArtifact(data);
      // Also store in localStorage
      try {
        const key = 'fam:artifacts';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.unshift(data);
        localStorage.setItem(key, JSON.stringify(list));
      } catch {}
    } catch (e) {
      alert(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="pt-28">
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Prompt Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white/90 font-semibold">Visioning Prompt</h2>
              <button className="chip" onClick={loadPrompt} disabled={loadingPrompt}>{loadingPrompt? 'Regenerating...' : 'Regenerate Prompt'}</button>
            </div>
            {error ? (
              <p className="mt-3 text-red-300">{error}</p>
            ) : (
              <p className="mt-3 text-mist/90">{prompt || '...'}</p>
            )}
          </div>

          {/* Player Response */}
          <div className="card p-6">
            <h2 className="text-white/90 font-semibold">Your Response</h2>
            <textarea className="textarea mt-3" placeholder="Write freely..." value={input} onChange={e=>setInput(e.target.value)} />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-mist/80">
                <input type="checkbox" checked={enableImage} onChange={e=>setEnableImage(e.target.checked)} />
                Try to include an image (optional)
              </label>
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>{submitting ? 'Creating…' : 'Submit'}</button>
            </div>
          </div>
        </div>

        {/* Artifact Reveal */}
        {artifact && (
          <div className="card p-6 mt-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  {artifact.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artifact.imageUrl} alt={artifact.title || artifact.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-mist/60">No image</div>
                  )}
                </div>
              </div>
              <div className="md:flex-1">
                <div className="text-sm uppercase tracking-wider text-mist/70">Artifact</div>
                <h3 className="text-2xl font-bold text-white/95 mt-1">{artifact.title || artifact.name}</h3>
                <p className="mt-3 text-mist/90 whitespace-pre-wrap">{artifact.description}</p>
                {artifact.reflection && (
                  <blockquote className="mt-4 p-4 border-l-2 border-gold/60 bg-white/5 rounded-r-xl text-mist/90">
                    “{artifact.reflection}”
                  </blockquote>
                )}
                <div className="mt-4 flex gap-2">
                  <a className="btn" href={`/museum`}>Save & View in Museum</a>
                  <button className="btn btn-ghost" onClick={loadPrompt}>Do another</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
