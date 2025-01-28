/** components/NavBar.js */
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically load the wallet button to avoid hydration errors
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function NavBar() {
  return (
    <nav className="bg-secondary text-white p-4 flex items-center justify-between">
      <div className="text-xl font-bold">
        Streamless Music Exchange
      </div>
      <div className="flex items-center space-x-4">
        {/* No <a> child inside <Link>! We put the classes on the Link itself */}
        <Link href="/">
          {/* Next.js 13+ style: pass classes directly */}
          <span className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
            Home
          </span>
        </Link>

        <Link href="/swap">
          <span className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
            Swap
          </span>
        </Link>

        <Link href="/music">
          <span className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
            Music
          </span>
        </Link>

        <Link href="/mint">
          <span className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
            Mint
          </span>
        </Link>

        {/* Solana wallet connect button */}
        <WalletMultiButtonDynamic className="bg-white text-secondary px-3 py-2 rounded-md font-semibold" />
      </div>
    </nav>
  );
}
