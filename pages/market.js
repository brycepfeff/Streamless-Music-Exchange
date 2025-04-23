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
import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { signerIdentity, percentAmount } from "@metaplex-foundation/umi";

const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

function sanitizeFileName(fileName) {
  return fileName.replace(/\s+/g, "_");
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };
    reader.onerror = reject;
  });
}
async function uploadFileToPinata(file) {
  const base64Data = await fileToBase64(file);
  const resp = await axios.post("/api/pinFile", {
    fileName: sanitizeFileName(file.name),
    fileData: base64Data,
    fileType: file.type,
  });
  if (!resp.data.cid) throw new Error("CID not returned");
  return "https://ivory-wonderful-dog-322.mypinata.cloud/ipfs/" + resp.data.cid;
}
async function confirmTransactionPolling(connection, signature, timeout = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { value } = await connection.getSignatureStatuses([signature]);
    if (value[0]?.confirmationStatus === "finalized") return value[0];
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction not confirmed");
}

function MarketPage() {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();
  const userPubkey = publicKey ? new PublicKey(publicKey.toBase58()) : null;

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
      { id: 1, mint: "DummyMintAddress1", ticker: "ABC", tokenName: "Alpha Beta Coin", supply: "1000000000", audioFileName: "example.mp3", logoFileName: "logo1.png", mintedBy: "ExampleWalletAddress" },
      { id: 2, mint: "DummyMintAddress2", ticker: "XYZ", tokenName: "Xylophone Token", supply: "1000000000", audioFileName: "", logoFileName: "", mintedBy: "ExampleWalletAddress" },
    ]);
  }, []);

  useEffect(() => {
    fetchMintedTokens();
  }, [fetchMintedTokens]);

  const approvedTokens = mintedTokens.filter(
    (t) => t.mintedBy === userPubkey?.toBase58()
  );

  const handleChooseAudioFile = () => audioFileInputRef.current?.click();
  const handleChooseLogoFile = () => logoFileInputRef.current?.click();

  const handleMint = async () => {
    if (!userPubkey) {
      alert("Please connect your wallet first.");
      return;
    }
    const finalTicker = ticker || "DEFAULT";
    const finalTokenName = tokenName || "Default Artist";
    const supplyInput = "1000000000";
    if (isNaN(parseFloat(supplyInput))) {
      alert("Invalid supply value.");
      return;
    }
    setIsMinting(true);

    let logoUrl = "", audioUrl = "";
    try {
      if (logoFile) logoUrl = await uploadFileToPinata(logoFile);
      if (audioFile) audioUrl = await uploadFileToPinata(audioFile);
    } catch {
      alert("File upload failed.");
      setIsMinting(false);
      return;
    }

    const metadataJSON = { name: finalTokenName, symbol: finalTicker, image: logoUrl, audio: audioUrl };
    let metadataUrl = "";
    try {
      const blob = new Blob([JSON.stringify(metadataJSON)], { type: "application/json" });
      const file = new File([blob], "metadata.json", { type: "application/json" });
      metadataUrl = await uploadFileToPinata(file);
    } catch {
      alert("Metadata upload failed.");
      setIsMinting(false);
      return;
    }

    let mintKeypair;
    try {
      mintKeypair = Keypair.generate();
      const mintTx = new Transaction();
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
      mintTx.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          9,
          userPubkey,
          userPubkey
        )
      );
      const ata = await getAssociatedTokenAddress(mintKeypair.publicKey, userPubkey);
      mintTx.add(
        createAssociatedTokenAccountInstruction(
          userPubkey,
          ata,
          userPubkey,
          mintKeypair.publicKey
        )
      );
      mintTx.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          ata,
          userPubkey,
          1000000000 * 10 ** 9
        )
      );
      mintTx.feePayer = userPubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      mintTx.recentBlockhash = blockhash;
      mintTx.partialSign(mintKeypair);
      const txid = await sendTransaction(mintTx, connection);
      await confirmTransactionPolling(connection, txid);
    } catch {
      alert("Mint creation failed.");
      setIsMinting(false);
      return;
    }

    try {
      const umi = createUmi("https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/...").use(mplTokenMetadata());
      umi.use(signerIdentity({ publicKey: userPubkey, signTransaction }));
      const builder = createV1(umi, {
        mint: mintKeypair.publicKey,
        authority: userPubkey,
        payer: userPubkey,
        updateAuthority: userPubkey,
        name: finalTokenName,
        symbol: finalTicker,
        uri: metadataUrl,
        sellerFeeBasisPoints: percentAmount(5.5),
        tokenStandard: TokenStandard.Fungible,
      });
      const instrs = builder.getInstructions().map((i) => ({
        ...i,
        keys: i.keys.map((k) =>
          typeof k.pubkey === "string" ? { ...k, pubkey: new PublicKey(k.pubkey) } : k
        ),
      }));
      const metaTx = new Transaction().add(...instrs);
      metaTx.feePayer = userPubkey;
      const { blockhash: mb } = await connection.getLatestBlockhash();
      metaTx.recentBlockhash = mb;
      await sendTransaction(metaTx, connection);
    } catch {
      alert("On-chain metadata creation failed.");
      setIsMinting(false);
      return;
    }

    setMintedTokens((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        mint: mintKeypair.publicKey.toBase58(),
        ticker: finalTicker,
        tokenName: finalTokenName,
        supply: supplyInput,
        audioFileName: audioFile?.name || "",
        logoFileName: logoFile?.name || "",
        mintedBy: userPubkey.toBase58(),
        metadataUri: metadataUrl,
      },
    ]);
    setTicker("");
    setTokenName("");
    setAudioFile(null);
    setLogoFile(null);
    setIsMinting(false);
  };

  return (
    <div className="max-w-[400px] w-full mx-auto my-8 px-4 text-white">
      {/* Create Token Card */}
      <div className="bg-[#141e2a] rounded-2xl pt-6 px-6 pb-8 flex flex-col text-center">
        <h2 className="text-2xl font-bold mb-4">Create Token</h2>
        <div className="mb-4">
          <WalletMultiButtonDynamic />
        </div>
        <div className="space-y-4 mb-4 w-full">
          <div className="flex flex-col">
            <label className="text-left w-full font-semibold mb-1">Song</label>
            <input
              type="text"
              placeholder="Ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full h-[48px] px-3 rounded bg-[#1f2a3a] border border-gray-500 placeholder-gray-400 text-white focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-left w-full font-semibold mb-1">Artist</label>
            <input
              type="text"
              placeholder="Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="w-full h-[48px] px-3 rounded bg-[#1f2a3a] border border-gray-500 placeholder-gray-400 text-white focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-white font-semibold mb-1 text-center">Token Logo</label>
            <input
              type="file"
              accept="image/*"
              ref={logoFileInputRef}
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={handleChooseLogoFile}
              className="block mx-auto bg-[#141e2a] border border-gray-500 text-white text-sm py-1 px-2 rounded-full font-semibold whitespace-nowrap mb-1"
            >
              {logoFile?.name || "Choose Logo"}
            </button>
          </div>
          <div className="flex flex-col">
            <label className="text-white font-semibold mb-1 text-center">Audio Media</label>
            <input
              type="file"
              accept="audio/*"
              ref={audioFileInputRef}
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={handleChooseAudioFile}
              className="block mx-auto bg-[#141e2a] border border-gray-500 text-white text-sm py-1 px-2 rounded-full font-semibold whitespace-nowrap mb-1"
            >
              {audioFile?.name || "Choose Audio"}
            </button>
          </div>
        </div>
        <button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full p-3 rounded font-semibold bg-gradient-to-r from-[#3298ad] to-[#004aad]"
        >
          {isMinting ? "Minting..." : "Mint Now"}
        </button>
      </div>

      {/* Marketplace Card */}
      <div className="mt-8 bg-[#141e2a] rounded-2xl pt-6 px-6 pb-8 flex flex-col text-center">
        <h2 className="text-2xl font-bold mb-4 text-center">Marketplace</h2>
        {approvedTokens.length === 0 ? (
          <p className="text-gray-400 text-center">No approved tokens minted yet.</p>
        ) : (
          <ul className="divide-y divide-gray-600 text-left">
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
                    {token.audioFileName && <span> | Audio: {token.audioFileName}</span>}
                    {token.logoFileName && <span> | Logo: {token.logoFileName}</span>}
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
    </div>
  );
}

export default dynamic(() => Promise.resolve(MarketPage), { ssr: false });
