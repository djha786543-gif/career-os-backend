import type { AppProps } from 'next/app';
import { ProfileProvider } from '../src/context/ProfileContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ProfileProvider>
      {/* Ambient background orbs */}
      <div className="amb">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
      </div>
      <Component {...pageProps} />
    </ProfileProvider>
  );
}
