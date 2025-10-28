import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen relative">
      <a className="elinity-badge" href="#" aria-label="ELINITY">
        <span className="elinity-glow" />
        <span className="elinity-text">ELINITY</span>
      </a>
      <Component {...pageProps} />
    </div>
  );
}
