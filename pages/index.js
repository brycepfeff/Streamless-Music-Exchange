import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      className="
        min-h-screen w-full
        flex flex-col items-center
        justify-start
        pt-36
        px-4
        bg-secondary
      "
    >
      <h1
        className="
          text-center font-bold text-white
          leading-snug md:leading-none
        "
      >
        <span
          className="
            block md:inline
            text-[1.5rem] md:text-[3.5rem]
          "
        >
          Welcome to{' '}
        </span>
        <span
          className="
            block md:inline
            text-[2.5rem] md:text-[3.5rem]
          "
        >
          Streamless
        </span>
      </h1>

      <p className="mt-4 text-lg md:text-xl text-white text-center">
        <span className="block md:inline">Fair artist compensation.</span>{' '}
        <span className="block md:inline">Affordable consumer access.</span>
      </p>

      {/*
        Two Buttons: 
        - Next.js <Link> for internal routes
        - Possibly remove or rename your classes
      */}
      <div className="mt-6 flex flex-row space-x-4">
        <Link href="/swap">
          <a
            className="
              bg-gradient-to-r from-purple-500 to-indigo-600
              text-white 
              px-6 py-3
              rounded-xl font-semibold text-lg
              md:text-xl
              md:px-12
            "
          >
            Swap
          </a>
        </Link>

        <Link href="/music">
          <a
            className="
              bg-gradient-to-r from-purple-500 to-indigo-600
              text-white 
              px-6 py-3
              rounded-xl font-semibold text-lg
              md:text-xl
              md:px-12
            "
          >
            Listen
          </a>
        </Link>
      </div>
    </div>
  );
}
