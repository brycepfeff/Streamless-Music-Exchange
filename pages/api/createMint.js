// pages/api/createMint.js

import { Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { createInitializeMintInstruction, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  
  try {
    // Load the backend wallet secret from environment variables.
    if (!process.env.BACKEND_WALLET_SECRET) {
      throw new Error("BACKEND_WALLET_SECRET is not set in environment variables.");
    }
    const secretKeyArray = JSON.parse(process.env.BACKEND_WALLET_SECRET);
    const backendKeypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

    // Connect to the Solana RPC endpoint.
    const connection = new Connection(
      "https://clean-solemn-waterfall.solana-mainnet.quiknode.pro/d2863d9fc3dbb4c48f523ff357b6defe31eae786",
      "confirmed"
    );

    // Generate a new mint keypair.
    const mintKeypair = Keypair.generate();

    // Calculate rent exemption for the mint account.
    const lamports = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

    // Build a transaction to create and initialize the mint.
    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: backendKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    const decimals = 9;
    tx.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        backendKeypair.publicKey,
        backendKeypair.publicKey
      )
    );

    tx.feePayer = backendKeypair.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // Partial-sign with the mint keypair.
    tx.partialSign(mintKeypair);

    // Sign and send the transaction with the backend's wallet.
    const txSignature = await connection.sendTransaction(tx, [backendKeypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(txSignature, "confirmed");

    res.status(200).json({ mint: mintKeypair.publicKey.toBase58(), txSignature });
  } catch {
    console.error("Error creating mint");
    res.status(500).json({ error: "Error creating mint" });
  }
}
