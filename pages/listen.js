import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import dynamic from "next/dynamic";
import * as borsh from "borsh";

// Dynamically load the wallet button
const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

// ----- Minimal Borsh Schema for Metadata Decoding -----
class Creator {
  constructor(args) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

class Data {
  constructor(args) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

class MetadataData {
  constructor(args) {
    this.key = args.key;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = new Data(args.data);
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
  }
}

const METADATA_SCHEMA = new Map([
  [
    Creator,
    {
      kind: "struct",
      fields: [
        ["address", [32]],
        ["verified", "u8"],
        ["share", "u8"],
      ],
    },
  ],
  [
    Data,
    {
      kind: "struct",
      fields: [
        ["name", "string"],
        ["symbol", "string"],
        ["uri", "string"],
        ["sellerFeeBasisPoints", "u16"],
        ["creators", { kind: "option", type: [Creator] }],
      ],
    },
  ],
  [
    MetadataData,
    {
      kind: "struct",
      fields: [
        ["key", "u8"],
        ["updateAuthority", [32]],
        ["mint", [32]],
        ["data", Data],
        ["primarySaleHappened", "u8"],
        ["isMutable", "u8"],
      ],
    },
  ],
]);

// Use deserializeUnchecked to decode metadata and ignore extra trailing bytes.
function decodeMetadata(buffer) {
  return borsh.deserializeUnchecked(
    METADATA_SCHEMA,
    MetadataData,
    buffer
  );
}

// The Token Metadata program ID.
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export default function MusicPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [musicTokens, setMusicTokens] = useState([]);

  useEffect(() => {
    if (!publicKey) {
      setMusicTokens([]);
      return;
    }
    (async () => {
      try {
        // Get all parsed token accounts for the connected wallet.
        const resp = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }
        );
        const tokens = [];
        // Process each token account.
        for (const item of resp.value) {
          const info = item.account.data.parsed.info;
          const uiAmount = Number(info.tokenAmount.uiAmount);
          // Only consider tokens with a balance >= 1.
          if (uiAmount >= 1) {
            try {
              const mintAddress = info.mint;
              const mintPubkey = new PublicKey(mintAddress);
              // Derive the PDA for the token's metadata account.
              const [metadataPDA] = await PublicKey.findProgramAddress(
                [
                  Buffer.from("metadata"),
                  METADATA_PROGRAM_ID.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                METADATA_PROGRAM_ID
              );
              const accountInfo = await connection.getAccountInfo(metadataPDA);
              if (!accountInfo) continue;
              // Decode on-chain metadata.
              const metadata = decodeMetadata(accountInfo.data);
              // Clean the URI by removing null characters.
              const uri = metadata.data.uri.replace(/\0/g, "");
              if (!uri) continue;
              // Fetch off-chain JSON metadata.
              const metadataResponse = await fetch(uri);
              const metadataJson = await metadataResponse.json();
              // Only include tokens that have a non-empty audio field.
              if (metadataJson.audio && metadataJson.audio.trim() !== "") {
                tokens.push({
                  mint: mintAddress,
                  song: metadataJson.symbol,
                  artist: metadataJson.name,
                  audio: metadataJson.audio,
                  image: metadataJson.image,
                });
              }
            } catch (innerErr) {
              console.error("Error processing token:", innerErr);
              continue;
            }
          }
        }
        setMusicTokens(tokens);
      } catch (err) {
        console.error("Error checking token gating:", err);
      }
    })();
  }, [publicKey, connection]);

  return (
    <div className="max-w-[400px] w-full mx-auto my-8 px-4 text-white">
      <div className="bg-[#1c243e] rounded-2xl pt-6 px-6 pb-8 flex flex-col text-center">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {musicTokens.length > 0 ? "Your Music" : "Exclusive Music"}
        </h2>
        {/* Wallet Connect Button placed inside the card (same as other pages) */}
        <div className="mb-4">
          <WalletMultiButtonDynamic />
        </div>
        {!publicKey ? (
          <p className="text-center">
            Please connect your wallet to check access.
          </p>
        ) : musicTokens.length > 0 ? (
          <div className="space-y-6">
            {musicTokens.map((token, idx) => (
              <div
                key={idx}
                className="bg-[#29304e] p-4 rounded-lg shadow-md"
              >
                <div className="flex items-center mb-4">
                  {token.image && (
                    <img
                      src={token.image}
                      alt={token.artist}
                      className="w-16 h-16 mr-4 object-contain"
                    />
                  )}
                  <div className="flex-1 text-center">
                    {/* Mobile: Song on first row, Artist on second row */}
                    <div className="block md:hidden">
                      <h3 className="text-xl font-bold">{token.song}</h3>
                      <p className="text-sm text-gray-400">
                        {token.artist}
                      </p>
                    </div>
                    {/* Desktop: Combined line with song and artist */}
                    <div className="hidden md:block">
                      <h3 className="text-xl font-bold">
                        <span>{token.song}</span>
                        <span className="text-gray-400">
                          {" "}
                          - {token.artist}
                        </span>
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <audio
                    controls
                    preload="auto"
                    playsInline
                    controlsList="nodownload noplaybackrate"
                    className="w-full rounded-none"
                    style={{ borderRadius: 0 }}
                  >
                    <source src={token.audio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">
            You do not have the required tokens to access.
          </p>
        )}
      </div>
    </div>
  );
}
