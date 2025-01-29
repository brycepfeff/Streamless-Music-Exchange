import React, { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { Configuration, DefaultApi } from '@jup-ag/api';
import Image from 'next/image';

const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'FCqfQSujuPxy6V42UVcP7ZhvtrPTbY1hEAfnnFvHbcmN';

const LOCAL_TOKENS = [
  { address: SOL_MINT, symbol: 'SOL', decimals: 9 },
  { address: USDC_MINT, symbol: 'USDC', decimals: 6 },
];

const FALLBACK_LOGO =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';

export default function SwapPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [defaultApi, setDefaultApi] = useState(null);

  const [inputMint, setInputMint] = useState(USDC_MINT);
  const [inputAmount, setInputAmount] = useState('');
  const [outputMint, setOutputMint] = useState(SOL_MINT);
  const [outputAmount, setOutputAmount] = useState('');

  // Searching + dropdown
  const [inputSearch, setInputSearch] = useState('');
  const [showInputDropdown, setShowInputDropdown] = useState(false);

  const [outputSearch, setOutputSearch] = useState('');
  const [showOutputDropdown, setShowOutputDropdown] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const config = new Configuration({ basePath: 'https://quote-api.jup.ag' });
    const api = new DefaultApi(config);
    setDefaultApi(api);
  }, []);

  // Quoting logic
  const doQuote = useCallback(
    async (inMint, outMint, rawAmt, mode) => {
      if (!defaultApi || !rawAmt || !inMint || !outMint) return null;

      let decimals = 9;
      const found = LOCAL_TOKENS.find((t) => t.address === inMint);
      if (found && mode === 'ExactIn') {
        decimals = found.decimals;
      }

      const lamports = parseFloat(rawAmt) * 10 ** decimals;
      try {
        const quoteResp = await defaultApi.quoteGet({
          amount: lamports,
          inputMint: inMint,
          outputMint: outMint,
          swapMode: mode,
          slippageBps: 50,
        });
        if (!quoteResp || !quoteResp.routes || quoteResp.routes.length === 0) {
          return null;
        }
        const best = quoteResp.routes[0];
        if (mode === 'ExactIn' && best.outAmount) {
          return (best.outAmount / 1e9).toString();
        }
        if (mode === 'ExactOut' && best.inAmount) {
          return (best.inAmount / 1e9).toString();
        }
      } catch (err) {
        console.error('Quote error =>', err);
        return null;
      }
      return null;
    },
    [defaultApi]
  );

  const onInputAmountChange = useCallback(
    async (val) => {
      setInputAmount(val);
      if (!outputMint) return;
      const out = await doQuote(inputMint, outputMint, val, 'ExactIn');
      setOutputAmount(out || '');
    },
    [doQuote, inputMint, outputMint]
  );

  const onOutputAmountChange = useCallback(
    async (val) => {
      setOutputAmount(val);
      if (!inputMint) return;
      const inp = await doQuote(inputMint, outputMint, val, 'ExactOut');
      setInputAmount(inp || '');
    },
    [doQuote, inputMint, outputMint]
  );

  const doSwap = useCallback(async () => {
    if (!inputMint || !outputMint) {
      alert('Pick input + output tokens');
      return;
    }
    if (!inputAmount) {
      alert('Enter input amount');
      return;
    }
    setLoading(true);
    try {
      if (!publicKey) {
        alert('Connect your wallet first!');
        setLoading(false);
        return;
      }

      let decimals = 9;
      const found = LOCAL_TOKENS.find((t) => t.address === inputMint);
      if (found) decimals = found.decimals;

      const lamports = parseFloat(inputAmount) * 10 ** decimals;
      const quoteResp = await defaultApi.quoteGet({
        amount: lamports,
        inputMint,
        outputMint,
        swapMode: 'ExactIn',
        slippageBps: 50,
      });
      if (!quoteResp || !quoteResp.routes || quoteResp.routes.length === 0) {
        alert('No route found for that pair');
        setLoading(false);
        return;
      }
      const best = quoteResp.routes[0];

      const swapResp = await defaultApi.swapInstructionsPost({
        route: best,
        userPublicKey: publicKey.toBase58(),
      });
      if (!swapResp || !swapResp.swapTransaction) {
        alert('No transaction data');
        setLoading(false);
        return;
      }
      const txBuf = Buffer.from(swapResp.swapTransaction, 'base64');
      const transaction = Transaction.from(txBuf);

      const txSig = await sendTransaction(transaction, connection);
      alert(`Swap success => ${txSig}`);
    } catch (error) {
      alert(`Swap error => ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [
    inputMint,
    outputMint,
    inputAmount,
    defaultApi,
    publicKey,
    connection,
    sendTransaction
  ]);

  // Auto refresh => exactIn
  useEffect(() => {
    const timer = setInterval(() => {
      if (!inputAmount && !outputAmount) return;
      onInputAmountChange(inputAmount);
    }, 30000);
    return () => clearInterval(timer);
  }, [onInputAmountChange, inputAmount, outputAmount]);

  // Helpers
  const truncated = (s) => {
    if (!s) return '';
    if (s.length <= 10) return s;
    return s.slice(0, 6) + '...' + s.slice(-4);
  };
  const getSymbol = (addr) => {
    if (addr === SOL_MINT)  return 'SOL';
    if (addr === USDC_MINT) return 'USDC';
    return '???';
  };
  const getLogo = () => FALLBACK_LOGO;

  const flipTokens = useCallback(async () => {
    const oldIn = inputMint;
    const oldOut = outputMint;
    const oldInAmt = inputAmount;
    const oldOutAmt = outputAmount;

    setInputMint(oldOut);
    setOutputMint(oldIn);
    setInputAmount(oldOutAmt);
    setOutputAmount(oldInAmt);

    await onInputAmountChange(oldOutAmt);
  }, [inputMint, outputMint, inputAmount, outputAmount, onInputAmountChange]);

  return (
    <div className="relative z-50 max-w-[400px] w-full mx-auto my-8 px-4 sm:px-0 text-white">
      <div
        className="bg-[#1c243e] rounded-2xl pt-8 px-6 pb-10 flex flex-col text-center relative"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <h2 className="text-2xl font-bold mb-3">Token Swap</h2>

        <div className="mb-3">
          <WalletMultiButtonDynamic />
        </div>

        {/* "You Pay" */}
        <div className="text-left font-semibold mb-2">You Pay</div>
        <div className="flex mb-0">
          <div className="relative flex items-center border-2 border-gray-500 rounded-xl w-full overflow-hidden">
            <input
              type="text"
              className="appearance-none p-3 px-4 w-full outline-none border-none bg-transparent placeholder-gray-400"
              placeholder="Select Token"
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              onClick={() => setShowInputDropdown(true)}
            />
            <input
              type="number"
              className="appearance-none p-3 px-4 w-[100px] text-right outline-none border-none bg-transparent placeholder-gray-400"
              placeholder="0.00"
              value={inputAmount}
              onChange={(e) => onInputAmountChange(e.target.value)}
            />
            {showInputDropdown && (
              <div
                className="absolute z-50 bg-[#1c243e] border-2 border-gray-500 w-full max-h-36 overflow-auto top-full left-0"
                style={{ marginTop: '2px' }}
                onMouseDown={(ee) => ee.preventDefault()}
              >
                {LOCAL_TOKENS.filter((t) =>
                  getSymbol(t.address).toLowerCase().includes(inputSearch.toLowerCase())
                ).map((t) => {
                  const sym = getSymbol(t.address);
                  const label = truncated(sym);
                  const logo = getLogo();
                  return (
                    <div
                      key={t.address}
                      className="p-2 hover:bg-[#29304e] cursor-pointer flex items-center space-x-2"
                      onMouseDown={() => {
                        setInputSearch(label);
                        setInputMint(t.address);
                        setShowInputDropdown(false);
                      }}
                    >
                      <Image
                        src={logo}
                        alt="icon"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/*
          Flip => my-4 => half as far from “You Pay” as when it was my-8
        */}
        <div className="flex justify-center items-center my-4">
          <button
            onClick={flipTokens}
            className="w-10 h-10 bg-[#8473e3] rounded-full flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1c233b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M7 19V5 M7 5L5 7 M7 5L9 7" />
              <path d="M17 5V19 M17 19L15 17 M17 19L19 17" />
            </svg>
          </button>
        </div>

        {/*
          "You Receive" => negative margin => from -3rem to -2rem => 
          so it moves down from the flip circle half of what it used to be
        */}
        <div className="mt-[-2rem]">
          <div className="text-left font-semibold mb-2">You Receive</div>
          <div className="flex mb-0">
            <div className="relative flex items-center border-2 border-gray-500 rounded-xl w-full overflow-hidden">
              <input
                type="text"
                className="appearance-none p-3 px-4 w-full outline-none border-none bg-transparent placeholder-gray-400"
                placeholder="Select Token"
                value={outputSearch}
                onChange={(e) => setOutputSearch(e.target.value)}
                onClick={() => setShowOutputDropdown(true)}
              />
              <input
                type="number"
                className="appearance-none p-3 px-4 w-[100px] text-right outline-none border-none bg-transparent placeholder-gray-400"
                placeholder="0.00"
                value={outputAmount}
                onChange={(e) => onOutputAmountChange(e.target.value)}
              />
              {showOutputDropdown && (
                <div
                  className="absolute z-50 bg-[#1c243e] border-2 border-gray-500 w-full max-h-36 overflow-auto top-full left-0"
                  style={{ marginTop: '2px' }}
                  onMouseDown={(ee) => ee.preventDefault()}
                >
                  {LOCAL_TOKENS.filter((t) =>
                    getSymbol(t.address).toLowerCase().includes(outputSearch.toLowerCase())
                  ).map((t) => {
                    const sym = getSymbol(t.address);
                    const label = truncated(sym);
                    const logo = getLogo();
                    return (
                      <div
                        key={t.address}
                        className="p-2 hover:bg-[#29304e] cursor-pointer flex items-center space-x-2"
                        onMouseDown={() => {
                          setOutputSearch(label);
                          setOutputMint(t.address);
                          setShowOutputDropdown(false);
                        }}
                      >
                        <Image
                          src={logo}
                          alt="icon"
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Now => no border */}
        <button
          onClick={doSwap}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 px-4 rounded-xl font-semibold w-full mt-3"
        >
          {loading ? 'Swapping...' : 'Swap Now'}
        </button>
      </div>
    </div>
  );
}
