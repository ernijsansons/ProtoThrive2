import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Pages that should not use the default layout (they have custom layouts)
  const noLayoutPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard',
  ];

  const shouldUseLayout = !noLayoutPages.some((page) =>
    router.pathname.startsWith(page)
  );

  if (shouldUseLayout) {
    return (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    );
  }

  return <Component {...pageProps} />;
}
