import React from 'react';
import '../styles/globals.css'; // Tailwind + custom CSS
import '@solana/wallet-adapter-react-ui/styles.css'; // Default wallet UI

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import NavBar from '../components/NavBar';

/**
 * 1) Put your real mainnet RPC here.
 *    Example:
 *    const MY_CUSTOM_RPC_ENDPOINT = "https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/YOUR-TOKEN/";
 */
const MY_CUSTOM_RPC_ENDPOINT = 'https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/d2863d9fc3dbb4c48f523ff357b6defe31eae786';

function MyApp({ Component, pageProps }) {
  // 2) We directly set the endpoint to your custom node—no fallback.
  const endpoint = MY_CUSTOM_RPC_ENDPOINT;

  // 3) Phantom adapter
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 flex items-center justify-center">
              <Component {...pageProps} />
            </main>
            <footer className="bg-primary text-white p-4 text-center">
              Streamless Music © 2025
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
