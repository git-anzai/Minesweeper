"use client";

import type { CellState } from '@/lib/minesweeper';
import { Bomb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CellProps {
  /** 当前格子的状态 */
  cell: CellState;
  /** 左键点击格子时的回调函数 */
  onClick: () => void;
  /** 右键点击格子时的回调函数 */
  onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** 格子是否禁用交互（例如游戏结束时） */
  disabled: boolean;
  /** 可选：当前格子是否正在被AI提示 */
  isHinted?: boolean;
  /** 可选：AI建议对这个格子采取的动作类型（'reveal'表示揭示，'flag'表示标记） */
  hintActionType?: 'reveal' | 'flag';
}

// 不同数字对应的颜色样式映射表
const numberColors: { [key: number]: string } = {
  1: 'text-blue-600 dark:text-blue-400',    // 1个地雷时显示蓝色
  2: 'text-green-600 dark:text-green-400',  // 2个地雷时显示绿色
  3: 'text-red-600 dark:text-red-400',      // 3个地雷时显示红色
  4: 'text-purple-600 dark:text-purple-400', // 4个地雷时显示紫色
  5: 'text-maroon-600 dark:text-maroon-400', // 5个地雷时显示栗色
  6: 'text-teal-600 dark:text-teal-400',    // 6个地雷时显示青色
  7: 'text-black dark:text-gray-200',       // 7个地雷时显示黑色
  8: 'text-gray-600 dark:text-gray-400',    // 8个地雷时显示灰色
};

export function CellComponent({ cell, onClick, onContextMenu, disabled, isHinted, hintActionType }: CellProps) {
  // 渲染格子内容的函数
  const renderContent = () => {
    // 如果格子被标记为地雷，显示旗帜图标
    if (cell.isFlagged) {
      return <Flag className="w-5 h-5 text-foreground" />;
    }
    // 如果格子未被揭示，不显示任何内容
    if (!cell.isRevealed) {
      return null; 
    }
    // 如果格子是地雷，显示炸弹图标
    if (cell.isMine) {
      return <Bomb className={cn("w-5 h-5", cell.exploded ? "text-white" : "text-destructive-foreground")} />;
    }
    // 如果格子周围有地雷，显示数字
    if (cell.adjacentMines > 0) {
      return (
        <span className={cn("font-mono font-bold text-lg", numberColors[cell.adjacentMines] || 'text-warning')}>
          {cell.adjacentMines}
        </span>
      );
    }
    return null; 
  };

  // 根据AI提示类型设置提示框的颜色
  const hintRingColor = hintActionType === 'reveal' 
    ? 'ring-green-500'  // 建议揭示时显示绿色边框
    : hintActionType === 'flag' 
    ? 'ring-orange-500' // 建议标记时显示橙色边框（避免使用红色，因为与危险色太相近）
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      disabled={disabled || cell.isRevealed}
      className={cn(
        // 基础样式：固定大小、边框、居中、过渡动画、阴影和圆角
        'w-10 h-10 md:w-12 md:h-12 border flex items-center justify-center transition-all duration-150 ease-in-out shadow-md rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:z-10',
        {
          // 未揭示且未标记时的样式
          'bg-primary hover:bg-primary/90 active:bg-primary/80 cursor-pointer': !cell.isRevealed && !cell.isFlagged,
          // 未揭示但已标记时的样式
          'bg-primary/70 cursor-pointer': !cell.isRevealed && cell.isFlagged, 
          // 已揭示且不是地雷时的样式
          'bg-accent animate-cell-reveal': cell.isRevealed && !cell.isMine,
          // 已揭示且是被点击的地雷时的样式
          'bg-destructive animate-cell-reveal': cell.isRevealed && cell.isMine && cell.exploded,
          // 已揭示的其他地雷的样式
          'bg-muted animate-cell-reveal': cell.isRevealed && cell.isMine && !cell.exploded, 
          // 已揭示格子的鼠标样式
          'cursor-default': cell.isRevealed,
          // AI提示时的基础边框样式
          'ring-2 ring-offset-1': isHinted,
        },
        isHinted ? hintRingColor : '' // 应用特定的AI提示颜色
      )}
    >
      <div className={cn( (cell.isRevealed || cell.isFlagged) && 'animate-content-fade-in')}>
        {renderContent()}
      </div>
    </button>
  );
}