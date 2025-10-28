import { Html, Head, Main, NextScript } from 'next/document'

export default function Document(){
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0b1220" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
