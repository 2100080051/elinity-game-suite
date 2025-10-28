import { Html, Head, Main, NextScript } from 'next/document';

export default function Document(){
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffd400'/><stop offset='50%' stop-color='%23ff3da6'/><stop offset='100%' stop-color='%232aa4ff'/></linearGradient></defs><rect x='8' y='10' width='48' height='44' rx='6' fill='url(%23g)' stroke='black' stroke-width='3'/></svg>" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
