import { Html, Head, Main, NextScript } from 'next/document';

export default function Document(){
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&family=Poppins:wght@300;400;600&family=Nunito:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffc3a0'/><stop offset='50%' stop-color='%23c4b5fd'/><stop offset='100%' stop-color='%23a7f3d0'/></linearGradient></defs><rect x='22' y='10' width='20' height='44' rx='4' fill='url(%23g)' stroke='white' stroke-width='2'/></svg>" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
