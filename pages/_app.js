/** pages/_app.js */
import React from 'react';
import '../styles/globals.css'; /* Tailwind + custom CSS */
import '@solana/wallet-adapter-react-ui/styles.css'; /* Solana wallet UI defaults */

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import NavBar from '../components/NavBar';

function MyApp({ Component, pageProps }) {
  // Use Devnet for testing
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Full page container - we can do vertical or horizontal layout here */}
          <div className="flex flex-col min-h-screen">
            {/* Our NavBar at the top */}
            <NavBar />

            {/* Main content takes remaining space, centered with Tailwind */}
            <main className="flex-1 flex items-center justify-center">
              <Component {...pageProps} />
            </main>

            {/* A simple footer, using our custom color */}
            <footer className="bg-primary text-white p-4 text-center">
              Streamless Music Exchange © 2025
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
