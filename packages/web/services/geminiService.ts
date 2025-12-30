
import { GoogleGenAI, Type } from "@google/genai";
import { GameDifficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getAIMove = async (
  fen: string,
  validMoves: string[],
  difficulty: GameDifficulty,
  history: string[]
): Promise<{ move: string; commentary: string }> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning random move.");
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { move: randomMove, commentary: "I don't have a brain right now (Missing API Key), so I'm guessing!" };
  }

  const modelName = difficulty === GameDifficulty.HARD ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
  
  const systemInstruction = `You are a Pokemon Trainer playing a game of Chess against a challenger. 
  CRITICAL: You are playing as the BLACK pieces. 
  The White pieces have just moved. It is now YOUR TURN (Black).
  
  Your Persona: Competitive, slightly arrogant (like Gary Oak or Silver), but respects strong moves.
  
  Input Data:
  - FEN: Current board state.
  - Valid Moves: List of all legal moves you can make.
  
  Your Task:
  1. Analyze the board based on the FEN.
  2. Select the BEST move from the provided 'Valid Moves' list.
  3. Provide a short, one-sentence commentary in character. Use Pokemon terminology (e.g., "Hyper Beam!", "It's super effective!", "I choose you!").
  
  Difficulty Strategy:
  - Easy: Play a random or weak developmental move.
  - Medium: Play standard solid chess.
  - Hard: Play the optimal engine move.
  
  Response Format: JSON object with "move" (the SAN string) and "commentary".`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Current FEN: ${fen}\nMove History: ${history.slice(-10).join(', ')}\nValid Moves: ${JSON.stringify(validMoves)}\nDifficulty: ${difficulty}\n\nChoose your move (Black).`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.STRING, description: "The SAN string of the chosen move from the valid moves list." },
            commentary: { type: Type.STRING, description: "A short in-character comment about the move." }
          },
          required: ["move", "commentary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const result = JSON.parse(text);
    
    // Safety check: ensure the returned move is actually valid
    if (!validMoves.includes(result.move)) {
      console.warn("AI returned invalid move:", result.move);
      // Fallback to random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      return { move: randomMove, commentary: "I slipped! (Fallback move)" };
    }

    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { move: randomMove, commentary: "My telepathy failed! (API Error)" };
  }
};

export const getAIChatResponse = async (
    userMessage: string,
    history: { role: 'user' | 'model', text: string }[]
): Promise<string> => {
    if (!apiKey) return "I can't hear you! (Missing API Key)";

    const modelName = 'gemini-2.5-flash';
    
    try {
        const chat = ai.chats.create({
            model: modelName,
            config: {
                systemInstruction: "You are a Rival Pokemon Trainer (like Gary Oak) playing chess. You are arrogant but respect skill. Keep responses short (under 2 sentences) and witty. Use Pokemon puns.",
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }))
        });

        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "...";
    } catch (error) {
        console.error("Chat Error:", error);
        return "The communication link is down!";
    }
};
