import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically load the Solana wallet button for desktop
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
      <nav className="w-full bg-secondary text-white relative z-[999]">
        {/*
          Outer container: 
          Mobile < md => px-4 py-6
          Desktop ≥ md => px-8 py-8
          position: relative so we can absolutely center the mobile brand
        */}
        <div className="relative flex items-center w-full px-4 py-6 md:px-8 md:py-8">

          {/* Hamburger (Mobile Only) */}
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

          {/*
            Mobile Brand 
            - Absolutely centered 
            - Hidden on desktop 
            - whitespace-nowrap → prevents the text from wrapping
          */}
          <div
            className="
              block md:hidden
              absolute left-1/2 top-1/2 transform 
              -translate-x-1/2 -translate-y-1/2
              text-xl font-bold
              text-center
              whitespace-nowrap
            "
            style={{ padding: 0, margin: 0 }}
          >
            Streamless Music Exchange
          </div>

          {/* Desktop Brand (hidden on mobile) */}
          <div className="hidden md:block text-xl font-bold">
            Streamless Music Exchange
          </div>

          {/* Desktop Nav Links + Wallet (to the right) */}
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
        </div>

        {/*
          MOBILE DROPDOWN
          Absolutely placed below nav
          Expands/collapses via max-height
        */}
        <div
          className={`
            absolute top-full left-0 w-full
            bg-secondary text-white transition-all duration-300 overflow-hidden
            md:hidden
            ${isOpen ? 'max-h-screen p-2 pb-3' : 'max-h-0 p-0'}
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
      </nav>
    </>
  );
}
