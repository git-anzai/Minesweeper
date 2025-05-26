# Mine Navigator 扫雷导航

中文 | [English](./README.md)

这是一个使用Next.js、React、ShadCN UI、Tailwind CSS构建的交互式扫雷游戏，并集成了Genkit提供AI提示功能。

## 功能特点
[Watch Demo Video](./demo.mp4)
* **经典扫雷玩法**：揭开方块、避开地雷，使用数字推断地雷位置。
* **交互式游戏面板**：
    * **左键点击**：揭开一个方块。
    * **右键点击**：标记或取消标记可能含有地雷的方块。
    * **坐标输入**：手动输入行列号来揭开特定方块。
* **难度选择**：选择你的挑战难度！
    * **简单**：8x8网格，10个地雷。
    * **中等**：10x10网格，12个地雷。
    * **困难**：16x16网格，40个地雷。
    （难度更改将在下一局新游戏时生效）。
* **AI智能提示**：遇到困难？获取AI建议！
    * AI分析当前棋盘状态。
    * 建议**揭开**安全方块或**标记**确定的地雷。
    * 提供建议的**推理过程**。
    * 指出建议的**置信度**。
    * 在棋盘上高亮显示建议的方块。
* **游戏计时器**：记录你的通关时间。
* **响应式设计**：适配不同屏幕尺寸。
* **现代界面**：使用ShadCN UI组件的清爽直观界面。

## 开始使用

主游戏界面位于`src/app/page.tsx`，渲染了来自`src/components/minesweeper/GameBoard.tsx`的`GameBoard`组件。

核心游戏逻辑（棋盘创建、方块揭开）在`src/lib/minesweeper.ts`中。

AI提示功能作为Genkit流程实现在`src/ai/flows/minesweeper-hint-flow.ts`中。

## 游戏玩法

1. **选择难度**：从下拉菜单中选择你喜欢的难度级别。
2. **开始游戏**：
    * **左键点击**方块来揭开它。
        * 如果是地雷，游戏结束。
        * 如果是数字，表示周围8个相邻方块中地雷的数量。
        * 如果是空白，所有相邻的非地雷方块都会被递归揭开。
    * **右键点击**方块来放置旗帜，如果你怀疑那里有地雷。再次右键点击可以移除旗帜。
    * 或者，在输入框中输入**行号和列号**（从0开始），然后点击"揭开"。
3. **使用AI提示（可选）**：如果不确定下一步，点击"获取AI提示"按钮（灯泡图标）。AI会建议一个移动并高亮显示相应方块。
4. **获胜**：成功揭开所有不含地雷的方块。
5. **失败**：揭开含有地雷的方块。
6. **重新开始**：随时点击笑脸/状态图标开始新游戏。

## 技术栈

* **框架**：Next.js（使用App Router）
* **UI库**：React
* **组件**：ShadCN UI
* **样式**：Tailwind CSS
* **AI**：Genkit（使用Google AI模型）
* **语言**：TypeScript

## 开发指南

### 前置要求

* Node.js（推荐18版本或更高）
* npm或yarn

### 本地运行

1. **克隆仓库（如果还没有）：**
    ```bash
    git clone <your-repository-url>
    cd mine-navigator
    ```

2. **安装依赖：**
    ```bash
    npm install
    # 或
    # yarn install
    ```

3. **设置环境变量：**
    在项目根目录创建`.env.local`文件（如果不存在），添加必要的环境变量，比如如果你要扩展AI功能需要的Google AI API密钥（https://aistudio.google.com/app/apikey）。
    `.env.local`示例：
    ```
    GOOGLE_API_KEY=your_google_api_key_here
    ```

4. **运行Next.js开发服务器：**
    这将启动主应用程序。
    ```bash
    npm run dev
    ```
    应用程序通常会在`http://localhost:9002`上可用。

5. **运行Genkit开发服务器（用于AI开发）：**
    如果你正在开发或测试Genkit AI流程，需要在另一个终端中运行Genkit开发服务器：
    ```bash
    npm run genkit:dev
    # 或者用于监视更改
    # npm run genkit:watch
    ```
    Genkit开发者UI将在`http://localhost:4000`上可用。在本地开发期间，Next.js应用将通过此服务器与Genkit流程通信。

### 项目结构

* `src/app/`：Next.js App Router页面和布局。
* `src/components/`：React组件。
    * `src/components/ui/`：ShadCN UI组件。
    * `src/components/minesweeper/`：游戏相关组件如`GameBoard.tsx`和`Cell.tsx`。
* `src/lib/`：工具函数和核心逻辑。
    * `src/lib/minesweeper.ts`：核心游戏逻辑。
* `src/ai/`：Genkit AI集成文件。
    * `src/ai/flows/`：Genkit流程定义（如`minesweeper-hint-flow.ts`）。
    * `src/ai/genkit.ts`：Genkit插件配置。
* `public/`：静态资源。
* `tailwind.config.ts`：Tailwind CSS配置。
* `globals.css`：全局样式和主题CSS变量。

### 部署（Next.js）

由于这是一个标准的Next.js应用程序，你可以将其部署到支持Next.js的平台，如Vercel。