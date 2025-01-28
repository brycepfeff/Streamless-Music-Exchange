/** pages/swap.js */
import React, { useState } from 'react';

// Example tokens
const mockTokens = [
  { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { mint: 'J9gmo67v4cZL7o7hPGNwyNay2rh7t9Ys4BybZ5K35twZ', symbol: 'USDC' },
];

export default function SwapPage() {
  const [inputMint, setInputMint] = useState(mockTokens[0].mint);
  const [outputMint, setOutputMint] = useState(mockTokens[1].mint);
  const [amount, setAmount] = useState('1');

  function handleSwap() {
    alert(`Swapping ${amount} of ${inputMint} => ${outputMint} (pseudo-logic)`);
  }

  // Everything is in a single box, centered by `_app.js`.
  return (
    <div className="bg-gray-100 p-8 rounded-md shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>

      <label className="block mb-2 font-semibold">Input Token:</label>
      <select
        className="border p-2 w-64"
        value={inputMint}
        onChange={(e) => setInputMint(e.target.value)}
      >
        {mockTokens.map((t) => (
          <option key={t.mint} value={t.mint}>
            {t.symbol}
          </option>
        ))}
      </select>

      <label className="block mt-4 mb-2 font-semibold">Output Token:</label>
      <select
        className="border p-2 w-64"
        value={outputMint}
        onChange={(e) => setOutputMint(e.target.value)}
      >
        {mockTokens.map((t) => (
          <option key={t.mint} value={t.mint}>
            {t.symbol}
          </option>
        ))}
      </select>

      <label className="block mt-4 mb-2 font-semibold">Amount:</label>
      <input
        type="number"
        className="border p-2 w-64"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleSwap}
        className="block mx-auto mt-6 bg-primary text-white px-6 py-2 rounded font-semibold"
      >
        Swap
      </button>
    </div>
  );
}
