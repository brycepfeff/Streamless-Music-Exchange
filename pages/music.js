/** pages/music.js */
import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const MUSIC_TOKEN_MINT = 'YOUR_REAL_MUSIC_TOKEN_MINT'; // Replace with your gating token

export default function MusicPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setHasAccess(false);
      return;
    }
    (async () => {
      try {
        const resp = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        let found = false;
        for (const item of resp.value) {
          const info = item.account.data.parsed.info;
          if (info.mint === MUSIC_TOKEN_MINT && Number(info.tokenAmount.uiAmount) > 0) {
            found = true;
            break;
          }
        }
        setHasAccess(found);
      } catch (err) {
        console.error('Error checking token gating:', err);
      }
    })();
  }, [publicKey, connection]);

  return (
    <div className="bg-gray-100 p-8 rounded-md shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Exclusive Music</h2>
      {!publicKey ? (
        <p>Please connect your wallet to check access.</p>
      ) : hasAccess ? (
        <div>
          <p>You hold the gating token! Enjoy your music:</p>
          <audio controls className="mt-4">
            <source src="/example-song.mp3" type="audio/mpeg" />
          </audio>
        </div>
      ) : (
        <p>You do NOT have the required token. No access.</p>
      )}
    </div>
  );
}
