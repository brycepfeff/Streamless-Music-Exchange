import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Streamless</title>
      </Head>
      <div
        className="
          min-h-screen w-full
          flex flex-col items-center
          justify-start
          pt-20
          px-4
          bg-secondary
        "
      >
        <h1
          className="
            text-center font-bold text-white
            leading-snug md:leading-relaxed
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

        {/* Subtitle */}
        <p className="mt-4 text-lg md:text-xl text-white text-center">
          <span className="block md:inline">Fair artist compensation.</span>{' '}
          <span className="block md:inline">Affordable consumer access.</span>
        </p>

        {/*
          Vertical Button Stack:
          The buttons are ordered top-to-bottom: Listen, Market, Swap.
          The container's max-width sets the width for all buttons.
        */}
        <div className="mt-6 md:mt-10 w-full max-w-[300px] flex flex-col space-y-4">
          <Link
            href="/listen"
            className="
              bg-gradient-to-r from-purple-500 to-indigo-600
              text-white
              px-6 py-3
              rounded-xl font-semibold
              text-lg md:text-xl
              text-center
            "
          >
            Listen
          </Link>

          <Link
            href="/market"
            className="
              bg-gradient-to-r from-purple-500 to-indigo-600
              text-white
              px-6 py-3
              rounded-xl font-semibold
              text-lg md:text-xl
              text-center
            "
          >
            Market
          </Link>

          <Link
            href="/swap"
            className="
              bg-gradient-to-r from-purple-500 to-indigo-600
              text-white
              px-6 py-3
              rounded-xl font-semibold
              text-lg md:text-xl
              text-center
            "
          >
            Swap
          </Link>
        </div>
      </div>
    </>
  );
}
