
import { VOICE_PIECE_MAP } from '../constants';

export const parseVoiceCommand = (transcript: string): string | null => {
    // Clean string: "Pawn to E4" -> "pawne4"
    // Remove "to", "takes", "capture", "captured", "move" and spaces
    const clean = transcript.toLowerCase()
        .replace(/to/g, '')
        .replace(/takes/g, '')
        .replace(/take/g, '')
        .replace(/capture/g, '')
        .replace(/captured/g, '')
        .replace(/moves/g, '')
        .replace(/move/g, '')
        .replace(/ /g, '')
        .trim();
    
    // Castling Handling
    if (clean.includes('castle')) {
        if (clean.includes('queen') || clean.includes('long')) return 'O-O-O';
        return 'O-O'; // Default to short castle if just "castle" or "castle king"
    }

    // Pattern 1: Coordinate (e.g. "e2e4", "e2 to e4")
    const coordMatch = clean.match(/([a-h][1-8])([a-h][1-8])/);
    if (coordMatch) {
        return clean; // Chess.js accepts "e2e4" (sometimes needing to handle internally)
    }

    // Pattern 2: Short Algebraic (e.g. "e4", "Knight f3")
    // Note: Speech API might return "night" for "knight"
    let parsed = clean;
    
    // Replace piece names with single letters if present
    // e.g. "knightf3" -> "nf3"
    // "nightf3" -> "nf3"
    parsed = parsed.replace('night', 'knight'); // Common mistake
    
    for (const [key, val] of Object.entries(VOICE_PIECE_MAP)) {
        if (parsed.startsWith(key)) {
            parsed = val + parsed.slice(key.length);
            break;
        }
    }
    
    // If it looks like "nf3" or "e4" or "axb5"
    if (parsed.match(/^([nbrqk]?[a-h][1-8]|[a-h]x[a-h][1-8])$/)) {
        return parsed;
    }
    
    // Fallback: If user said "e 4", the clean is "e4"
    if (parsed.match(/^[a-h][1-8]$/)) return parsed;

    return null;
};
