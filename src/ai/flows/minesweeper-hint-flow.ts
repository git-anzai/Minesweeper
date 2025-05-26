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
import {z} from 'zod';

// 定义输入数据的验证模式
const MinesweeperHintInputSchema = z.object({
  boardString: z.string().describe(
    "The current Minesweeper board state as a string. Each row is separated by a newline '\\n'. Each cell in a row is a character: '?' for hidden, 'F' for flagged, 'E' for empty revealed (0 mines), '1'-'8' for revealed number."
  ),
  rows: z.number().int().min(1).describe("The number of rows on the board."),
  cols: z.number().int().min(1).describe("The number of columns on the board."),
  totalMines: z.number().int().min(1).describe("The total number of mines on the board."),
});
export type MinesweeperHintInput = z.infer<typeof MinesweeperHintInputSchema>;

// 定义输出数据的验证模式
const MinesweeperHintOutputSchema = z.object({
  actionType: z.enum(['reveal', 'flag']).describe("The type of action suggested: 'reveal' a cell or 'flag' a cell as a mine."),
  row: z.number().int().min(0).describe("The 0-indexed row of the cell for the suggested action."),
  col: z.number().int().min(0).describe("The 0-indexed column of the cell for the suggested action."),
  reasoning: z.string().describe("A brief explanation for why this action is suggested."),
  isConfident: z.boolean().describe("True if the AI is highly confident (e.g., a guaranteed safe move or a guaranteed mine). False if it's a probabilistic best guess."),
});
export type MinesweeperHintOutput = z.infer<typeof MinesweeperHintOutputSchema>;

// 导出获取提示的主函数
export async function getMinesweeperHint(input: MinesweeperHintInput): Promise<MinesweeperHintOutput> {
  return minesweeperHintFlow(input);
}

// 定义AI提示生成的提示词模板
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

You MUST adhere to the following output constraints:
- If actionType is 'reveal', the cell (row, col) you choose MUST currently be a hidden cell (represented by '?') on the input boardString.
- If actionType is 'flag', the cell (row, col) you choose MUST currently be a hidden cell ('?') on the input boardString. (Do not suggest flagging an already flagged 'F' cell unless there are no '?' cells to flag strategically).
- Do NOT suggest revealing cells that are already revealed (e.g., 'E', '1' through '8').
- Do NOT suggest revealing a cell that is currently flagged ('F'). If you believe a flagged cell is safe, your reasoning might mention unflagging it, but your primary action should be to 'reveal' a '?' cell, or 'flag' a '?' cell.

Important considerations for your reasoning:
- For a '1' touching only one '?' cell, that '?' is a mine.
- If a '1' is already satisfied by a 'F' flag, other '?' cells next to it are safe.
- Analyze patterns like "1-2-1" or "1-2-2-1".
- If all mines around a numbered cell are accounted for by flags, any remaining '?' neighbors are safe.

Provide your output as a JSON object matching the defined schema. Ensure row and col are 0-indexed.
The reasoning should be concise and explain the core logic for your choice. If it's a guess, briefly state why it's the best guess.
If the board is very early (few cells revealed), a random '?' far from existing numbers might be a reasonable guess.
If there are no valid moves (e.g., all non-mine cells revealed, or only impossible choices), you can suggest revealing any '?' cell and set \`isConfident\` to false, with reasoning like "No guaranteed moves, making a strategic guess."
Focus on a single best move.
`,
});

// 定义扫雷提示的AI流程
const minesweeperHintFlow = ai.defineFlow(
  {
    name: 'minesweeperHintFlow',
    inputSchema: MinesweeperHintInputSchema,
    outputSchema: MinesweeperHintOutputSchema,
  },
  async (input): Promise<MinesweeperHintOutput> => {
    // 调用AI获取提示
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI未返回输出结果");
    }

    // 验证AI返回结果的有效性
    let suggestionIsValid = true;
    let invalidReason = "";

    // 检查坐标是否在游戏板范围内
    if (output.row < 0 || output.row >= input.rows || output.col < 0 || output.col >= input.cols) {
        suggestionIsValid = false;
        invalidReason = `AI returned out-of-bounds cell (${output.row}, ${output.col})`;
    } else {
        // 将游戏板字符串分割成行数组
        const boardRows = input.boardString.split('\n');
        const targetCellChar = boardRows[output.row]?.[output.col];

        // 验证目标格子的有效性
        if (!targetCellChar) { 
            suggestionIsValid = false;
            invalidReason = `Cell (${output.row}, ${output.col}) could not be read from board string.`;
        } else if (output.actionType === 'reveal' && targetCellChar !== '?') {
            // 如果是揭示操作，目标必须是未揭示的格子
            suggestionIsValid = false;
            invalidReason = `AI suggested to REVEAL a non-hidden cell  ('${targetCellChar}') at (${output.row}, ${output.col}). Expected '?'.`;
        } else if (output.actionType === 'flag' && targetCellChar !== '?') {
            // 允许AI建议标记一个已标记的格子
            // 但标记操作的主要目标应该是未揭示的格子
            // 禁止标记已揭示的空格子或数字格子
            if (targetCellChar !== 'F') { 
              suggestionIsValid = false;
              invalidReason = `AI suggested to FLAG a non-hidden/non-flaggable cell ('${targetCellChar}') at (${output.row}, ${output.col}). Expected '?' or 'F'`;
            }
        }
    }

    // 如果AI的建议无效，使用后备策略
    if (!suggestionIsValid) {
        console.error("AI提示验证失败:", invalidReason, "原始AI输出:", output);
        
        // 后备策略：找到第一个未揭示的格子并建议揭示它
        // 使用reduce遍历每一行，找到第一个'?'字符的位置
        const firstHidden = input.boardString.split('\n').reduce((acc, rStr, rIdx) => {
            if (acc) return acc;
            const cIdx = rStr.indexOf('?');
            if (cIdx !== -1) return { row: rIdx, col: cIdx };
            return null;
        }, null as {row: number, col: number} | null);

        if (firstHidden) {
            // 返回一个基本的后备提示
            return {
                actionType: 'reveal', // 使用揭示作为默认操作，因为这是更常见且通常更安全的提示
                row: firstHidden.row,
                col: firstHidden.col,
                reasoning: `AI suggestion was invalid (${invalidReason.split('.')[0]})；falling back to revealing first available hidden cell`,
                isConfident: false,
            };
        }
        // 如果没有找到隐藏的格子，说明游戏已结束或出现严重错误
        throw new Error(`AI建议无效 (${invalidReason.split('.')[0]})，且找不到后备的隐藏格子`);
    }

    // 返回有效的AI提示
    return output;
  }
);