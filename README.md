# Final MVP Spec

## Landing Page

- Title + 2-5 line explainer
- "**Play PvP**" button (local pass-and-play, no wallet)
- "**Connect Wallet**" button → becomes "**Stake Match**" when connected
- Disconnect button (top right when connected)

## Staked Match Flow

**Host**:
1. Click "Stake Match" → "Host" or "Join"
2. Host: Enter room code (custom or generate random) + stake amount
3. Sign transaction (SOL goes to escrow)
4. Wait screen with room code to share

**Joiner**:
1. Click "Stake Match" → "Join"
2. Enter room code
3. See host's stake amount → Accept or Decline
4. If accept → Sign transaction (match stake)
5. Game starts

## Game Rules

- 1 minute per turn
- 3 strikes (timeouts) = auto-lose
- Disconnect = auto-lose (opponent wins)
- Checkmate/Stalemate handled by chess.js

### Winner Claim
- Frontend determines winner
- Winner clicks "Claim Reward"
- Anchor contract transfers pot minus 2.5% fee

### P2P Connection
- PeerJS