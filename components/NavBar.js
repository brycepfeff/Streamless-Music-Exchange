import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Refs for hamburger button and dropdown
  const hamburgerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Closes dropdown after ANY route change
  useEffect(() => {
    const handleRouteDone = () => setIsOpen(false);
    router.events.on('routeChangeComplete', handleRouteDone);
    return () => {
      router.events.off('routeChangeComplete', handleRouteDone);
    };
  }, [router]);

  // Closes dropdown if user clicks outside the hamburger and the dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        hamburgerRef.current &&
        dropdownRef.current &&
        !hamburgerRef.current.contains(e.target) &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Closes dropdown after a link click
  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <nav className="w-full bg-secondary text-white relative z-[999]">
      <div className="relative flex items-center w-full px-4 py-10 md:px-12 md:py-8">
        {/* Hamburger (Mobile Only) */}
        <button
          ref={hamburgerRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            block md:hidden focus:outline-none ml-2 mr-2
            px-4 py-3 rounded-lg transition-colors
            ${
              isOpen
                ? 'bg-[#2c2d30] text-white'
                : 'hover:bg-[#2c2d30] hover:text-white'
            }
          `}
        >
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
          </div>
        </button>

        {/* Mobile Logo => clickable => Link to home */}
        <div
          className="
            block md:hidden
            absolute left-1/2 top-1/2 transform 
            -translate-x-1/2 -translate-y-1/2
          "
        >
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Streamless Logo"
              width={180}
              height={60}
              priority
            />
          </Link>
        </div>

        {/* Desktop Logo => clickable => Link to home */}
        <div className="hidden md:block">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Streamless Logo"
              width={210}
              height={75}
            />
          </Link>
        </div>

        {/* Desktop Nav + Wallet */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          <Link href="/">
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
            <span className="hover:bg-primary px-3 py-2 rounded-md cursor-pointer mr-4">
              Mint
            </span>
          </Link>

          <WalletMultiButtonDynamic
            className="
              bg-white text-secondary
              px-3 py-2
              rounded-md font-semibold
              whitespace-nowrap
              min-w-[130px]
            "
          />
        </div>
      </div>

      {/* Mobile Dropdown => #2c2d30 background, text-white */}
      <div
        ref={dropdownRef}
        className={`
          absolute top-full left-0 w-full
          md:hidden
          transition-all duration-300 overflow-hidden
          rounded-lg
          ${
            isOpen
              ? 'bg-[#2c2d30] text-white max-h-screen p-2 pb-3'
              : 'max-h-0 p-0'
          }
        `}
      >
        <ul className="flex flex-col space-y-2 ml-2">
          <li onClick={closeDropdown}>
            <Link href="/">
              <span className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
                Home
              </span>
            </Link>
          </li>
          <li onClick={closeDropdown}>
            <Link href="/swap">
              <span className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
                Swap
              </span>
            </Link>
          </li>
          <li onClick={closeDropdown}>
            <Link href="/music">
              <span className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
                Music
              </span>
            </Link>
          </li>
          <li onClick={closeDropdown}>
            <Link href="/mint">
              <span className="block hover:bg-primary px-3 py-2 rounded-md cursor-pointer">
                Mint
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
