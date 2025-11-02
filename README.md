# Cloudflare Workers 远程 MCP 模板（Mem0）

利用本模板，几分钟内即可在 Cloudflare Workers 上部署一个接入 [Mem0](https://mem0.ai/) 的远程 MCP 服务器，提供记忆写入与检索工具，同时兼容 SSE 与标准 MCP 连接。

[![一键部署到 Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/eightHundreds/remote-mcp-mem0)

> 👉 点击上方按钮即可直接在 Cloudflare 控制台中创建项目，无需手动配置仓库。

> English version: [README.en.md](README.en.md)

## 功能亮点
- 开箱即用的 `add-memory` 和 `search-memories` 工具，调用 Mem0 API 存储与检索记忆
- 同时暴露 `/sse` 与 `/mcp` 两种协议端点，适配 Cloudflare AI Playground 及本地 MCP 客户端
- 可选令牌校验与本地 STDIO 模式，方便在桌面 MCP 客户端中调试

## 部署准备
1. 确保你的 Cloudflare 账号已启用 Workers，并创建至少一个命名空间。
2. 在 Mem0 后台申请 API Key，保存为环境变量 `MEM0_API_KEY`。
3. （可选）预设默认用户 ID：`DEFAULT_USER_ID`，默认为 `mem0-mcp-user`。
4. （可选）若需要访问控制，设置 `MCP_ACCESS_TOKEN` 作为 Bearer Token。

## 一键部署流程
1. 登录 Cloudflare，并点击 README 顶部的 “Deploy to Workers” 按钮。
2. 在弹出的创建页面选择你的账户和部署名称。
3. 在 **Environment Variables** 栏位填入上述变量，保存并部署。
4. 部署完成后，Workers 会输出形如 `remote-mcp-mem0.<your-account>.workers.dev` 的域名：
   - SSE 端点：`https://<domain>/sse`
   - HTTP 端点：`https://<domain>/mcp`

## 使用 CLI 生成新项目
```bash
npm create cloudflare@latest -- <project-name> --template=eightHundreds/remote-mcp-mem0
```
执行后按照提示填写账号、环境变量与部署配置即可。

## 本地开发
1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动本地开发环境（提供 /sse 与 /mcp 端点）：
   ```bash
   npm run dev
   ```
3. 将更改发布到 Cloudflare：
   ```bash
   npm run deploy
   ```

若需在桌面客户端中通过 STDIO 连接，可参考 `src/index.ts` 中的 `main()` 实现，使用任意兼容的 Node.js 打包方式运行生成的 `index.js`。

## 自定义工具
- 核心逻辑位于 `src/index.ts`，在 `Mem0MCP` 类的 `init()` 方法内通过 `this.server.tool(...)` 定义工具。
- Mem0 API 的封装实现在 `src/mem0-client.ts`，如需扩展数据结构或接入其他服务，可在此调整。
- 需要新增环境变量时，请同步更新 `worker-configuration.d.ts` 以获得类型提示。

## MCP 客户端接入
- **Cloudflare AI Playground**：访问 [playground.ai.cloudflare.com](https://playground.ai.cloudflare.com/)，将发布后的 `/sse` 地址粘贴到 Remote MCP Server 配置中，即可在浏览器中测试工具。
- **Claude Desktop / 其他本地客户端**：使用 [mcp-remote](https://www.npmjs.com/package/mcp-remote) 作为代理，在配置文件中加入类似以下内容：
  ```json
  {
    "mcpServers": {
      "mem0": {
        "command": "npx",
        "args": [
          "mcp-remote",
          "https://<domain>/sse"
        ]
      }
    }
  }
  ```
  如设置了 `MCP_ACCESS_TOKEN`，请在 `args` 中追加 `--bearer <token>` 或设置 `Authorization` 头。

## 常用脚本
- `npm run dev`：在本地使用 Wrangler 启动开发服务器。
- `npm run deploy`：将当前版本部署到 Cloudflare Workers。
- `npm run type-check`：执行 TypeScript 类型检查。
- `npm run lint:fix` / `npm run format`：使用 Biome 格式化与修复代码。

欢迎提交 Issue 或 PR 来改进此模板，也欢迎基于模板构建更多 MCP 工具集成。
