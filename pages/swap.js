import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { Configuration, DefaultApi } from '@jup-ag/api';

/**
 * Dynamically load the wallet button to avoid SSR issues
 */
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

/** 
 * Mints => SOL + JUP
 */
const SOL_MINT = 'So11111111111111111111111111111111111111112'; // SOL (wrapped)
const JUP_MINT = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'; // JUP

// Decimals => SOL=9, JUP=6
const TOKENS = [
  { symbol: 'SOL', address: SOL_MINT, decimals: 9 },
  { symbol: 'JUP', address: JUP_MINT, decimals: 6 }
];

/**
 * Helper => pick logos
 */
function getLogo(mint) {
  if (mint === SOL_MINT) {
    // SOL logo
    return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
  }
  if (mint === JUP_MINT) {
    // JUP logo => local file => /public/JUP.png (or change to a hosted link)
    return '/JUP.png';
  }
  // fallback
  return '/JUP.png';
}

export default function SwapPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // Jupiter aggregator ref
  const [jupiterApi, setJupiterApi] = useState(null);

  // "You Pay" => default SOL
  const [payMint, setPayMint] = useState(SOL_MINT);
  const [payAmount, setPayAmount] = useState('');

  // "You Receive" => default JUP
  const [receiveMint, setReceiveMint] = useState(JUP_MINT);
  const [receiveAmount, setReceiveAmount] = useState('');

  const [loading, setLoading] = useState(false);

  /**
   * 1) On mount => aggregator config
   */
  useEffect(() => {
    const config = new Configuration({ basePath: 'https://quote-api.jup.ag' });
    const api = new DefaultApi(config);
    setJupiterApi(api);
  }, []);

  /**
   * 2) QUOTE => aggregator => "ExactIn"/"ExactOut"
   */
  const doQuote = useCallback(
    async (inMint, outMint, rawAmt, mode) => {
      if (!jupiterApi || !rawAmt || !inMint || !outMint) return '';

      const tokenInfo =
        TOKENS.find((t) => t.address === (mode === 'ExactIn' ? inMint : outMint)) || {};
      const decimals = tokenInfo.decimals ?? 9;

      const lamports = parseFloat(rawAmt) * 10 ** decimals;
      if (isNaN(lamports) || lamports <= 0) return '';

      try {
        const quoteResp = await jupiterApi.quoteGet({
          inputMint: inMint,
          outputMint: outMint,
          amount: lamports,
          swapMode: mode,
          slippageBps: 50
        });
        if (!quoteResp) return '';

        if (mode === 'ExactIn') {
          // "You Pay" => aggregator => EXACT_IN => get outAmount
          const outLamports = parseInt(quoteResp.outAmount || '0', 10);
          if (outLamports <= 0) return '';
          // Decimals for receiving token
          const outT = TOKENS.find((t) => t.address === outMint);
          const outDecimals = outT?.decimals ?? 9;
          return (outLamports / 10 ** outDecimals).toString();
        } else {
          // "ExactOut" => aggregator => EXACT_OUT => get inAmount
          const inLamports = parseInt(quoteResp.inAmount || '0', 10);
          if (inLamports <= 0) return '';
          // Decimals for paying token
          const inT = TOKENS.find((t) => t.address === inMint);
          const inDecimals = inT?.decimals ?? 9;
          return (inLamports / 10 ** inDecimals).toString();
        }
      } catch (err) {
        console.error('Quote error =>', err);
        return '';
      }
    },
    [jupiterApi]
  );

  // "You Pay" => aggregator => EXACT_IN
  const onPayAmountChange = useCallback(
    async (val) => {
      if (val && parseFloat(val) < 0) {
        val = '';
      }
      setPayAmount(val);

      if (!val) {
        setReceiveAmount('');
        return;
      }

      const out = await doQuote(payMint, receiveMint, val, 'ExactIn');
      setReceiveAmount(out || '');
    },
    [doQuote, payMint, receiveMint]
  );

  // "You Receive" => aggregator => EXACT_OUT
  const onReceiveAmountChange = useCallback(
    async (val) => {
      if (val && parseFloat(val) < 0) {
        val = '';
      }
      setReceiveAmount(val);

      if (!val) {
        setPayAmount('');
        return;
      }

      const pay = await doQuote(payMint, receiveMint, val, 'ExactOut');
      setPayAmount(pay || '');
    },
    [doQuote, payMint, receiveMint]
  );

  /**
   * 3) SWAP => aggregator => EXACT_IN
   */
  const doSwap = useCallback(async () => {
    if (!jupiterApi) {
      alert('Jupiter aggregator not ready');
      return;
    }
    if (!publicKey) {
      alert('Connect your wallet first!');
      return;
    }
    if (!payAmount) {
      alert('Enter how much SOL you pay');
      return;
    }

    setLoading(true);
    try {
      // convert pay => lamports
      const tIn = TOKENS.find((t) => t.address === payMint);
      const decIn = tIn?.decimals ?? 9;
      const lamports = parseFloat(payAmount) * 10 ** decIn;

      const quoteResp = await jupiterApi.quoteGet({
        inputMint: payMint,
        outputMint: receiveMint,
        amount: lamports,
        swapMode: 'ExactIn',
        slippageBps: 50
      });
      if (!quoteResp?.outAmount || quoteResp.outAmount === '0') {
        alert('No route found or aggregator returned outAmount=0');
        setLoading(false);
        return;
      }
      if (!quoteResp?.routePlan?.length) {
        alert('No routePlan => aggregator might be missing data');
        setLoading(false);
        return;
      }

      const bestRoute = quoteResp.routePlan[0].swapInfo;
      if (!bestRoute) {
        alert('Aggregator route is empty');
        setLoading(false);
        return;
      }

      const swapResp = await jupiterApi.swapInstructionsPost({
        swapRequest: bestRoute,
        userPublicKey: publicKey.toBase58()
      });
      if (!swapResp?.swapTransaction) {
        alert('No transaction => aggregator error');
        setLoading(false);
        return;
      }

      // parse & sign
      const txBuf = Buffer.from(swapResp.swapTransaction, 'base64');
      const transaction = Transaction.from(txBuf);

      const txSig = await sendTransaction(transaction, connection);
      alert(`Swap submitted! Tx Signature: ${txSig}`);
    } catch (err) {
      console.error('Swap error =>', err);
      alert(`Swap error => ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [jupiterApi, payMint, receiveMint, payAmount, publicKey, connection, sendTransaction]);

  // auto-refresh => re-quote => EXACT_IN
  useEffect(() => {
    const timer = setInterval(() => {
      if (payAmount) {
        onPayAmountChange(payAmount);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [onPayAmountChange, payAmount]);

  return (
    <div className="max-w-[400px] w-full mx-auto my-8 px-4 text-white">
      <div className="bg-[#1c243e] rounded-2xl pt-6 px-6 pb-8 flex flex-col text-center">
        <h2 className="text-2xl font-bold mb-4">Token Swap</h2>

        {/* Connect wallet => Phantom, etc. */}
        <div className="mb-4">
          <WalletMultiButtonDynamic />
        </div>

        {/* "You Pay" => aggregator => EXACT_IN */}
        <label className="text-left w-full font-semibold mb-1">You Pay</label>
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <div className="relative w-full h-[48px]">
            <Image
              src={getLogo(payMint)}
              alt="pay icon"
              width={24}
              height={24}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
            />
            {/* 
              Extra left padding on mobile (pl-16) so ticker "JUP" or "SOL" 
              is clearly spaced from icon. Revert to pl-10 on desktop.
            */}
            <select
              className="w-full h-full pl-16 md:pl-10 pr-8 rounded bg-[#29304e] border border-gray-500 outline-none"
              value={payMint}
              onChange={async (e) => {
                setPayMint(e.target.value);
                if (payAmount) {
                  const out = await doQuote(e.target.value, receiveMint, payAmount, 'ExactIn');
                  setReceiveAmount(out || '');
                }
              }}
            >
              {TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            className="w-full h-[48px] rounded bg-transparent border border-gray-500 placeholder-gray-400 text-right px-2"
            placeholder="0.00"
            value={payAmount}
            onChange={(e) => onPayAmountChange(e.target.value)}
          />
        </div>

        {/* "You Receive" => aggregator => EXACT_OUT if typed */}
        <label className="text-left w-full font-semibold mb-1">You Receive</label>
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <div className="relative w-full h-[48px]">
            <Image
              src={getLogo(receiveMint)}
              alt="receive icon"
              width={24}
              height={24}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
            />
            <select
              className="w-full h-full pl-16 md:pl-10 pr-8 rounded bg-[#29304e] border border-gray-500 outline-none"
              value={receiveMint}
              onChange={async (e) => {
                setReceiveMint(e.target.value);
                if (payAmount) {
                  const out = await doQuote(payMint, e.target.value, payAmount, 'ExactIn');
                  setReceiveAmount(out || '');
                }
              }}
            >
              {TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            className="w-full h-[48px] rounded bg-transparent border border-gray-500 placeholder-gray-400 text-right px-2"
            placeholder="0.00"
            value={receiveAmount}
            onChange={(e) => onReceiveAmountChange(e.target.value)}
          />
        </div>

        {/* Swap button */}
        <button
          onClick={doSwap}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded font-semibold w-full"
        >
          {loading ? 'Swapping...' : 'Swap Now'}
        </button>
      </div>
    </div>
  );
}
