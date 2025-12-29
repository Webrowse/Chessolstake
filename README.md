<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PokeChess ♟️⚡

PokeChess is a modern, interactive web application that combines the classic strategy of Chess with the beloved world of Pokémon. Built with React, TypeScript, and Vite, it features real-time multiplayer, AI opponents powered by Google Gemini, and a rich progression system.

## 🚀 Features

*   **Game Modes:**
    *   **Vs AI (Rival):** Challenge an AI opponent powered by Google Gemini with adjustable difficulty levels.
    *   **Local PvP:** Play against a friend on the same device (Pass & Play).
    *   **Online Multiplayer:** Play against friends remotely using PeerJS for peer-to-peer connection.
*   **Pokemon Integration:**
    *   Chess pieces are represented by Pokemon sprites.
    *   Different themes (Classic Hero, Villain, Fire, Water, Grass, etc.).
    *   Dynamic combat animations (Thunderbolt, Fireblast, etc.) on captures.
    *   Sound effects for moves, checks, and special attacks.
*   **Progression System:**
    *   **XP & Leveling:** Earn XP for winning games, capturing pieces, and completing missions.
    *   **Economy:** Earn coins to buy new themes and items in the PokeMart.
    *   **Missions:** Daily missions to challenge your skills.
    *   **Achievements:** Unlockable achievements for milestones.
    *   **Leagues:** Climb the ranks from Bronze to Master league based on your rating.
*   **Trainer Tower:** A puzzle rush mode to test your tactical skills.
*   **Voice Control:** Move pieces using voice commands (e.g., "Pawn to E4").
*   **Pokedex:** View details about the Pokemon pieces.

## 🛠️ Technology Stack

*   **Frontend Framework:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Chess Logic:** [chess.js](https://github.com/jhlywa/chess.js)
*   **AI Service:** [Google Gemini AI](https://deepmind.google/technologies/gemini/) (via `@google/genai`)
    *   *Coming Soon:* Support for OpenRouter, Cerebras AI, and OpenAI.
*   **P2P Networking:** [PeerJS](https://peerjs.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
*   **Effects:** [Canvas Confetti](https://github.com/catdad/canvas-confetti)

## 🏗️ Architecture

The project follows a component-based architecture using React functional components and hooks.

### Key Components

*   **`App.tsx`**: The main entry point and state manager. Handles game mode selection, global state (XP, coins, theme), and routing between views (Hero, Landing, Game).
*   **`components/ChessBoard.tsx`**: Renders the chess board and handles square interactions.
*   **`components/GameInfo.tsx`**: Displays game status, timer, captured pieces, chat, and controls.
*   **`components/PokemonPiece.tsx`**: Renders individual Pokemon sprites on the board.
*   **`components/OnlineModal.tsx`**: Manages the UI for hosting and joining online games.
*   **`services/geminiService.ts`**: Handles communication with the Google Gemini API for AI moves and commentary.
*   **`utils/peerService.ts`**: Wrapper around PeerJS for managing WebRTC connections.
*   **`utils/sound.ts`**: Manages audio playback for game events.

### State Management

State is primarily managed in `App.tsx` using `useState` and `useReducer` patterns, passed down to child components via props. Key state slices include:
*   `game`: The current chess.js instance.
*   `board`: The 2D array representing the board state.
*   `gameMode`: Current mode (AI, P2P, Online).
*   `trainerStats`: User progression data (wins, losses, rating).

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/pokechess.git
    cd pokechess
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Build for production:**
    ```bash
    npm run build
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
