# Mine Navigator

[中文](./README.zh.md) | English

This is an interactive Minesweeper game built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit for AI-powered hints.

## Features

*   **Classic Minesweeper Gameplay**: Uncover cells, avoid mines, and use numbers to deduce mine locations.
*   **Interactive Board**:
    *   **Left-click**: Reveal a cell.
    *   **Right-click**: Flag or unflag a cell suspected to contain a mine.
    *   **Coordinate Input**: Manually enter row and column numbers to reveal a specific cell.
*   **Difficulty Selection**: Choose your challenge!
    *   **Easy**: 8x8 grid with 10 mines.
    *   **Medium**: 10x10 grid with 12 mines.
    *   **Hard**: 16x16 grid with 40 mines.
    (Difficulty changes take effect on the next new game if changed mid-game).
*   **AI-Powered Hints**: Stuck? Get a suggestion from an AI!
    *   The AI analyzes the current board state.
    *   Suggests whether to **reveal** a safe cell or **flag** a guaranteed mine.
    *   Provides a brief **reasoning** for its suggestion.
    *   Indicates its **confidence** level.
    *   The suggested cell is highlighted on the board.
*   **Game Timer**: Tracks your time to clear the board.
*   **Responsive Design**: Playable on different screen sizes.
*   **Modern UI**: Clean and intuitive interface using ShadCN UI components.

## Getting Started

The main game interface is located at `src/app/page.tsx`, which renders the `GameBoard` component from `src/components/minesweeper/GameBoard.tsx`.

Core game logic (board creation, cell revealing) can be found in `src/lib/minesweeper.ts`.

The AI hint functionality is implemented as a Genkit flow in `src/ai/flows/minesweeper-hint-flow.ts`.

## How to Play

1.  **Select Difficulty**: Choose your preferred difficulty level from the dropdown menu.
2.  **Start Playing**:
    *   **Left-click** a cell to reveal it.
        *   If it's a mine, the game is over.
        *   If it's a number, it tells you how many mines are in the 8 adjacent cells.
        *   If it's blank, all adjacent non-mine cells will be revealed recursively.
    *   **Right-click** a cell to place a flag if you suspect a mine. Right-click again to remove the flag.
    *   Alternatively, enter the **row and column number** (0-indexed) into the input fields and click "Reveal".
3.  **Use AI Hint (Optional)**: If you're unsure, click the "Get AI Hint" button (lightbulb icon). The AI will suggest a move and highlight the cell.
4.  **Win**: Successfully reveal all cells that do not contain mines.
5.  **Lose**: Reveal a cell that contains a mine.
6.  **Restart**: Click the smiley/status icon to start a new game at any time.

## Tech Stack

*   **Framework**: Next.js (with App Router)
*   **UI Library**: React
*   **Components**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **AI**: Genkit (with Google AI models)
*   **Language**: TypeScript


## Development

### Prerequisites

*   Node.js (version 18 or later recommended)
*   npm or yarn

### Running Locally

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd mine-navigator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project (if it doesn't exist) and add any necessary environment variables, such as API keys for Google AI if you are extending the AI functionality (https://aistudio.google.com/app/apikey).
    Example `.env.local`:
    ```
    GOOGLE_API_KEY=your_google_api_key_here
    ```

4.  **Run the Next.js development server:**
    This will start the main application.
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

5.  **Run the Genkit development server (for AI development):**
    If you are working on or testing the Genkit AI flows, you'll need to run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    # or for watching changes
    # npm run genkit:watch
    ```
    The Genkit Developer UI will be available at `http://localhost:4000`. The Next.js app will communicate with the Genkit flows through this server during local development.

### Project Structure

*   `src/app/`: Next.js App Router pages and layouts.
*   `src/components/`: React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/minesweeper/`: Game-specific components like `GameBoard.tsx` and `Cell.tsx`.
*   `src/lib/`: Utility functions and core logic.
    *   `src/lib/minesweeper.ts`: Core game logic.
*   `src/ai/`: Genkit AI integration files.
    *   `src/ai/flows/`: Genkit flow definitions (e.g., `minesweeper-hint-flow.ts`).
    *   `src/ai/genkit.ts`: Genkit plugin configuration.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `globals.css`: Global styles and CSS variables for theming.

### Deployment (Next.js)
Since this is a standard Next.js application, you can deploy it to platforms that support Next.js, such as Vercel.

