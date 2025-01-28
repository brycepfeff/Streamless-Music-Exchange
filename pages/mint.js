/** pages/mint.js */
import React, { useState } from 'react';

export default function MintPage() {
  const [tokenName, setTokenName] = useState('');
  const [supply, setSupply] = useState('1000');

  function handleMint() {
    alert(`Minting token "${tokenName}" with supply ${supply} (pseudo-logic)`);
    // Real approach: user pays SOL => run spl-token or anchor-based program
  }

  return (
    <div className="bg-gray-100 p-8 rounded-md shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Mint Your Own Token</h2>

      <label className="block mb-2 font-semibold">Token Name:</label>
      <input
        className="border p-2 w-64"
        value={tokenName}
        onChange={(e) => setTokenName(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold">Supply:</label>
      <input
        className="border p-2 w-64"
        type="number"
        value={supply}
        onChange={(e) => setSupply(e.target.value)}
      />

      <button
        onClick={handleMint}
        className="block mx-auto mt-6 bg-primary text-white px-6 py-2 rounded font-semibold"
      >
        Mint
      </button>
    </div>
  );
}
