# Mine Navigator - Application Blueprint

## 1. Overview

Mine Navigator is an interactive Minesweeper game built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit for AI-powered hints. The game allows users to play the classic Minesweeper game with modern UI enhancements and AI assistance.

## 2. Core Features

### 2.1. Gameplay Mechanics
-   **Minefield Generation**:
    -   Dynamically generates a grid-based minefield.
    -   The number of mines and grid dimensions are determined by the selected difficulty level.
-   **Minefield Rendering**:
    -   Visually renders the game board with cells in various states (hidden, revealed, flagged).
    -   Updates the cell states in real-time after each player move.
-   **Cell Interaction**:
    -   **Left-click**: Reveals a cell.
        -   If it's a mine, the game ends (loss).
        -   If it's a number, it indicates the count of adjacent mines.
        -   If it's empty (0 adjacent mines), it triggers a recursive reveal of adjacent empty cells and their numbered neighbors.
    -   **Right-click**: Flags or unflags a cell suspected to contain a mine.
    -   **Coordinate Input**: Allows players to input row and column numbers to reveal a specific cell.
-   **Game State Management**:
    -   Tracks the current game status (`playing`, `won`, `lost`).
    -   Analyzes game state after each move:
        -   Triggers game over (loss) if a mine is revealed.
        -   Triggers game victory (win) if all non-mine cells are revealed.
    -   Displays game-over/victory messages and statistics (e.g., time taken).
-   **Restart Game**:
    -   Provides an option (e.g., a smiley face button) to reset the game and start a new one with the current difficulty settings.
-   **Game Timer**:
    -   Tracks the elapsed time from the first valid player move until the game ends.

### 2.2. Difficulty Selection
-   **User Interface**: Provides a dropdown menu for players to select the game's difficulty.
-   **Levels**:
    -   **Easy**: 8x8 grid with 10 mines.
    -   **Medium**: 10x10 grid with 12 mines.
    -   **Hard**: 16x16 grid with 40 mines.
-   **Application**: Difficulty settings take effect when a new game is started.

### 2.3. AI-Powered Hints
-   **Genkit Integration**: Utilizes a Genkit flow to connect to an AI model (e.g., Gemini).
-   **Hint Request**: Players can request a hint via a dedicated button.
-   **AI Analysis**:
    -   The current board state (hidden cells, revealed numbers, flags) is sent to the AI.
    -   The AI analyzes the board to suggest an optimal move.
-   **Hint Output**:
    -   **Action Type**: Suggests whether to `reveal` a cell or `flag` a cell.
    -   **Coordinates**: Provides the row and column of the suggested cell.
    -   **Reasoning**: Offers a brief explanation for the suggestion.
    -   **Confidence**: Indicates if the AI is highly confident (guaranteed move) or making a probabilistic guess.
-   **Visual Feedback**:
    -   The suggested cell is highlighted on the game board.
    -   A toast notification displays the AI's reasoning.

## 3. User Interface & User Experience (UI/UX)

-   **Style**:
    -   Primary color: Calm light blue (`#89BCEB`) for interactive elements.
    -   Background color: Very light gray (`#F0F4F7`).
    -   Accent colors: Soft green (`#A0D995`) for safe cells, orange (`#E6A85A`) for mine proximity numbers.
    -   Font: Clear and monospace for cell numbers.
-   **Components**: Utilizes ShadCN UI components for a modern and consistent look and feel (buttons, dialogs, inputs, select, toast).
-   **Responsiveness**: Designed to be playable on various screen sizes.
-   **Animations**: Subtle animations for cell reveals to enhance user experience.
-   **Feedback**: Clear visual and textual feedback for player actions, game state changes, and AI hints.

## 4. Technical Stack

-   **Framework**: Next.js (App Router)
-   **UI Library**: React
-   **Component Library**: ShadCN UI
-   **Styling**: Tailwind CSS
-   **AI Integration**: Genkit (with Google AI models)
-   **Language**: TypeScript

## 5. Future Considerations (Potential Enhancements)

-   User accounts and score tracking.
-   More advanced AI solver modes (e.g., auto-play a few steps).
-   Customizable themes or board appearances.
-   Sound effects.
