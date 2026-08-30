import { GAME_CONFIG } from '../config';
import type { GameState } from '../types';

export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(GAME_CONFIG.saveKey);
    return value ? JSON.parse(value) as GameState : null;
  } catch { return null; }
}

export function saveGame(state: GameState) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(state)); } catch { /* storage can be unavailable */ }
}

export function clearGame() {
  if (typeof window !== 'undefined') localStorage.removeItem(GAME_CONFIG.saveKey);
}
