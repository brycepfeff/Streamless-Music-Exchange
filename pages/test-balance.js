// pages/test-balance.js

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import dynamic from 'next/dynamic';

/**
 * Dynamically load the wallet connect button so it works with Next.js
 */
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

/**
 * 1) Use your actual QuickNode endpoint here.
 *    This is what you shared:
 */
const QUICKNODE_MAINNET_RPC = 'https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/d2863d9fc3dbb4c48f523ff357b6defe31eae786';

export default function TestBalancePage() {
  /**
   * 2) Create a direct Connection to your custom RPC endpoint,
   *    bypassing the usual `useConnection()` from your `_app.js`.
   */
  const customConnection = new Connection(QUICKNODE_MAINNET_RPC);

  /**
   * 3) Grab the connected wallet's publicKey from the Solana adapter.
   *    Make sure Phantom is on Mainnet in its settings.
   */
  const { publicKey } = useWallet();

  /**
   * We'll store the wallet's SOL balance in "balance."
   */
  const [balance, setBalance] = useState(null);

  /**
   * 4) On mount or whenever publicKey changes, try fetching the balance
   *    using our custom Connection to the QuickNode endpoint.
   */
  useEffect(() => {
    if (!publicKey) {
      // If wallet not connected, reset balance display
      setBalance(null);
      return;
    }

    // Attempt to get SOL balance in lamports, then convert to SOL
    customConnection
      .getBalance(publicKey)
      .then((lamports) => {
        const sol = lamports / 1e9;
        setBalance(sol);
      })
      .catch((err) => {
        console.error('Failed to get balance =>', err);
        // If it fails, show nothing
        setBalance(null);
      });
  }, [publicKey, customConnection]);

  return (
    <div style={{ color: 'white', maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
      <h1 className="text-2xl mb-4">Test Balance (Custom RPC)</h1>

      {/* Connect wallet button (Phantom, etc.) */}
      <div className="mb-4">
        <WalletMultiButtonDynamic />
      </div>

      {/* Show either "Connect wallet" or the user’s SOL balance. */}
      {!publicKey ? (
        <p>Connect your wallet to see your SOL balance.</p>
      ) : balance === null ? (
        <p>Fetching balance or failed to fetch...</p>
      ) : (
        <p>
          Address: {publicKey.toBase58()} <br />
          Balance: {balance.toFixed(4)} SOL
        </p>
      )}
    </div>
  );
}
