import { useEffect } from 'react';
import '@/styles/globals.css';
import { useThemeStore } from '@/store/themeStore';

export default function App({ Component, pageProps }) {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <Component {...pageProps} />;
}
