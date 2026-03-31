# Bubble Pop Master

## Current State
New project - no existing application files.

## Requested Changes (Diff)

### Add
- Full bubble shooter 2D game implemented on HTML5 Canvas
- Splash screen with animated title and transition to main menu
- Main menu with Play, Settings, Sound toggle, floating bubbles
- Gameplay: bubble grid at top, shooter at bottom, aim line, shoot mechanics
- Match-3+ same-color bubble popping with particle effects
- Special bubbles: Bomb, Rainbow, Ice (2-hit), Fire (burns line)
- Level system with increasing difficulty and different patterns
- Scoring: points per pop, combo multiplier, high score tracking
- Pause/Resume, Restart level
- Stars/coins reward system per level
- Sound effects (pop, combo, win, music) via Web Audio API synthesized tones
- Touch/drag aim + release to shoot controls
- Smooth animations: bubble fall, pop explosion, particles

### Modify
N/A - new project

### Remove
N/A - new project

## Implementation Plan
1. Backend: store high scores per anonymous session
2. Frontend: Canvas-based game with React UI overlays
   - SplashScreen component
   - MainMenu component with floating bubble canvas
   - Game component with full canvas renderer
   - GameLogic hook: bubble grid, physics, collision, matching
   - Particle system for pop effects
   - Web Audio API for synthesized sound effects
   - Level definitions (5+ levels with increasing density/patterns)
   - HUD overlay: score, level, shots remaining, pause button
   - Post-level screen: stars earned, coins, next level
