import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically load the Solana wallet button for desktop use
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Wrapper ensures dropdown is above other content. */}
      <div className="w-full bg-secondary text-white relative z-[999]">

        {/*
          NAVBAR
          - Mobile (<md): px-4 py-6
          - Desktop (md+): py-4
          - Hamburger: ml-2 mr-2 for spacing on both sides
        */}
        <nav className="flex items-center w-full px-4 py-6 md:py-4">
          {/* ===== Hamburger (Mobile Only) ===== */}
          <button
            aria-label="Toggle Menu"
            onClick={toggleMenu}
            className="block md:hidden focus:outline-none ml-2 mr-2"
          >
            <div className="space-y-1">
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </div>
          </button>

          {/* ===== Brand ===== */}
          {/* 
            On mobile: brand is centered via mx-auto
            On desktop: brand is left-aligned
          */}
          <div className="text-xl font-bold mx-auto md:mx-0">
            Streamless Music Exchange
          </div>

          {/* ===== Desktop Nav Links + Wallet ===== */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <Link href="/" legacyBehavior>
              <span
                className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                onClick={closeMenu}
              >
                Home
              </span>
            </Link>
            <Link href="/swap" legacyBehavior>
              <span
                className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                onClick={closeMenu}
              >
                Swap
              </span>
            </Link>
            <Link href="/music" legacyBehavior>
              <span
                className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                onClick={closeMenu}
              >
                Music
              </span>
            </Link>
            <Link href="/mint" legacyBehavior>
              <span
                className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                onClick={closeMenu}
              >
                Mint
              </span>
            </Link>

            {/* Phantom Wallet (desktop only) */}
            <WalletMultiButtonDynamic className="bg-white text-secondary px-3 py-2 rounded-md font-semibold" />
          </div>
        </nav>

        {/*
          MOBILE DROPDOWN
          - Absolutely below the nav
          - Opens/closes via max-height transition
        */}
        <div
          className={`
            absolute top-full left-0 w-full
            bg-secondary text-white transition-all duration-300 overflow-hidden
            md:hidden
            ${isOpen ? 'max-h-screen p-2' : 'max-h-0 p-0'}
          `}
        >
          <ul className="flex flex-col space-y-2 ml-2">
            <li>
              <Link href="/" legacyBehavior>
                <span
                  onClick={closeMenu}
                  className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                >
                  Home
                </span>
              </Link>
            </li>
            <li>
              <Link href="/swap" legacyBehavior>
                <span
                  onClick={closeMenu}
                  className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                >
                  Swap
                </span>
              </Link>
            </li>
            <li>
              <Link href="/music" legacyBehavior>
                <span
                  onClick={closeMenu}
                  className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                >
                  Music
                </span>
              </Link>
            </li>
            <li>
              <Link href="/mint" legacyBehavior>
                <span
                  onClick={closeMenu}
                  className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer"
                >
                  Mint
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
