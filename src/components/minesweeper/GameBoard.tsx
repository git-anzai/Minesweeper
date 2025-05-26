"use client";

import { useState, useEffect, useCallback } from 'react';
import type { CellState } from '@/lib/minesweeper';
import { createBoard, revealCell as revealCellLogic } from '@/lib/minesweeper';
import { CellComponent } from './Cell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Smile, Frown, PartyPopper, Bomb, Lightbulb, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getMinesweeperHint, type MinesweeperHintInput, type MinesweeperHintOutput } from '@/ai/flows/minesweeper-hint-flow';


// 定义难度选项接口
interface DifficultyOption {
  key: string;      // 难度级别的唯一标识符
  label: string;    // 难度级别的显示名称
  rows: number;     // 游戏板行数
  cols: number;     // 游戏板列数
  mines: number;    // 地雷数量
}

// 预定义的难度级别配置
const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { key: 'easy', label: 'Easy (8x8, 10 Mines)', rows: 8, cols: 8, mines: 10 },
  { key: 'medium', label: 'Medium (10x10, 12 Mines)', rows: 10, cols: 10, mines: 12 },
  { key: 'hard', label: 'Hard (16x16, 40 Mines)', rows: 16, cols: 16, mines: 40 },
];

// 游戏状态类型：进行中、胜利、失败
type GameStatus = 'playing' | 'won' | 'lost';

