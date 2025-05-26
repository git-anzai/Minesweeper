export interface CellState {
  row: number;        // 格子的行号
  col: number;        // 格子的列号
  isMine: boolean;    // 是否是地雷
  isRevealed: boolean; // 是否已被揭示
  isFlagged: boolean;  // 是否被标记为地雷
  adjacentMines: number; // 周围8个格子中地雷的数量
  exploded?: boolean;   // 标记是否是被点击爆炸的地雷
}

export const createBoard = (rows: number, cols: number, numMines: number): CellState[][] => {
  // 初始化空的游戏板
  // 使用二维数组表示游戏板，每个元素都是一个CellState对象
  let board: CellState[][] = Array(rows)
    .fill(null)
    .map((_, r) =>
      Array(cols)
        .fill(null)
        .map((_, c) => ({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
    );

  // 随机放置地雷
  // 使用while循环确保放置指定数量的地雷
  let minesPlaced = 0;
  while (minesPlaced < numMines) {
    // 随机生成行列坐标
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    // 如果该位置还没有地雷，则放置地雷
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // 计算每个非地雷格子周围的地雷数量
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 跳过地雷格子
      if (board[r][c].isMine) continue;
      let mineCount = 0;
      // 检查周围8个方向的格子
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // 跳过自身格子
          if (i === 0 && j === 0) continue;
          const nr = r + i;
          const nc = c + j;
          // 检查边界条件并统计地雷数
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            mineCount++;
          }
        }
      }
      board[r][c].adjacentMines = mineCount;
    }
  }
  return board;
};

export const revealCell = (board: CellState[][], row: number, col: number): { newBoard: CellState[][], revealedCountChange: number, exploded: boolean } => {
  const rows = board.length;
  const cols = board[0].length;
  // 深拷贝游戏板，避免修改原始数据
  let newBoard = board.map(r => r.map(cell => ({ ...cell })));
  let revealedCountChange = 0;  // 记录本次操作揭示的格子数量
  let exploded = false;         // 是否触发地雷

  const cell = newBoard[row][col];

  // 如果格子已经被揭示或被标记为地雷，则不做任何操作
  if (cell.isRevealed || cell.isFlagged) {
    return { newBoard, revealedCountChange, exploded };
  }

  // 揭示当前格子
  cell.isRevealed = true;
  revealedCountChange++;

  // 如果点到地雷
  if (cell.isMine) {
    cell.exploded = true;  // 标记这个地雷被触发
    exploded = true;
    // 游戏结束，显示所有地雷
    newBoard.forEach(r => r.forEach(c => {
      if (c.isMine) c.isRevealed = true;
    }));
    return { newBoard, revealedCountChange, exploded };
  }

  // 如果是空白格子（周围没有地雷），则自动展开
  if (cell.adjacentMines === 0) {
    // 使用广度优先搜索(BFS)实现连锁反应
    // 创建队列存储待处理的格子坐标
    const queue: { r: number; c: number }[] = [{ r: row, c: col }];
    // 使用Set记录已访问的格子，防止重复处理
    const visited = new Set<string>();
    visited.add(`${row},${col}`);

    // BFS主循环
    while (queue.length > 0) {
      const current = queue.shift()!;
      // 检查当前格子的8个相邻格子
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // 跳过自身格子
          if (i === 0 && j === 0) continue;
          const nr = current.r + i;
          const nc = current.c + j;

          // 检查边界条件
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = newBoard[nr][nc];
            const neighborKey = `${nr},${nc}`;
            // 如果相邻格子未被揭示、未被标记、未被访问
            if (!neighbor.isRevealed && !neighbor.isFlagged && !visited.has(neighborKey)) {
              neighbor.isRevealed = true;
              revealedCountChange++;
              visited.add(neighborKey);
              // 如果相邻格子也是空白格子，加入队列继续处理
              if (neighbor.adjacentMines === 0 && !neighbor.isMine) {
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }
  }
  return { newBoard, revealedCountChange, exploded };
};