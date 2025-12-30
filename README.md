# PokeChess

A chess game with Pokemon pieces and Solana staking.

## Project Structure

```
pokechess/
├── packages/
│   ├── web/          # React frontend
│   └── anchor/       # Solana program
```

## Development

### Frontend

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Anchor Program

```bash
# Build the program
npm run anchor:build

# Deploy to devnet
npm run anchor:deploy

# Run tests
npm run anchor:test
```

## MVP Features

- **Play PvP**: Local pass-and-play, no wallet required
- **Stake Match**: Connect wallet to host or join staked matches
- 1 minute per turn, 3 strikes = auto-lose
- Winner claims pot minus 2.5% platform fee
