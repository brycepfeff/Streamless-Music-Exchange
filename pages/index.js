// pages/index.js
import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Streamless Music Exchange</h1>
      <WalletMultiButton />
    </div>
  );
}
