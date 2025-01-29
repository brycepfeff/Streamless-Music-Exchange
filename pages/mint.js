import React, { useState } from 'react';

export default function MintPage() {
  const [tokenName, setTokenName] = useState('');
  const [supply, setSupply] = useState('');

  function handleMint() {
    alert(`Minting token "${tokenName}" with supply ${supply} (pseudo-logic)`);
    // Real approach: user pays SOL => run spl-token or anchor-based program
  }

  return (
    <div className="relative z-50 max-w-[400px] w-full mx-auto my-8 px-4 sm:px-0">
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
        <h2 className="text-2xl font-bold mb-6">Mint Your Own Token</h2>

        {/* Token Name */}
        <label className="block mb-2 font-semibold text-left">
          Token Name:
        </label>
        <input
          className="
            bg-transparent
            text-white
            border border-gray-500
            p-3 w-full
            rounded-md
            outline-none
            focus:border-primary
            placeholder-gray-400
          "
          placeholder="Name"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
        />

        {/* Supply */}
        <label className="block mt-6 mb-2 font-semibold text-left">
          Supply:
        </label>
        <input
          className="
            bg-transparent
            text-white
            border border-gray-500
            p-3 w-full
            rounded-md
            outline-none
            focus:border-primary
            placeholder-gray-400
          "
          type="number"
          placeholder="1000"
          value={supply}
          onChange={(e) => setSupply(e.target.value)}
        />

        <button
          onClick={handleMint}
          className="
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white
            px-6 py-2
            rounded-xl font-semibold
            mt-8
          "
        >
          Mint
        </button>
      </div>
    </div>
  );
}
