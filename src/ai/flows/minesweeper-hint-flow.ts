'use server';
/**
 * @fileOverview 扫雷游戏AI助手，提供游戏提示功能
 *
 * 主要功能：
 * - getMinesweeperHint - 调用AI流程获取游戏提示的函数
 * - MinesweeperHintInput - getMinesweeperHint函数的输入类型
 * - MinesweeperHintOutput - getMinesweeperHint函数的返回类型
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// 定义AI提示系统的输入数据结构
const MinesweeperHintInputSchema = z.object({
  boardString: z.string().describe(
    // 游戏板状态字符串，每行用换行符分隔，每个格子用特定字符表示：
    // '?' - 未揭示的格子
    // 'F' - 已标记为地雷的格子
    // 'E' - 已揭示且周围无地雷的空格子
    // '1'-'8' - 已揭示的数字格子，表示周围地雷数量
    "The current Minesweeper board state as a string. Each row is separated by a newline '\\n'. Each cell in a row is a character: '?' for hidden, 'F' for flagged, 'E' for empty revealed (0 mines), '1'-'8' for revealed number."
  ),
  rows: z.number().int().min(1).describe("游戏板的行数"),
  cols: z.number().int().min(1).describe("游戏板的列数"),
  totalMines: z.number().int().min(1).describe("游戏板上的总地雷数"),
});
export type MinesweeperHintInput = z.infer<typeof MinesweeperHintInputSchema>;

// 定义AI提示系统的输出数据结构
const MinesweeperHintOutputSchema = z.object({
  actionType: z.enum(['reveal', 'flag']).describe("建议的操作类型：'reveal'表示揭示格子，'flag'表示标记地雷"),
  row: z.number().int().min(0).describe("建议操作的格子行号（从0开始）"),
  col: z.number().int().min(0).describe("建议操作的格子列号（从0开始）"),
  reasoning: z.string().describe("提供此建议的简要解释"),
  isConfident: z.boolean().describe("AI的确信度：true表示这是一个确定的安全移动或确定的地雷，false表示这是一个概率性的最佳猜测"),
});
export type MinesweeperHintOutput = z.infer<typeof MinesweeperHintOutputSchema>;

// 导出获取游戏提示的主函数
export async function getMinesweeperHint(input: MinesweeperHintInput): Promise<MinesweeperHintOutput> {
  return minesweeperHintFlow(input);
}

// 定义AI提示系统的提示词模板
const prompt = ai.definePrompt({
  name: 'minesweeperHintPrompt',
  input: {schema: MinesweeperHintInputSchema},
  output: {schema: MinesweeperHintOutputSchema},
  prompt: `You are an expert Minesweeper player. Analyze the given Minesweeper board and suggest the best next move.
The board is represented as a grid of characters, where each row is separated by a newline character.
Cell characters:
- '?': Hidden cell, not yet revealed or flagged.
- 'F': Flagged cell, suspected to be a mine by the player.
- 'E': Empty cell, revealed and has 0 adjacent mines.
- '1'-'8': Revealed cell, showing the number of adjacent mines.

Board state:
{{{boardString}}}

Game parameters:
- Rows: {{{rows}}}
- Columns: {{{cols}}}
- Total mines on board: {{{totalMines}}}

Your task is to suggest a single, optimal move. Follow these priorities:
1.  If there is any cell that is **guaranteed to be safe** to REVEAL, suggest revealing it. Set \`isConfident\` to true.
2.  If there are no guaranteed safe cells, but there is a cell that is **guaranteed to be a MINE** (based on revealed numbers and surrounding flags/hidden cells), suggest FLAGGING it. Set \`isConfident\` to true.
3.  If neither of the above certain moves exists, identify the **most probable safe cell** to REVEAL as a calculated guess. This often involves cells with the lowest probability of being a mine. Set \`isConfident\` to false for this type of suggestion.

Important considerations for your reasoning:
- For a '1' touching only one '?' cell, that '?' is a mine.
- If a '1' is already satisfied by a 'F' flag, other '?' cells next to it are safe.
- Analyze patterns like "1-2-1" or "1-2-2-1".
- If all mines around a numbered cell are accounted for by flags, any remaining '?' neighbors are safe.

Provide your output as a JSON object matching the defined schema. Ensure row and col are 0-indexed.
The reasoning should be concise and explain the core logic for your choice. If it's a guess, briefly state why it's the best guess.
Do not suggest revealing a cell that is already flagged by the player ('F'). If a flagged cell is your target for a reveal, state that it needs to be unflagged first, but prefer other moves if available.
If the board is very early (few cells revealed), a random '?' far from existing numbers might be a reasonable guess.
If there are no valid moves (e.g., all non-mine cells revealed, or only impossible choices), you can suggest revealing any '?' cell and set \`isConfident\` to false, with reasoning like "No guaranteed moves, making a strategic guess."
Focus on a single best move.
`,
});

// 定义AI提示系统的主要流程
const minesweeperHintFlow = ai.defineFlow(
  {
    name: 'minesweeperHintFlow',
    inputSchema: MinesweeperHintInputSchema,
    outputSchema: MinesweeperHintOutputSchema,
  },
  async (input) => {
    // 基本验证：确保AI返回的行列坐标在游戏板范围内
    // 更复杂的验证（例如建议的格子是否已经被揭示/标记）
    // 应该由提示词处理或在AI出错时进行后处理
    // 目前我们信任AI会按照指示执行
    
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI未返回输出结果");
    }

    // 额外验证行列坐标是否在范围内（虽然Zod schema已经处理了最小值0）
    if (output.row < 0 || output.row >= input.rows || output.col < 0 || output.col >= input.cols) {
        console.error("AI返回了超出范围的格子坐标:", output);
        // 如果AI严重失败，尝试找到一个未揭示的格子作为后备方案
        const firstHidden = input.boardString.split('\n').reduce((acc, r, rIdx) => {
            if (acc) return acc;
            const cIdx = r.indexOf('?');
            if (cIdx !== -1) return { row: rIdx, col: cIdx };
            return null;
        }, null as {row: number, col: number} | null);

        if (firstHidden) {
            return {
                actionType: 'reveal',
                row: firstHidden.row,
                col: firstHidden.col,
                reasoning: "AI建议无效，退回到选择第一个未揭示的格子",
                isConfident: false,
            };
        }
        // 如果没有找到未揭示的格子，说明游戏可能已经结束或出现严重错误
        throw new Error("AI建议无效，且找不到任何未揭示的格子作为后备选择");
    }

    return output;
  }
);