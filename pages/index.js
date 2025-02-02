import React from 'react'
import Link from 'next/link'

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
        Buttons row => bigger margin on desktop => 'mt-6 md:mt-10'
        So mobile remains 'mt-6', desktop gets more space.
      */}
      <div className="mt-6 md:mt-10 flex flex-row space-x-4">
        {/* 
          REPLACED <a> WITH <Link> 
          passing className directly (Next.js 13+ approach),
          no spacing changed 
        */}
        <Link
          href="/swap"
          className="
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white
            px-6 py-3
            rounded-xl font-semibold
            text-lg md:text-xl
            md:px-12
          "
        >
          Swap
        </Link>

        <Link
          href="/listen"
          className="
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white
            px-6 py-3
            rounded-xl font-semibold
            text-lg md:text-xl
            md:px-12
          "
        >
          Listen
        </Link>
      </div>
    </div>
  )
}
