"use client"; // Tells Next.js this is a client-side component

import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

// Polyfill Buffer for the browser
import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

import { Connection, VersionedTransaction } from "@solana/web3.js";
import fetch from "cross-fetch";
import { useWallet } from "@solana/wallet-adapter-react";

// Dynamically load the wallet button to avoid SSR issues
const WalletMultiButtonDynamic = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

/** 
 * Mints => SOL + JUP
 */
const SOL_MINT = "So11111111111111111111111111111111111111112"; // W-SOL
const JUP_MINT = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"; // JUP

// Decimals => SOL=9, JUP=6
const TOKENS = [
  { symbol: "SOL", address: SOL_MINT, decimals: 9 },
  { symbol: "JUP", address: JUP_MINT, decimals: 6 },
];

/**
 * Helper => pick logos
 */
function getLogo(mint) {
  if (mint === SOL_MINT) {
    // SOL logo
    return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png";
  }
  if (mint === JUP_MINT) {
    // JUP logo => local file or external link
    return "/JUP.png";
  }
  // fallback
  return "/JUP.png";
}

function RealSwapPage() {
  // Keep a stable Connection so React hooks don't warn
  const customConnection = useMemo(() => {
    return new Connection(
      "https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/d2863d9fc3dbb4c48f523ff357b6defe31eae786"
    );
  }, []);

  const { publicKey, sendTransaction } = useWallet();

  // "You Pay" => default SOL
  const [payMint, setPayMint] = useState(SOL_MINT);
  const [payAmount, setPayAmount] = useState("");

  // "You Receive" => default JUP
  const [receiveMint, setReceiveMint] = useState(JUP_MINT);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * QUOTE => direct Jupiter REST call
   */
  const doQuote = useCallback(
    async (inMint, outMint, rawAmt, mode) => {
      try {
        if (!rawAmt || parseFloat(rawAmt) <= 0) return "";

        let decimals = 9;
        if (mode === "ExactIn") {
          const tokenInfo = TOKENS.find((t) => t.address === inMint);
          decimals = tokenInfo?.decimals ?? 9;
        } else {
          const tokenInfo = TOKENS.find((t) => t.address === outMint);
          decimals = tokenInfo?.decimals ?? 9;
        }

        const lamports = Math.floor(parseFloat(rawAmt) * 10 ** decimals);
        if (!lamports || lamports <= 0) return "";

        let url = `https://quote-api.jup.ag/v6/quote?inputMint=${inMint}&outputMint=${outMint}&amount=${lamports}&slippageBps=50`;
        if (mode === "ExactIn") {
          url += "&swapMode=ExactIn";
        } else {
          url += "&swapMode=ExactOut";
        }

        const quoteResponse = await (await fetch(url)).json();
        console.log("DEBUG: doQuote =>", quoteResponse);

        if (!quoteResponse.routePlan || quoteResponse.routePlan.length === 0) {
          console.log("No route found => routePlan is empty.");
          return "";
        }

        if (mode === "ExactIn") {
          const outLamports = parseInt(quoteResponse.outAmount || "0", 10);
          if (outLamports <= 0) return "";
          const outToken = TOKENS.find((t) => t.address === outMint);
          const outDecimals = outToken?.decimals ?? 9;
          return (outLamports / 10 ** outDecimals).toString();
        } else {
          const inLamports = parseInt(quoteResponse.inAmount || "0", 10);
          if (inLamports <= 0) return "";
          const inToken = TOKENS.find((t) => t.address === inMint);
          const inDecimals = inToken?.decimals ?? 9;
          return (inLamports / 10 ** inDecimals).toString();
        }
      } catch (err) {
        console.error("Quote error =>", err);
        return "";
      }
    },
    []
  );

  // "You Pay" => EXACT_IN
  const onPayAmountChange = useCallback(
    async (val) => {
      if (val && parseFloat(val) < 0) {
        val = "";
      }
      setPayAmount(val);

      if (!val) {
        setReceiveAmount("");
        return;
      }

      const out = await doQuote(payMint, receiveMint, val, "ExactIn");
      setReceiveAmount(out || "");
    },
    [doQuote, payMint, receiveMint]
  );

  // "You Receive" => EXACT_OUT
  const onReceiveAmountChange = useCallback(
    async (val) => {
      if (val && parseFloat(val) < 0) {
        val = "";
      }
      setReceiveAmount(val);

      if (!val) {
        setPayAmount("");
        return;
      }

      const pay = await doQuote(payMint, receiveMint, val, "ExactOut");
      setPayAmount(pay || "");
    },
    [doQuote, payMint, receiveMint]
  );

  /**
   *  SWAP => aggregator => EXACT_IN
   */
  const doSwap = useCallback(async () => {
    try {
      if (!publicKey) {
        alert("Connect your wallet first!");
        return;
      }
      if (!payAmount || parseFloat(payAmount) <= 0) {
        alert('Enter a valid "You Pay" amount');
        return;
      }

      setLoading(true);

      // 1) Fresh quote
      const tokenIn = TOKENS.find((t) => t.address === payMint);
      const decIn = tokenIn?.decimals ?? 9;
      const lamports = Math.floor(parseFloat(payAmount) * 10 ** decIn);

      const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${payMint}&outputMint=${receiveMint}&amount=${lamports}&slippageBps=50&swapMode=ExactIn`;
      const quoteResponse = await (await fetch(quoteUrl)).json();
      console.log("DEBUG: doSwap => quoteResponse =>", quoteResponse);

      if (!quoteResponse.routePlan || quoteResponse.routePlan.length === 0) {
        alert("No route found (routePlan is empty).");
        setLoading(false);
        return;
      }
      if (!quoteResponse.outAmount || quoteResponse.outAmount === "0") {
        alert("No valid outAmount from aggregator (maybe 0 route).");
        setLoading(false);
        return;
      }

      // 2) Prepare swap body
      const swapBody = {
        quoteResponse,
        userPublicKey: publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      };

      // 3) /swap
      const swapResp = await (
        await fetch("https://quote-api.jup.ag/v6/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(swapBody),
        })
      ).json();

      console.log("DEBUG: doSwap => swapResp =>", swapResp);
      const { swapTransaction } = swapResp;
      if (!swapTransaction) {
        alert("No swapTransaction returned. Check logs.");
        setLoading(false);
        return;
      }

      // 4) Versioned Transaction
      const txBuf = Buffer.from(swapTransaction, "base64");
      const versionedTx = VersionedTransaction.deserialize(txBuf);

      // 5) Sign + send
      const txSig = await sendTransaction(versionedTx, customConnection);
      alert(`Swap submitted! Tx Signature: ${txSig}`);
    } catch (err) {
      console.error("Swap error =>", err);
      alert(`Swap error => ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [publicKey, payMint, receiveMint, payAmount, customConnection, sendTransaction]);

  // Auto-refresh => re-quote => EXACT_IN
  useEffect(() => {
    const timer = setInterval(() => {
      if (payAmount) {
        onPayAmountChange(payAmount);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [onPayAmountChange, payAmount]);

  // Example snippet: 0.1 SOL => JUP
  useEffect(() => {
    (async () => {
      try {
        const url =
          "https://quote-api.jup.ag/v6/quote?" +
          "inputMint=So11111111111111111111111111111111111111112" + // SOL
          "&outputMint=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" + // JUP
          "&amount=100000000" + // 0.1 SOL
          "&slippageBps=50"; // 0.5% slippage

        const quoteResponse = await (await fetch(url)).json();
        console.log("Static 0.1 SOL => JUP quote:", quoteResponse);
      } catch (err) {
        console.error("Example snippet error =>", err);
      }
    })();
  }, []);

  return (
    <div className="max-w-[400px] w-full mx-auto my-8 px-4 text-white">
      <div className="bg-[#141e2a] rounded-2xl pt-6 px-6 pb-8 flex flex-col text-center">
        <h2 className="text-2xl font-bold mb-4">Token Swap</h2>

        {/* Connect wallet => Phantom, etc. */}
        <div className="mb-4">
          <WalletMultiButtonDynamic />
        </div>

        {/* "You Pay" => EXACT_IN */}
        <label className="text-left w-full font-semibold mb-1">You Pay</label>
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <div className="relative w-full h-[48px]">

            {/* ICON => hide on mobile, show on desktop */}
            <Image
              src={getLogo(payMint)}
              alt="pay icon"
              width={24}
              height={24}
              className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
            />

            <select
              className="
                w-full h-full 
                pl-2 md:pl-10  /* Minimal padding on mobile, more on desktop */
                pr-8 
                rounded 
                bg-[#182431] 
                border border-gray-500 
                outline-none
              "
              value={payMint}
              onChange={async (e) => {
                setPayMint(e.target.value);
                if (payAmount) {
                  const out = await doQuote(e.target.value, receiveMint, payAmount, "ExactIn");
                  setReceiveAmount(out || "");
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

        {/* "You Receive" => EXACT_OUT if typed */}
        <label className="text-left w-full font-semibold mb-1">You Receive</label>
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <div className="relative w-full h-[48px]">

            {/* ICON => hide on mobile, show on desktop */}
            <Image
              src={getLogo(receiveMint)}
              alt="receive icon"
              width={24}
              height={24}
              className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
            />

            <select
              className="
                w-full h-full 
                pl-2 md:pl-10  /* Minimal padding on mobile, more on desktop */
                pr-8 
                rounded 
                bg-[#182431] 
                border border-gray-500 
                outline-none
              "
              value={receiveMint}
              onChange={async (e) => {
                setReceiveMint(e.target.value);
                if (payAmount) {
                  const out = await doQuote(payMint, e.target.value, payAmount, "ExactIn");
                  setReceiveAmount(out || "");
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
          className="bg-gradient-to-r from-[#3298ad] to-[#004aad] text-white p-3 rounded font-semibold w-full"
        >
          {loading ? "Swapping..." : "Swap Now"}
        </button>
      </div>
    </div>
  );
}

// Disable SSR so everything is client side
export default dynamic(() => Promise.resolve(RealSwapPage), {
  ssr: false,
});