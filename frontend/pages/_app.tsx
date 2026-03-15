import React from 'react';
import type { AppProps } from 'next/app';
import { ProfileProvider } from '../src/context/ProfileContext';
import '../styles/globals.css';
import '../src/styles/tokens.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ProfileProvider>
      <Component {...pageProps} />
    </ProfileProvider>
  );
}
