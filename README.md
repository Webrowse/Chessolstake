# PokeChess

A peer-to-peer chess game with Pokemon-themed pieces and Solana staking.

## Features

- **Pokemon Chess Pieces**: Each chess piece is represented by a Pokemon with elemental attack animations on captures
- **P2P Multiplayer**: Real-time gameplay using WebRTC (PeerJS) - no central game server needed
- **Solana Staking**: Players can wager SOL on matches with escrow-based payouts
- **Local PvP**: Pass-and-play mode for playing on a single device without wallet

## How It Works

### Game Modes

1. **Play PvP (Local)**: No wallet required. Two players take turns on the same screen.

2. **Stake Match (Online)**:
   - Connect your Solana wallet (Phantom, Solflare, etc.)
   - **Host**: Create a room with a stake amount, get a room code to share
   - **Join**: Enter a room code, match the host's stake
   - Both stakes go into an on-chain escrow

### Game Rules

- 1 minute per turn
- 3 timeouts (strikes) = automatic loss
- Disconnect = opponent wins
- Standard chess rules (checkmate, stalemate, castling, en passant, promotion)

### Winning & Payouts

- Winner clicks "Claim Reward" after checkmate
- Smart contract releases funds: 97.5% to winner, 2.5% platform fee
- Single transaction - only the winner signs

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Chess Logic**: chess.js
- **P2P Networking**: PeerJS (WebRTC)
- **Blockchain**: Solana, Anchor Framework
- **Wallet**: Solana Wallet Adapter

## Project Structure

```
pokechess/
├── packages/
│   ├── web/           # React frontend
│   │   ├── components/
│   │   ├── services/  # Staking service
│   │   └── contexts/  # Wallet context
│   └── anchor/        # Solana program
│       └── programs/pokechess-staking/
```

## Development

### Prerequisites

- Node.js 18+
- Solana CLI & Anchor (for smart contract development)
- A Solana wallet with devnet SOL

### Frontend

```bash
# Install dependencies
cd packages/web
npm install

# Run dev server
npm run dev
```

### Anchor Program

```bash
# Build
cd packages/anchor
anchor build

# Deploy to devnet
anchor deploy

# Program ID: B5jR7EVRTkbJBc7zmRXmMAW1EwYpS9MfniGtRGxPoZ3u
```

## Smart Contract

The staking program handles:

- `create_match`: Host creates match, deposits stake into escrow PDA
- `join_match`: Guest matches stake, game begins
- `claim_winner_reward`: Winner claims pot (minus 2.5% fee), closes match account
- `cancel_match`: Host can cancel before guest joins, gets refund

All funds are held in a PDA escrow - no one can withdraw without meeting the contract conditions.

## Network

- **Blockchain**: Solana Devnet
- **P2P Signaling**: PeerJS public cloud (0.peerjs.com)

## License

MIT
