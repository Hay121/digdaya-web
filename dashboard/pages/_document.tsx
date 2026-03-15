import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23028090'/><stop offset='1' stop-color='%2302C39A'/></linearGradient></defs><rect width='32' height='32' rx='8' fill='url(%23g)'/><text x='50%25' y='72%25' text-anchor='middle' font-family='Arial Black,sans-serif' font-weight='900' font-size='20' fill='white'>D</text></svg>"/>
        <meta name="theme-color" content="#028090"/>
        <meta name="description" content="Digdaya — Platform Kredit UMKM berbasis AI dan Blockchain Solana"/>
        <meta property="og:title" content="Digdaya — Kredit UMKM Tanpa Agunan"/>
        <meta property="og:description" content="Platform pertama di Indonesia yang menggabungkan AI Credit Scoring dan Blockchain Solana"/>
        <meta property="og:type" content="website"/>
      </Head>
      <body>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  );
}
