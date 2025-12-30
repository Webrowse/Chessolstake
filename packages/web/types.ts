export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export type GameMode = 'p2p' | 'online' | 'staked_online';
export type BoardOrientation = 'white' | 'black';
export type GameVariant = 'standard' | 'koth';
export type TeamTheme = 'classic_hero' | 'classic_villain' | 'fire' | 'water' | 'grass' | 'psychic' | 'electric';

export interface PokemonDef {
    id: number;
    name: string;
    types: string[];
}

export type CombatAnimationType = 'thunderbolt' | 'fireblast' | 'hydropump' | 'shadowball' | 'rockslide' | 'psychic';
export type MoveAnimationType = 'spark' | 'flame' | 'teleport' | 'slam' | 'shadow' | 'water_splash' | 'default';
export type AnimationType = CombatAnimationType | MoveAnimationType;

export interface BoardEffect {
    type: AnimationType | 'crit';
    targetSquare: string;
    variant: '1x1' | '3x3';
}

export interface BoardTheme {
    light: string;
    dark: string;
    accent: string;
}

export interface Emote {
    id: string;
    emoji: string;
    square: string;
}

export interface OnlineMessage {
    type: 'move' | 'chat' | 'emote' | 'config' | 'restart' | 'resign';
    payload: any;
}

export type GameResult = 'win' | 'loss' | 'draw' | null;
