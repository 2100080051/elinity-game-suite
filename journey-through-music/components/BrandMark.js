export default function BrandMark({ size=18 }) {
  const s = { width: size, height: size };
  return (
    <span className="relative inline-block align-middle" style={s} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-300 via-indigo-300 to-amber-200 blur-[2px] opacity-90"></span>
      <span className="absolute inset-0 rounded-full bg-white/20 mix-blend-overlay animate-shimmer"></span>
      <span className="absolute inset-[3px] rounded-full bg-black/40 backdrop-blur-sm border border-white/20"></span>
    </span>
  );
}
