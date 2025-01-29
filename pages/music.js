import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import dynamic from 'next/dynamic';

/* Mobile-only wallet connect button */
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

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
          if (
            info.mint === MUSIC_TOKEN_MINT &&
            Number(info.tokenAmount.uiAmount) > 0
          ) {
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
    <div className="relative z-50 max-w-[400px] w-full mx-auto my-8 px-4 sm:px-0">
      {/* Updated card with extra top/bottom padding => py-8, side padding => px-6 */}
      <div
        className="
          bg-[#1c243e]
          text-white
          rounded-2xl
          py-8 px-6
          flex flex-col
          text-center
          relative
        "
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <h2 className="text-2xl font-bold mb-4">Exclusive Music</h2>

        {/* MOBILE ONLY wallet select => below heading */}
        <div className="block md:hidden mb-4">
          <WalletMultiButtonDynamic className="bg-white text-secondary px-3 py-2 rounded-md font-semibold" />
        </div>

        {!publicKey ? (
          <p>Please connect your wallet to check access.</p>
        ) : hasAccess ? (
          <div>
            <p>You hold the gating token! Enjoy your music:</p>
            <audio controls className="mt-4 w-full">
              <source src="/example-song.mp3" type="audio/mpeg" />
            </audio>
          </div>
        ) : (
          <p>You do not have the required tokens to access.</p>
        )}
      </div>
    </div>
  );
}
