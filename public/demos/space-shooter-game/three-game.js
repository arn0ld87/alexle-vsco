// Minimaler Wrapper für das modulare Spiel
import { startGame } from './game-core.js';
window.startSpaceShooterGame = startGame;
// Fallback falls das Core-Script (game-core.js) applyGameSettings noch nicht gesetzt hat
window.applyGameSettings = window.applyGameSettings || function(){};
