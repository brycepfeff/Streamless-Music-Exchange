/** pages/_app.js */
import React from 'react';
import '../styles/globals.css'; /* Tailwind + custom CSS */
import '@solana/wallet-adapter-react-ui/styles.css'; /* Solana wallet UI defaults */

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
// We remove 'network' import since not used
import NavBar from '../components/NavBar';

/*
  We'll keep a custom endpoint or the default mainnet endpoint, your choice.
*/
const MAINNET_ENDPOINT = 'https://api.mainnet-beta.solana.com';

function MyApp({ Component, pageProps }) {
  // We remove 'network' since we no longer set it,
  // and just directly use MAINNET_ENDPOINT or your custom node.
  const endpoint = MAINNET_ENDPOINT;

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
