import '../styles/globals.css';

export default function App({ Component, pageProps }){
  return (
    <div className="min-h-screen parchment">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Component {...pageProps} />
      </div>
    </div>
  );
}
