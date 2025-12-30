
import { PieceType, AnimationType, TeamTheme, PokemonDef, BoardTheme } from './types';

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
