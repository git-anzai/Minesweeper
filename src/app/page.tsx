import { GameBoard } from '@/components/minesweeper/GameBoard';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4 selection:bg-primary/30">
      <GameBoard />
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Left-click to reveal, Right-click to flag.</p>
      </footer>
    </main>
  );
}
