import { Html, Head, Main, NextScript } from 'next/document';

const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('agentflow-theme') || 'dark';
    var resolved = stored;
    if (stored === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (err) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
