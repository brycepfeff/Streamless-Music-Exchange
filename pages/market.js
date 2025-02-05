"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  MintLayout,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import axios from "axios";

// --- MPL Token Metadata Imports ---
import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";

// --- Umi & Bundle Imports ---
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { signerIdentity, percentAmount } from "@metaplex-foundation/umi";

// Dynamically load the wallet button
const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

/* -----------------------------------------------
   Helper Functions
----------------------------------------------- */

function sanitizeFileName(fileName) {
  return fileName.replace(/\s+/g, "_");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

async function uploadFileToPinata(file) {
  try {
    const base64Data = await fileToBase64(file);
    const payload = {
      fileName: sanitizeFileName(file.name),
      fileData: base64Data,
      fileType: file.type,
    };
    const response = await axios.post("/api/pinFile", payload);
    const cid = response.data.cid;
    if (!cid) throw new Error("CID not returned from API");
    return "https://ivory-wonderful-dog-322.mypinata.cloud/ipfs/" + cid;
  } catch (error) {
    throw error;
  }
}

async function confirmTransactionPolling(connection, signature, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const statuses = await connection.getSignatureStatuses([signature]);
    const status = statuses.value[0];
    if (status && status.confirmationStatus === "finalized") {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Transaction not confirmed within timeout");
}

/* -----------------------------------------------
   Main Component
----------------------------------------------- */

function MarketPage() {
  const walletAdapter = useWallet();
  const { publicKey, sendTransaction, signTransaction } = walletAdapter;
  const { connection } = useConnection();

  const userPubkey = publicKey ? new PublicKey(publicKey.toBase58()) : null;
  console.log("Wallet Public Key:", userPubkey ? userPubkey.toBase58() : "Undefined");

  const [mintedTokens, setMintedTokens] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [ticker, setTicker] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const audioFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

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

  const handleMint = async () => {
    if (!userPubkey) {
      alert("Please connect your wallet first.");
      return;
    }
    const finalTicker = ticker || "DEFAULT";
    const finalTokenName = tokenName || "Default Artist";
    const supplyInput = "1000000000";
    const tokenSupply = parseFloat(supplyInput);
    if (isNaN(tokenSupply)) {
      alert("Invalid supply value.");
      return;
    }
    setIsMinting(true);

    // 1. Upload off-chain files to Pinata.
    let logoUrl = "";
    let audioUrl = "";
    try {
      if (logoFile) {
        console.log("Uploading logo file:", logoFile.name);
        logoUrl = await uploadFileToPinata(logoFile);
        console.log("Logo uploaded with URL:", logoUrl);
      }
      if (audioFile) {
        console.log("Uploading audio file:", audioFile.name);
        audioUrl = await uploadFileToPinata(audioFile);
        console.log("Audio uploaded with URL:", audioUrl);
      }
    } catch {
      alert("File upload failed. Check the console for details.");
      setIsMinting(false);
      return;
    }

    // 2. Create metadata JSON and upload it.
    const metadataJSON = {
      name: finalTokenName,
      symbol: finalTicker,
      image: logoUrl || "",
      audio: audioUrl || "",
    };

    let metadataUrl = "";
    try {
      const blob = new Blob([JSON.stringify(metadataJSON)], { type: "application/json" });
      const metadataFile = new File([blob], "metadata.json", { type: "application/json" });
      metadataUrl = await uploadFileToPinata(metadataFile);
      console.log("Metadata uploaded with URL:", metadataUrl);
    } catch {
      alert("Metadata upload failed. Check the console for details.");
      setIsMinting(false);
      return;
    }

    console.log("Public Key (for metadata):", userPubkey.toBase58());
    console.log("Metadata URI (on-chain):", metadataUrl);

    // 3. Create the mint account transaction (client‑side).
    let mintKeypair;
    try {
      mintKeypair = Keypair.generate();
      console.log("Generated mint keypair:", mintKeypair.publicKey.toBase58());

      const mintTx = new Transaction();

      // Create the mint account.
      const lamports = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
      mintTx.add(
        SystemProgram.createAccount({
          fromPubkey: userPubkey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize the mint.
      const decimals = 9;
      mintTx.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          userPubkey,
          userPubkey
        )
      );

      // Create the associated token account (ATA) for the user.
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userPubkey
      );
      mintTx.add(
        createAssociatedTokenAccountInstruction(
          userPubkey,
          associatedTokenAddress,
          userPubkey,
          mintKeypair.publicKey
        )
      );

      // Mint tokens.
      // With decimals = 9, 1 token = 1e9 base units.
      // To mint 1,000,000,000 tokens, mint 1e9 * 1e9 = 1e18 base units.
      const amountToMint = 1000000000 * Math.pow(10, decimals);
      mintTx.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          userPubkey,
          amountToMint
        )
      );

      mintTx.feePayer = userPubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      mintTx.recentBlockhash = blockhash;

      // Partial-sign the transaction with the mint keypair.
      mintTx.partialSign(mintKeypair);

      // Let the user's wallet sign and send the transaction.
      const mintTxid = await sendTransaction(mintTx, connection);
      console.log("Mint transaction sent, signature:", mintTxid);
      await confirmTransactionPolling(connection, mintTxid, 120000);
      console.log("Mint confirmed, txid:", mintTxid);
    } catch {
      console.error("Mint creation error");
      alert("Mint creation failed. Check the console for details.");
      setIsMinting(false);
      return;
    }

    // 4. Create on-chain metadata using Metaplex's createV1 helper.
    let metadataTxSig = "";
    try {
      const umi = createUmi(
        "https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/d2863d9fc3dbb4c48f523ff357b6defe31eae786"
      ).use(mplTokenMetadata());

      umi.use(
        signerIdentity({
          publicKey: new PublicKey(userPubkey.toBase58()),
          signTransaction: async (tx) => await signTransaction(tx),
        })
      );

      const builder = createV1(umi, {
        mint: mintKeypair.publicKey,
        authority: new PublicKey(userPubkey.toBase58()),
        payer: new PublicKey(userPubkey.toBase58()),
        updateAuthority: new PublicKey(userPubkey.toBase58()),
        name: finalTokenName,
        symbol: finalTicker,
        uri: metadataUrl,
        sellerFeeBasisPoints: percentAmount(5.5),
        tokenStandard: TokenStandard.Fungible,
      });

      let instructions = builder.getInstructions();
      // Wrap keys as proper PublicKey instances if needed.
      instructions = instructions.map((instr) => ({
        ...instr,
        keys: instr.keys.map((k) => {
          if (typeof k.pubkey === "string") {
            return { ...k, pubkey: new PublicKey(k.pubkey) };
          }
          return k;
        }),
      }));

      const metadataTx = new Transaction().add(...instructions);
      metadataTx.feePayer = userPubkey;
      const { blockhash: metaBlockhash } = await connection.getLatestBlockhash();
      metadataTx.recentBlockhash = metaBlockhash;

      metadataTxSig = await sendTransaction(metadataTx, connection);
      console.log(
        `Metadata added. Tx: https://explorer.solana.com/tx/${metadataTxSig}?cluster=mainnet`
      );
    } catch {
      console.error("On-chain metadata creation failed");
      alert("On-chain metadata creation failed. Check the console for details.");
      setIsMinting(false);
      return;
    }

    const newToken = {
      id: mintedTokens.length + 1,
      mint: mintKeypair.publicKey.toBase58(),
      ticker: finalTicker,
      tokenName: finalTokenName,
      supply: supplyInput,
      audioFileName: audioFile ? audioFile.name : "",
      logoFileName: logoFile ? logoFile.name : "",
      mintedBy: userPubkey.toBase58(),
      metadataUri: metadataUrl,
      txSignature: metadataTxSig,
    };
    setMintedTokens((prev) => [...prev, newToken]);
    setTicker("");
    setTokenName("");
    setAudioFile(null);
    setLogoFile(null);
    setIsMinting(false);
  };

  const approvedTokens = mintedTokens.filter(
    (token) => token.mintedBy === (userPubkey ? userPubkey.toBase58() : "")
  );

  return (
    <div className="max-w-6xl mx-auto my-2 px-8 text-white">
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {/* Marketplace Card */}
        <div className="w-full sm:w-[400px] mx-auto bg-[#1c243e] rounded-2xl pt-6 px-6 pb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Marketplace</h2>
          {approvedTokens.length === 0 ? (
            <p className="text-gray-400 text-center">No approved tokens minted yet.</p>
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
            {/* Input for Song (Ticker) */}
            <div className="flex flex-col">
              <label className="text-white font-semibold mb-1">Song</label>
              <input
                type="text"
                placeholder="Ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full h-10 px-3 rounded bg-[#29304e] border border-gray-500 placeholder-gray-400 text-white focus:outline-none"
              />
            </div>
            {/* Input for Artist (Name) */}
            <div className="flex flex-col">
              <label className="text-white font-semibold mb-1">Artist</label>
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
