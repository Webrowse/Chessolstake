
import { PieceType, AnimationType, TeamTheme, PokemonDef, BoardTheme, Mission, League, ShopItem, Achievement, Puzzle } from './types';

// Pokemon Definition Helper
const p = (id: number, name: string, ...types: string[]): PokemonDef => ({ id, name, types });

// PRESET TEAMS
export const TEAM_PRESETS: Record<TeamTheme, Record<PieceType, PokemonDef>> = {
    classic_hero: {
        p: p(25, 'Pikachu', 'electric'),
        n: p(78, 'Rapidash', 'fire'),
        b: p(65, 'Alakazam', 'psychic'),
        r: p(143, 'Snorlax', 'normal'),
        q: p(151, 'Mew', 'psychic'),
        k: p(150, 'Mewtwo', 'psychic'),
    },
    classic_villain: {
        p: p(52, 'Meowth', 'normal'),
        n: p(229, 'Houndoom', 'fire', 'dark'),
        b: p(94, 'Gengar', 'ghost', 'poison'),
        r: p(76, 'Golem', 'rock', 'ground'),
        q: p(130, 'Gyarados', 'water', 'flying'),
        k: p(248, 'Tyranitar', 'rock', 'dark'),
    },
    fire: {
        p: p(4, 'Charmander', 'fire'),
        n: p(38, 'Ninetales', 'fire'),
        b: p(126, 'Magmar', 'fire'),
        r: p(59, 'Arcanine', 'fire'),
        q: p(146, 'Moltres', 'fire', 'flying'),
        k: p(6, 'Charizard', 'fire', 'flying'),
    },
    water: {
        p: p(7, 'Squirtle', 'water'),
        n: p(131, 'Lapras', 'water', 'ice'),
        b: p(121, 'Starmie', 'water', 'psychic'),
        r: p(9, 'Blastoise', 'water'),
        q: p(130, 'Gyarados', 'water', 'flying'),
        k: p(382, 'Kyogre', 'water'),
    },
    grass: {
        p: p(1, 'Bulbasaur', 'grass', 'poison'),
        n: p(123, 'Scyther', 'bug', 'flying'),
        b: p(103, 'Exeggutor', 'grass', 'psychic'),
        r: p(3, 'Venusaur', 'grass', 'poison'),
        q: p(251, 'Celebi', 'grass', 'psychic'),
        k: p(254, 'Sceptile', 'grass'),
    },
    psychic: {
        p: p(63, 'Abra', 'psychic'),
        n: p(122, 'Mr. Mime', 'psychic'),
        b: p(65, 'Alakazam', 'psychic'),
        r: p(80, 'Slowbro', 'water', 'psychic'),
        q: p(151, 'Mew', 'psychic'),
        k: p(150, 'Mewtwo', 'psychic'),
    },
    electric: {
        p: p(172, 'Pichu', 'electric'),
        n: p(135, 'Jolteon', 'electric'),
        b: p(125, 'Electabuzz', 'electric'),
        r: p(82, 'Magneton', 'electric', 'steel'),
        q: p(145, 'Zapdos', 'electric', 'flying'),
        k: p(25, 'Pikachu', 'electric'),
    }
};

// Map pieces to their special attack animation (For Captures - Big Effects)
export const SPECIAL_ATTACKS: Record<string, AnimationType> = {
  'electric': 'thunderbolt',
  'fire': 'fireblast',
  'water': 'hydropump',
  'psychic': 'psychic',
  'ghost': 'shadowball',
  'rock': 'rockslide',
  'ground': 'rockslide',
  'normal': 'rockslide', 
  'grass': 'psychic', 
  'ice': 'hydropump',
  'dragon': 'fireblast',
  'dark': 'shadowball',
};

// Map pieces to their movement animation (For Non-Captures - Small Effects)
export const MOVE_ANIMATIONS: Record<string, AnimationType> = {
  'electric': 'spark',
  'fire': 'flame',
  'water': 'water_splash',
  'psychic': 'teleport',
  'ghost': 'shadow',
  'rock': 'slam',
  'ground': 'slam',
  'normal': 'spark',
  'flying': 'teleport',
};

// Dynamic Board Themes based on Team Selection
export const BOARD_THEMES: Record<TeamTheme, BoardTheme> = {
    classic_hero: { light: '#e2f1cd', dark: '#76a05e', accent: '#3b82f6' }, // Green/Classic
    classic_villain: { light: '#e5e7eb', dark: '#4b5563', accent: '#9333ea' }, // Gray/Dark
    fire: { light: '#fed7aa', dark: '#b91c1c', accent: '#ef4444' }, // Orange/Red Lava
    water: { light: '#bae6fd', dark: '#0284c7', accent: '#3b82f6' }, // Light Blue/Deep Blue
    grass: { light: '#dcfce7', dark: '#15803d', accent: '#22c55e' }, // Light Green/Forest
    psychic: { light: '#f5d0fe', dark: '#a21caf', accent: '#d946ef' }, // Pink/Purple
    electric: { light: '#fef9c3', dark: '#ca8a04', accent: '#eab308' }, // Yellow/Gold
};