export function GameBoard() {
  // 游戏难度和设置状态
  const [currentDifficultyKey, setCurrentDifficultyKey] = useState<string>('medium');
  const [gameSettings, setGameSettings] = useState<DifficultyOption>(
    DIFFICULTY_LEVELS.find(d => d.key === currentDifficultyKey)!
  );

  // 游戏核心状态
  const [board, setBoard] = useState<CellState[][]>(() => createBoard(gameSettings.rows, gameSettings.cols, gameSettings.mines));
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [revealedCount, setRevealedCount] = useState(0);  // 已揭示的格子数量
  const [flagsUsed, setFlagsUsed] = useState(0);          // 已使用的旗子数量
  const [showDialog, setShowDialog] = useState(false);    // 控制游戏结束对话框显示

  // 游戏时间相关状态
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 坐标输入状态
  const [inputRow, setInputRow] = useState('');
  const [inputCol, setInputCol] = useState('');
  const { toast } = useToast();

  // AI提示相关状态
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintedCell, setHintedCell] = useState<{ row: number; col: number; actionType: 'reveal' | 'flag' } | null>(null);

  // 初始化游戏的回调函数
  const initializeGame = useCallback(() => {
    const currentSettings = DIFFICULTY_LEVELS.find(d => d.key === currentDifficultyKey)!;
    setGameSettings(currentSettings);
    setBoard(createBoard(currentSettings.rows, currentSettings.cols, currentSettings.mines));
    setGameStatus('playing');
    setRevealedCount(0);
    setFlagsUsed(0);
    setShowDialog(false);
    setStartTime(null);
    setElapsedTime(0);
    setInputRow('');
    setInputCol('');
    setHintedCell(null);
  }, [currentDifficultyKey]);
  
  // 监听难度变化，重新初始化游戏
  useEffect(initializeGame, [initializeGame]);

  // 计时器效果
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (gameStatus === 'playing' && startTime !== null) {
      timerId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (gameStatus !== 'playing') {
      clearInterval(timerId);
    }
    return () => clearInterval(timerId);
  }, [gameStatus, startTime]);

  // 处理难度变更
  const handleDifficultyChange = (newDifficultyKey: string) => {
    setCurrentDifficultyKey(newDifficultyKey);
    // initializeGame会通过useEffect自动触发
  };

  // 处理格子点击事件
  const handleCellClick = (row: number, col: number) => {
    // 检查游戏状态和格子状态
    if (gameStatus !== 'playing' || board[row][col].isFlagged || board[row][col].isRevealed) {
      return;
    }
    setHintedCell(null); // 清除AI提示

    // 首次点击时启动计时器
    if (startTime === null) {
      setStartTime(Date.now());
    }

    // 执行揭示逻辑
    const { newBoard, revealedCountChange, exploded } = revealCellLogic(board, row, col);
    setBoard(newBoard);
    
    // 处理踩雷情况
    if (exploded) {
      setGameStatus('lost');
      setShowDialog(true);
      return;
    }

    // 更新已揭示的格子数量并检查胜利条件
    const newTotalRevealed = revealedCount + revealedCountChange;
    setRevealedCount(newTotalRevealed);

    if (newTotalRevealed === gameSettings.rows * gameSettings.cols - gameSettings.mines) {
      setGameStatus('won');
      setShowDialog(true);
      // 胜利时自动标记所有未标记的地雷
      const finalBoard = newBoard.map(r => r.map(cell => {
        if (cell.isMine && !cell.isFlagged) {
          return { ...cell, isFlagged: true };
        }
        return cell;
      }));
      setBoard(finalBoard);
      setFlagsUsed(gameSettings.mines);
    }
  };

  // 处理右键点击（插旗）事件
  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>, row: number, col: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || board[row][col].isRevealed) {
      return;
    }
    setHintedCell(null); // 清除AI提示
    
    // 首次操作时启动计时器
    if (startTime === null) {
      setStartTime(Date.now());
    }

    // 更新旗子状态
    const newBoard = board.map(r => r.map(cell => ({ ...cell })));
    const cell = newBoard[row][col];
    if (cell.isFlagged) {
      cell.isFlagged = false;
      setFlagsUsed(prev => prev - 1);
    } else {
      if (flagsUsed < gameSettings.mines) {
        cell.isFlagged = true;
        setFlagsUsed(prev => prev + 1);
      }
    }
    setBoard(newBoard);
  };

  // 处理通过坐标输入揭示格子
  const handleRevealByInputClick = () => {
    const r = parseInt(inputRow, 10);
    const c = parseInt(inputCol, 10);

    // 验证输入坐标的有效性
    if (isNaN(r) || isNaN(c) || r < 0 || r >= gameSettings.rows || c < 0 || c >= gameSettings.cols) {
      toast({
        title: "Invalid Coordinates",
        description: `Please enter row numbers between 0-${gameSettings.rows - 1} and column numbers between 0-${gameSettings.cols - 1}.`,
        variant: "destructive",
      });
      setInputRow('');
      setInputCol('');
      return;
    }

    // 检查目标格子状态
    if (board[r][c].isRevealed) {
       toast({
        title: "Cell Already Revealed",
        description: `Cell (${r}, ${c}) has already been revealed.`,
      });
      setInputRow('');
      setInputCol('');
      return;
    }
    if (board[r][c].isFlagged) {
       toast({
        title: "Cell Flagged",
        description: `Cell (${r}, ${c}) is flagged. Unflag it first to reveal.`,
      });
      setInputRow('');
      setInputCol('');
      return;
    }

    handleCellClick(r, c);
    setInputRow('');
    setInputCol('');
  };

  // 获取游戏状态图标
  const getStatusIcon = () => {
    if (gameStatus === 'won') return <PartyPopper className="w-8 h-8 text-green-500" />;
    if (gameStatus === 'lost') return <Frown className="w-8 h-8 text-red-500" />;
    return <Smile className="w-8 h-8 text-yellow-500" />;
  };
  
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 将游戏板转换为AI可读的字符串格式
  const boardToStringForAI = (currentBoard: CellState[][]): string => {
    return currentBoard
      .map(row =>
        row
          .map(cell => {
            if (cell.isFlagged) return 'F';           // 已标记旗子
            if (!cell.isRevealed) return '?';        // 未揭示
            if (cell.isMine && cell.isRevealed) return 'X';  // 已揭示的地雷
            if (cell.adjacentMines === 0) return 'E';       // 空格子
            return cell.adjacentMines.toString();           // 数字格子
          })
          .join('')
      )
      .join('\n');
  };

  // 获取AI提示
  const handleGetAiHint = async () => {
    if (gameStatus !== 'playing') {
      toast({ title: "Game Over", description: "Cannot get a hint when the game is not active.", variant: "destructive" });
      return;
    }
    setIsHintLoading(true);
    setHintedCell(null);

    try {
      // 准备AI输入数据
      const aiInput: MinesweeperHintInput = {
        boardString: boardToStringForAI(board),
        rows: gameSettings.rows,
        cols: gameSettings.cols,
        totalMines: gameSettings.mines,
      };
      const hint = await getMinesweeperHint(aiInput);
      
      // 显示AI提示
      setHintedCell({ row: hint.row, col: hint.col, actionType: hint.actionType });
      toast({
        title: `AI Suggestion: ${hint.actionType.toUpperCase()} (${hint.row}, ${hint.col})`,
        description: `${hint.isConfident ? "Confident: " : "Guess: "}${hint.reasoning}`,
        duration: 8000, // 延长显示时间以便阅读
      });

      // 5秒后自动清除提示高亮
      setTimeout(() => setHintedCell(null), 5000);

    } catch (error) {
      console.error("Error getting AI hint:", error);
      toast({
        title: "AI Hint Error",
        description: "Could not retrieve a hint at this time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHintLoading(false);
    }
  };


  return (
    // 游戏主容器
    <div className="flex flex-col items-center p-4 md:p-8 rounded-lg shadow-2xl bg-card max-w-fit mx-auto">
      {/* 游戏头部区域 */}
      <header className="mb-6 text-center w-full">
        <h1 className="text-4xl font-bold text-primary mb-2">Mine Navigator</h1>
        
        {/* 难度选择和AI提示按钮 */}
        <div className="my-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="difficulty-select" className="text-sm font-medium">Difficulty:</Label>
            <Select value={currentDifficultyKey} onValueChange={handleDifficultyChange} disabled={gameStatus === 'playing' && startTime !== null}>
              <SelectTrigger id="difficulty-select" className="w-[200px] text-sm">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(level => (
                  <SelectItem key={level.key} value={level.key} className="text-sm">
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGetAiHint} disabled={isHintLoading || gameStatus !== 'playing'} className="text-sm gap-2">
            {isHintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            Get AI Hint
          </Button>
        </div>

        {/* 游戏状态栏：剩余地雷数、表情按钮、计时器 */}
        <div className="flex justify-around items-center p-3 bg-secondary rounded-md shadow">
          <div className="flex items-center text-lg font-semibold">
            <Bomb className="w-6 h-6 mr-2 text-destructive" />
            <span>{String(gameSettings.mines - flagsUsed).padStart(2, '0')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={initializeGame} className="rounded-full w-12 h-12">
            {getStatusIcon()}
          </Button>
           <div className="text-lg font-semibold tabular-nums">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        {/* 坐标输入区域 */}
        <div className="mt-4 flex items-center space-x-2 justify-center">
          <Input
            type="text"
            placeholder={`Row (0-${gameSettings.rows - 1})`}
            value={inputRow}
            onChange={(e) => setInputRow(e.target.value)}
            className="w-28 text-sm"
            disabled={gameStatus !== 'playing'}
          />
          <Input
            type="text"
            placeholder={`Col (0-${gameSettings.cols - 1})`}
            value={inputCol}
            onChange={(e) => setInputCol(e.target.value)}
            className="w-28 text-sm"
            disabled={gameStatus !== 'playing'}
          />
          <Button 
            onClick={handleRevealByInputClick} 
            disabled={gameStatus !== 'playing'}
            className="text-sm"
          >
            Reveal
          </Button>
        </div>
      </header>

      {/* 游戏板网格 */}
      <div
        className="grid gap-0.5 bg-border p-1 rounded-md shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${gameSettings.cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((rowState, r) =>
          rowState.map((cellState, c) => (
            <CellComponent
              key={`${r}-${c}`}
              cell={cellState}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => handleContextMenu(e, r, c)}
              disabled={gameStatus !== 'playing'}
              isHinted={hintedCell?.row === r && hintedCell?.col === c}
              hintActionType={hintedCell?.row === r && hintedCell?.col === c ? hintedCell.actionType : undefined}
            />
          ))
        )}
      </div>

      {/* 游戏结束对话框 */}
      {showDialog && (
         <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl text-center">
                {gameStatus === 'won' ? 'Congratulations!' : 'Game Over!'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-lg mt-2">
                {gameStatus === 'won'
                  ? `You cleared all ${gameSettings.mines} mines in ${formatTime(elapsedTime)}! Well done!`
                  : 'You hit a mine! Better luck next time.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogAction onClick={initializeGame} className="w-full text-lg py-3">
                Play Again
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}