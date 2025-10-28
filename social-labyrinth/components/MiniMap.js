import { useEffect, useRef } from 'react';
import { createMaze } from '../lib/maze';

export default function MiniMap({ seed }){
  const ref = useRef(null);
  useEffect(()=>{
    const canvas = ref.current; if(!canvas) return;
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const ctx = canvas.getContext('2d');
    const W = 340, H = 220; canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px'; ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,W,H);
    // Generate a tiny maze for the preview
    const base = createMaze(String(seed||'preview'), 22);
    const n = base.maze.nodes.length;
    // Place nodes on a perturbed circle
    const R = Math.min(W,H)*0.38; const cx=W*0.5, cy=H*0.5;
    const pts = base.maze.nodes.map((_,i)=>{
      const t = (i/n)*Math.PI*2; const r = R*(0.85+0.12*Math.sin(i*2.1));
      return { x: cx + r*Math.cos(t), y: cy + r*Math.sin(t) };
    });
    // Draw edges
    ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
    base.maze.edges.forEach(e=>{ const a=pts[e.from], b=pts[e.to]; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });
    // Locked edges overlay
    ctx.strokeStyle='rgba(240,198,116,0.7)'; ctx.lineWidth=1.6;
    base.maze.locked.forEach(l=>{ const a=pts[l.from], b=pts[l.to]; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });
    // Nodes
    pts.forEach((p,i)=>{ const exit = (i===base.maze.exit); ctx.beginPath(); ctx.fillStyle = exit? 'rgba(154,230,180,0.95)' : 'rgba(255,255,255,0.85)'; ctx.shadowColor = exit? 'rgba(154,230,180,0.6)':'rgba(255,255,255,0.25)'; ctx.shadowBlur=8; ctx.arc(p.x,p.y, exit? 3.2: 2.2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; });
  },[seed]);
  return (
    <div className="panel p-3">
      <div className="text-white/70 text-sm mb-2">Labyrinth Preview</div>
      <canvas ref={ref} />
    </div>
  );
}
