"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  MintLayout,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Dynamically load the wallet button
const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

function MarketPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // State for tracking minted tokens (for UI display)
  const [mintedTokens, setMintedTokens] = useState([]);
  const [isMinting, setIsMinting] = useState(false);

  // Input fields for token details (Artist and Song)
  const [ticker, setTicker] = useState("");
  const [tokenName, setTokenName] = useState("");

  // File uploads for additional metadata
  const [audioFile, setAudioFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Refs for hidden file inputs
  const audioFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  // Dummy fetch function to simulate displaying minted tokens
  const fetchMintedTokens = useCallback(async () => {
    setMintedTokens([
      {
        id: 1,
        mint: "DummyMintAddress1",
        ticker: "ABC",
        tokenName: "Alpha Beta Coin",
        supply: "1000000000",
        audioFileName: "example.mp3",
        logoFileName: "logo1.png",
        mintedBy: "ExampleWalletAddress",
      },
      {
        id: 2,
        mint: "DummyMintAddress2",
        ticker: "XYZ",
        tokenName: "Xylophone Token",
        supply: "1000000000",
        audioFileName: "",
        logoFileName: "",
        mintedBy: "ExampleWalletAddress",
      },
    ]);
  }, []);

  useEffect(() => {
    fetchMintedTokens();
  }, [fetchMintedTokens]);

  const handleMint = async () => {
    if (!publicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    // Use default values if inputs are empty.
    // For the Artist field, default to "DEFAULT"
    const finalTicker = ticker || "DEFAULT";
    // For the Song field, default to "Default Song"
    const finalTokenName = tokenName || "Default Song";
    // Set supply to the default value of "1000000000"
    const supplyInput = "1000000000";
    const tokenSupply = parseFloat(supplyInput);
    if (isNaN(tokenSupply)) {
      alert("Invalid supply value.");
      return;
    }
    setIsMinting(true);

    try {
      const decimals = 9;
      const supplyAmount = tokenSupply * Math.pow(10, decimals);

      // Generate a new mint keypair
      const mintKeypair = Keypair.generate();

      // Get rent exemption amount for the mint account
      const rentExemption = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );

      // Build the transaction
      const transaction = new Transaction();

      // 1. Create the mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports: rentExemption,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // 2. Initialize the mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey, // mint account
          decimals,
          publicKey, // mint authority
          publicKey  // freeze authority (optional)
        )
      );

      // 3. Create the associated token account for the wallet
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          associatedTokenAddress, // ATA address
          publicKey, // owner
          mintKeypair.publicKey // mint
        )
      );

      // 4. Mint tokens to the associated token account
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey, // mint
          associatedTokenAddress, // destination account
          publicKey, // mint authority
          supplyAmount // amount (in smallest units)
        )
      );

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Partially sign the transaction with the mint keypair
      transaction.partialSign(mintKeypair);

      // Request the wallet adapter to sign the transaction
      const signedTransaction = await signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction);
      await connection.confirmTransaction(txid);

      console.log("Mint successful, txid:", txid);

      // Update local state (for display) with the new token data
      const newToken = {
        id: mintedTokens.length + 1,
        mint: mintKeypair.publicKey.toBase58(),
        ticker: finalTicker,
        tokenName: finalTokenName,
        supply: supplyInput,
        audioFileName: audioFile ? audioFile.name : "",
        logoFileName: logoFile ? logoFile.name : "",
        mintedBy: publicKey.toBase58(),
      };
      setMintedTokens((prev) => [...prev, newToken]);

      // Clear the form fields
      setTicker("");
      setTokenName("");
      setAudioFile(null);
      setLogoFile(null);
    } catch (err) {
      console.error("Minting error:", err);
      alert("Minting failed. Please try again.");
    }
    setIsMinting(false);
  };

  const approvedTokens = mintedTokens.filter(
    (token) => token.mintedBy === (publicKey && publicKey.toBase58())
  );

  const handleChooseAudioFile = () => {
    if (audioFileInputRef.current) {
      audioFileInputRef.current.click();
    }
  };

  const handleChooseLogoFile = () => {
    if (logoFileInputRef.current) {
      logoFileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-2 px-8 text-white">
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {/* Marketplace Card (Swapped order: Marketplace first) */}
        <div className="w-full sm:w-[400px] mx-auto bg-[#1c243e] rounded-2xl pt-6 px-6 pb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Marketplace</h2>
          {approvedTokens.length === 0 ? (
            <p className="text-gray-400 text-center">
              No approved tokens minted yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-600">
              {approvedTokens.map((token) => (
                <li
                  key={token.id}
                  className="py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div>
                    <span className="font-medium">
                      Token #{token.id} - {token.ticker}{" "}
                      {token.tokenName && `(${token.tokenName})`}
                    </span>
                    <div className="text-xs text-gray-400">
                      Supply: {token.supply}
                      {token.audioFileName && (
                        <span> | Audio: {token.audioFileName}</span>
                      )}
                      {token.logoFileName && (
                        <span> | Logo: {token.logoFileName}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 break-all mt-1 sm:mt-0">
                    Tx: {token.txSignature}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create Token Card */}
        <div className="w-full sm:w-[400px] mx-auto bg-[#1c243e] rounded-2xl pt-6 px-6 pb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Create Token</h2>
          <div className="mb-6 flex justify-center">
            <WalletMultiButtonDynamic />
          </div>
          <div className="space-y-4 mb-4">
            <div className="flex flex-col">
              {/* Label is "Artist" but placeholder remains "Ticker" */}
              <label className="text-white font-semibold mb-1">Artist</label>
              <input
                type="text"
                placeholder="Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full h-10 px-3 rounded bg-[#29304e] border border-gray-500 placeholder-gray-400 text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              {/* Label is "Song" but placeholder remains "Name" */}
              <label className="text-white font-semibold mb-1">Song</label>
              <input
                type="text"
                placeholder="Name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full h-10 px-3 rounded bg-[#29304e] border border-gray-500 placeholder-gray-400 text-white focus:outline-none"
              />
            </div>
            {/* Section for Token Logo */}
            <div className="flex flex-col">
              <label className="text-white font-semibold mb-1 text-center">
                Token Logo
              </label>
              <input
                type="file"
                accept="image/*"
                ref={logoFileInputRef}
                onChange={(e) =>
                  setLogoFile(e.target.files ? e.target.files[0] : null)
                }
                className="hidden"
              />
              <button
                type="button"
                onClick={handleChooseLogoFile}
                className="block mx-auto bg-[#1c243e] border border-gray-500 text-white text-sm py-1 px-2 rounded-full font-semibold whitespace-nowrap mb-1"
              >
                {logoFile ? logoFile.name : "Choose Logo"}
              </button>
            </div>
            {/* Section for Audio Media */}
            <div className="flex flex-col">
              <label className="text-white font-semibold mb-1 text-center">
                Audio Media
              </label>
              <input
                type="file"
                accept="audio/*"
                ref={audioFileInputRef}
                onChange={(e) =>
                  setAudioFile(e.target.files ? e.target.files[0] : null)
                }
                className="hidden"
              />
              <button
                type="button"
                onClick={handleChooseAudioFile}
                className="block mx-auto bg-[#1c243e] border border-gray-500 text-white text-sm py-1 px-2 rounded-full font-semibold whitespace-nowrap mb-1"
              >
                {audioFile ? audioFile.name : "Choose Audio"}
              </button>
            </div>
          </div>
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="w-full p-3 rounded font-semibold bg-gradient-to-r from-purple-500 to-indigo-600"
          >
            {isMinting ? "Minting..." : "Mint Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MarketPage), { ssr: false });
