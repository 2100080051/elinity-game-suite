import { Html, Head, Main, NextScript } from 'next/document';

export default function Document(){
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@500;700&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%237db9e8'/><stop offset='50%' stop-color='%23b889f4'/><stop offset='100%' stop-color='%23ffd38a'/></linearGradient></defs><circle cx='32' cy='32' r='26' fill='url(%23g)'/></svg>" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
