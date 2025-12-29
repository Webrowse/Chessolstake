# PokeChess - Developer Documentation

PokeChess is a sophisticated single-page React application that reimagines chess mechanics within the Pokemon universe. It features a persona-driven AI opponent powered by Google Gemini, real-time P2P multiplayer, procedural audio, and a full progression economy.

## 🛠 Technology Stack

*   **Core Framework**: React 19 (TypeScript)
*   **Build Tooling**: Vite (Implied)
*   **Styling**: Tailwind CSS
*   **Game Logic**: `chess.js` (Move validation, FEN generation)
*   **AI Engine**: `@google/genai` (Gemini 2.5 Flash & Gemini 3.0 Pro)
*   **Networking**: PeerJS (WebRTC wrapper for P2P connections)
*   **Audio**: Native Web Audio API (Custom 8-bit Synthesizer)
*   **Assets**: PokeAPI Sprites (Remote), Lucide React (Icons)

## 📂 Architecture Overview

The application follows a component-based architecture centered around a main game loop in `App.tsx`.

### Core Directory Structure

```text
/
├── components/         # React UI Components
│   ├── ChessBoard.tsx  # Main grid renderer, handles layer stacking (Board -> Pieces -> Effects)
│   ├── PokemonPiece.tsx# Individual piece renderer (Sprite, Shiny logic, Aura effects)
│   ├── GameInfo.tsx    # HUD (Timer, Move Log, Chat, Shop, Profile)
│   ├── CombatEffects.tsx # SVG-based animation overlay system
│   └── ...
├── services/
│   └── geminiService.ts# Interface for Google Gemini API (Move calculation & Persona Chat)
├── utils/
│   ├── sound.ts        # Procedural audio engine (Oscillators/GainNodes)
│   ├── peerService.ts  # Singleton class for PeerJS connection management
│   └── voiceControl.ts # Regex-based natural language parser for chess moves
├── types.ts            # Shared TypeScript interfaces (GameState, Theme, stats)
└── constants.ts        # Static configuration (Teams, Animations, Shop Items)
```

## 🧠 Key Systems

### 1. Gemini AI Integration (`services/geminiService.ts`)
The AI does not use a traditional Minimax/AlphaBeta pruning engine locally. Instead, it offloads decision-making to Google's Gemini models.
*   **Prompt Engineering**: We feed the AI the current FEN (Forsyth–Edwards Notation) and a list of valid moves.
*   **Persona Injection**: The system instruction forces the AI to act as a "Rival Trainer" (e.g., arrogant, competitive), returning JSON that includes both the `move` (SAN) and a text `commentary`.
*   **Difficulty Scaling**:
    *   *Easy/Medium*: Uses `gemini-2.5-flash` with varying prompts.
    *   *Hard*: Uses `gemini-3-pro-preview` for deeper strategic reasoning.

### 2. Procedural Audio (`utils/sound.ts`)
To maintain a lightweight footprint and retro feel, PokeChess does not load external audio files.
*   It utilizes the browser's `AudioContext`.
*   Sounds (Thunder, Fire, Psychic) are generated in real-time using `OscillatorNode` (Sawtooth, Square waves) and `GainNode` for envelopes.

### 3. P2P Multiplayer (`utils/peerService.ts`)
Online play is serverless, relying on WebRTC via PeerJS.
*   **Host**: Generates a Peer ID.
*   **Join**: Connects to the Host ID.
*   **Data Sync**: Moves, board configuration (Themes/Variants), and emotes are serialized and sent as JSON payloads.

### 4. Visual Effects Engine
*   **CombatEffects**: When a capture occurs, an animation overlay (`CombatEffects.tsx`) is mounted on top of the board grid.
*   **Shiny Logic**: In `PokemonPiece.tsx`, a `useMemo` hook determines if a piece is "Shiny" based on a probability seed. This is purely visual (CSS `hue-rotate`) but tied to the "Shiny Charm" item in the user's inventory.

## 🚀 Environment Setup

The application requires a valid Google Gemini API key to power the AI features.

1.  **API Key**: Ensure `process.env.API_KEY` is available in your build environment.
2.  **Permissions**: Microphone access is requested via the browser for Voice Control features.

## 🎨 Customization

*   **Teams**: defined in `constants.ts`. You can add new Pokemon mappings to `TEAM_PRESETS`.
*   **Themes**: Board colors are defined in `BOARD_THEMES` and mapped to team types.