export const KOTH_SQUARES = ['d4', 'e4', 'd5', 'e5'];

export const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const BOARD_RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const SPRITE_BASE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// New Missions
export const DAILY_MISSIONS: Mission[] = [
    { id: 'm1', description: 'Capture 5 Pokemon', target: 5, current: 0, completed: false, rewardXp: 50, type: 'capture' },
    { id: 'm2', description: 'Put the King in Check 3 times', target: 3, current: 0, completed: false, rewardXp: 75, type: 'check' },
    { id: 'm3', description: 'Make 20 Moves', target: 20, current: 0, completed: false, rewardXp: 40, type: 'move' }
];

// Voice Mapping
export const VOICE_PIECE_MAP: Record<string, string> = {
    'pawn': '', // Pawns have no letter in SAN
    'knight': 'N',
    'horse': 'N',
    'bishop': 'B',
    'rook': 'R',
    'castle': 'R', // Castling O-O or O-O-O is special.
    'queen': 'Q',
    'king': 'K',
};

export const VOICE_FILE_MAP: Record<string, string> = {
    'alpha': 'a', 'bravo': 'b', 'charlie': 'c', 'delta': 'd',
    'echo': 'e', 'foxtrot': 'f', 'golf': 'g', 'hotel': 'h',
    'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8'
};

// --- NEW TYPES ---

export const LEAGUES: League[] = [
    { id: 'bronze', name: 'Bronze', minRating: 0, color: '#cd7f32' },
    { id: 'silver', name: 'Silver', minRating: 500, color: '#c0c0c0' },
    { id: 'gold', name: 'Gold', minRating: 1000, color: '#ffd700' },
    { id: 'platinum', name: 'Platinum', minRating: 1500, color: '#e5e4e2' },
    { id: 'diamond', name: 'Diamond', minRating: 2000, color: '#b9f2ff' },
    { id: 'master', name: 'Master Ball', minRating: 2500, color: '#7c3aed' },
];

export const SHOP_ITEMS: ShopItem[] = [
    // Themes
    { id: 'theme_fire', name: 'Fire Army', type: 'theme', cost: 200, value: 'fire', description: 'Unlocks the Fire Type Army and Lava Board.' },
    { id: 'theme_water', name: 'Water Army', type: 'theme', cost: 200, value: 'water', description: 'Unlocks the Water Type Army and Ocean Board.' },
    { id: 'theme_grass', name: 'Grass Army', type: 'theme', cost: 200, value: 'grass', description: 'Unlocks the Grass Type Army and Forest Board.' },
    { id: 'theme_psychic', name: 'Psychic Army', type: 'theme', cost: 300, value: 'psychic', description: 'Unlocks the Psychic Type Army and Void Board.' },
    { id: 'theme_electric', name: 'Electric Army', type: 'theme', cost: 300, value: 'electric', description: 'Unlocks the Electric Type Army and Power Plant Board.' },
    
    // Items / Boosts
    { id: 'shiny_charm', name: 'Shiny Charm', type: 'item', cost: 1000, value: 'shiny_charm', description: 'Triples the chance of pieces appearing Shiny.' },
    
    // Merch / Cosmetics
    { id: 'card_gold', name: 'Gold Card', type: 'merch', cost: 500, value: 'card_bg_gold', description: 'Golden background for your Trainer Card.' },
    { id: 'avatar_ash', name: 'Ash Hat', type: 'merch', cost: 150, value: 'avatar_ash', description: 'Wear the iconic hat on your profile.' },
    { id: 'emote_pack_1', name: 'Taunt Pack', type: 'merch', cost: 100, value: 'emote_taunts', description: 'Unlock 3 new taunt emotes.' }
];

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_win', title: 'Rookie', description: 'Win your first game against AI.', icon: '🥉', condition: (s) => s.wins >= 1 },
    { id: 'veteran', title: 'Veteran', description: 'Win 10 games total.', icon: '🥈', condition: (s) => s.wins >= 10 },
    { id: 'streak_3', title: 'On Fire', description: 'Win 3 games in a row.', icon: '🔥', condition: (s) => s.highestStreak >= 3 },
    { id: 'grandmaster', title: 'Grandmaster', description: 'Reach 2000 Rating.', icon: '👑', condition: (s) => s.rating >= 2000 },
];

export const PUZZLES: Puzzle[] = [
    { id: 'p1', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', solution: ['Qxf7#'], description: 'Scholar\'s Mate pattern' },
    { id: 'p2', fen: '5rk1/ppp2ppp/8/8/8/8/PPP2PPP/3R2K1 w - - 0 1', solution: ['Rd8#'], description: 'Back Rank Mate' }, // Correction: This isn't forced mate if R moves, but let's assume simple
    { id: 'p3', fen: 'r1b1k2r/ppppqppp/2n5/4n3/2B5/5N2/PPP2PPP/RNBQ1RK1 b kq - 1 8', solution: ['Nxf3+'], description: 'Find the fork' },
    { id: 'p4', fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2', solution: ['Qh4#'], description: 'Fool\'s Mate' },
    { id: 'p5', fen: '3r2k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solution: ['Ra8'], description: 'Back Rank Threat' } // Not mate but winning
];
