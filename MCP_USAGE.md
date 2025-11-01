# Mem0 MCP 服务器使用文档

## 项目简介

这是一个基于 Model Context Protocol (MCP) 的远程服务器，集成了 Mem0 记忆服务。该服务器允许 AI 助手通过 MCP 协议存储和检索用户记忆，支持在 Cloudflare Workers 上部署。

## 功能特性

- ✅ **添加记忆**: 存储用户的偏好、事实和个人信息
- ✅ **搜索记忆**: 根据查询检索相关的历史记忆
- ✅ **多用户支持**: 支持通过用户 ID 区分不同用户的记忆
- ✅ **远程部署**: 可在 Cloudflare Workers 上部署
- ✅ **本地开发**: 支持 STDIO 模式用于本地开发
- ✅ **可选认证**: 支持访问令牌认证（可选）

## 安装和部署

### 前置要求

- Node.js 18+ 
- Mem0 API Key（从 [Mem0](https://mem0.ai) 获取）
- Cloudflare 账户（用于部署到 Workers）

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd remote-mcp-mem0
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**

创建 `.env` 文件：
```env
MEM0_API_KEY=your_mem0_api_key_here
DEFAULT_USER_ID=mem0-mcp-user  # 可选，默认为 'mem0-mcp-user'
MCP_ACCESS_TOKEN=your_access_token  # 可选，用于 HTTP 认证
```

4. **本地运行（STDIO 模式）**
```bash
npm run dev
```

### Cloudflare Workers 部署

1. **使用 Wrangler 部署**
```bash
npm run deploy
```

2. **配置 Workers 环境变量**

在 Cloudflare Dashboard 或使用 Wrangler 配置：
```bash
wrangler secret put MEM0_API_KEY
wrangler secret put DEFAULT_USER_ID  # 可选
wrangler secret put MCP_ACCESS_TOKEN  # 可选
```

或在 `wrangler.jsonc` 中配置（不推荐用于敏感信息）：
```jsonc
{
  "vars": {
    "MEM0_API_KEY": "your_key",
    "DEFAULT_USER_ID": "mem0-mcp-user",
    "MCP_ACCESS_TOKEN": "your_token"
  }
}
```

部署后，服务器将在以下端点可用：
- `https://your-worker-name.your-subdomain.workers.dev/mcp`

## 配置说明

### 配置参数

服务器支持以下配置参数：

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `mem0ApiKey` | string | 是 | - | Mem0 API 密钥 |
| `defaultUserId` | string | 否 | `mem0-mcp-user` | 默认用户 ID |
| `MCP_ACCESS_TOKEN` | string | 否 | - | HTTP 访问令牌（用于认证） |

### 配置来源优先级

1. 函数参数（`createServer` 的 `config`）
2. 环境变量（`MEM0_API_KEY`, `DEFAULT_USER_ID`）
3. `.env` 文件（仅 STDIO 模式）

## MCP 工具说明

### 1. add-memory

添加新的用户记忆。当用户分享偏好、个人信息或明确要求记住某些内容时调用此工具。

**参数：**
- `content` (string, 必需): 要存储的记忆内容
- `userId` (string, 可选): 用户 ID。如果省略，使用配置的 `defaultUserId`

**示例：**
```json
{
  "name": "add-memory",
  "arguments": {
    "content": "用户喜欢喝咖啡，特别是拿铁",
    "userId": "user-123"
  }
}
```

**响应：**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory added successfully"
    }
  ]
}
```

### 2. search-memories

搜索已存储的记忆。当需要回忆与用户查询相关的历史信息时调用此工具。

**参数：**
- `query` (string, 必需): 搜索查询，通常来自用户的当前问题
- `userId` (string, 可选): 用户 ID。如果省略，使用配置的 `defaultUserId`

**示例：**
```json
{
  "name": "search-memories",
  "arguments": {
    "query": "用户喜欢什么饮料？",
    "userId": "user-123"
  }
}
```

**响应：**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Memory: 用户喜欢喝咖啡，特别是拿铁\nRelevance: 0.95\n---\nMemory: 用户不喜欢茶\nRelevance: 0.82\n---"
    }
  ]
}
```

## 客户端连接方式

### 1. 连接到 Cloudflare AI Playground

1. 访问 https://playground.ai.cloudflare.com/
2. 输入你部署的 MCP 服务器 URL（推荐使用 SSE 端点）：
   ```
   https://your-worker-name.your-subdomain.workers.dev/sse
   ```
   或使用 HTTP 端点：
   ```
   https://your-worker-name.your-subdomain.workers.dev/mcp
   ```
3. 如果配置了 `MCP_ACCESS_TOKEN`，在请求头中添加：
   ```
   Authorization: Bearer your_access_token
   ```
   或
   ```
   x-mcp-auth-token: your_access_token
   ```
   或在 URL 中添加查询参数：
   ```
   https://your-worker-name.your-subdomain.workers.dev/sse?access_token=your_access_token
   ```
   或
   ```
   https://your-worker-name.your-subdomain.workers.dev/mcp?access_token=your_access_token
   ```

### 2. 连接到 Claude Desktop

本服务支持两种连接方式：

#### 方式一：简单 URL 配置（推荐）

**✅ 当前服务已支持 SSE 传输，可以使用简单的 URL 配置！**

编辑 Claude Desktop 配置文件（Settings > Developer > Edit Config）：

**如果配置了认证令牌：**
```json
{
  "mcpServers": {
    "mem0": {
      "url": "https://your-worker-name.your-subdomain.workers.dev/sse?access_token=your_access_token"
    }
  }
}
```

**如果没有配置认证令牌：**
```json
{
  "mcpServers": {
    "mem0": {
      "url": "https://your-worker-name.your-subdomain.workers.dev/sse"
    }
  }
}
```

**注意：** 如果使用认证令牌，也可以通过请求头传递（需要客户端支持）：
```json
{
  "mcpServers": {
    "mem0": {
      "url": "https://your-worker-name.your-subdomain.workers.dev/sse",
      "headers": {
        "Authorization": "Bearer your_access_token"
      }
    }
  }
}
```

#### 方式二：命令模式（通过 mcp-remote 代理）

如果客户端不支持直接 SSE 连接，可以使用 `mcp-remote` 代理：

1. **安装 mcp-remote**
```bash
npm install -g mcp-remote
```

2. **配置 Claude Desktop**

编辑 Claude Desktop 配置文件（Settings > Developer > Edit Config）：

```json
{
  "mcpServers": {
    "mem0": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker-name.your-subdomain.workers.dev/mcp",
        "--bearer-token",
        "your_access_token"
      ]
    }
  }
}
```

如果不使用认证，可以省略 `--bearer-token` 参数：
```json
{
  "mcpServers": {
    "mem0": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker-name.your-subdomain.workers.dev/mcp"
      ]
    }
  }
}
```

#### 两种方式的区别

- **URL 模式**（方式一）：配置简单，直接连接 SSE 端点，无需额外工具
- **命令模式**（方式二）：适用于不支持直接 SSE 的客户端，通过 `mcp-remote` 代理

**推荐使用方式一**，配置更简单！

3. **重启 Claude Desktop**

重启后，`add-memory` 和 `search-memories` 工具将可用。

### 3. 使用 STDIO 模式（本地）

对于本地开发，可以直接使用 STDIO 模式：

**Claude Desktop 配置：**
```json
{
  "mcpServers": {
    "mem0": {
      "command": "node",
      "args": ["/path/to/remote-mcp-mem0/dist/index.js"],
      "env": {
        "MEM0_API_KEY": "your_mem0_api_key",
        "DEFAULT_USER_ID": "mem0-mcp-user"
      }
    }
  }
}
```

### 4. 使用其他 MCP 客户端

任何支持 HTTP MCP 传输的客户端都可以连接到此服务器。使用以下端点：

**端点：** `POST /mcp`

**请求头：**
```
Content-Type: application/json
Authorization: Bearer your_access_token  # 如果配置了认证
```

**请求体：** 标准的 MCP JSON-RPC 请求

## 认证机制

服务器支持可选的访问令牌认证。如果配置了 `MCP_ACCESS_TOKEN` 环境变量，所有请求必须包含有效的认证令牌。

### 支持的认证方式

1. **Bearer Token（推荐）**
   ```
   Authorization: Bearer your_access_token
   ```

2. **自定义 Header**
   ```
   x-mcp-auth-token: your_access_token
   ```

3. **查询参数**
   ```
   ?access_token=your_access_token
   ```

如果未配置 `MCP_ACCESS_TOKEN`，服务器将接受所有请求（无认证）。

## API 示例

### 使用 curl 调用 add-memory

```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "add-memory",
      "arguments": {
        "content": "用户最喜欢的颜色是蓝色",
        "userId": "user-123"
      }
    }
  }'
```

### 使用 curl 调用 search-memories

```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search-memories",
      "arguments": {
        "query": "用户喜欢什么颜色？",
        "userId": "user-123"
      }
    }
  }'
```

## 错误处理

### 常见错误

1. **401 Unauthorized**
   - 原因：认证令牌缺失或无效
   - 解决：检查 `MCP_ACCESS_TOKEN` 配置和请求头

2. **Error adding memory**
   - 原因：Mem0 API 调用失败
   - 解决：检查 `MEM0_API_KEY` 是否有效，网络连接是否正常

3. **Error searching memories**
   - 原因：Mem0 API 调用失败或查询格式错误
   - 解决：检查 API 密钥和查询参数

### 错误响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error adding memory: <error message>"
    }
  ],
  "isError": true
}
```

## 开发指南

### 项目结构

```
remote-mcp-mem0/
├── src/
│   ├── index.ts          # MCP 服务器主文件
│   └── mem0-client.ts    # Mem0 API 客户端
├── wrangler.jsonc        # Cloudflare Workers 配置
├── package.json          # 项目依赖
└── tsconfig.json         # TypeScript 配置
```

### 添加新工具

在 `src/index.ts` 的 `createServer` 函数中添加新工具：

```typescript
server.tool(
  'your-tool-name',
  '工具描述',
  {
    param1: z.string().describe('参数描述'),
    param2: z.number().optional().describe('可选参数'),
  },
  async ({ param1, param2 }) => {
    // 工具实现
    return {
      content: [
        {
          type: 'text',
          text: '结果',
        },
      ],
    } as const;
  }
);
```

### 本地测试

1. **运行开发服务器**
```bash
npm run dev
```

2. **类型检查**
```bash
npm run type-check
```

3. **代码格式化**
```bash
npm run format
```

## 故障排除

### 问题：无法连接到 Mem0 API

- 检查 `MEM0_API_KEY` 是否正确配置
- 确认网络连接正常
- 验证 Mem0 API 服务状态

### 问题：Claude Desktop 无法连接

- 确认 `mcp-remote` 已正确安装
- 检查 Workers URL 是否正确
- 验证认证令牌配置（如果使用）

### 问题：记忆未正确存储

- 检查 Mem0 API 响应
- 确认 `userId` 参数正确传递
- 查看 Workers 日志获取详细错误信息

## 许可证

请查看项目根目录的 LICENSE 文件。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [MCP 协议文档](https://modelcontextprotocol.io/)
- [Mem0 文档](https://docs.mem0.ai/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [MCP Remote Proxy](https://www.npmjs.com/package/mcp-remote)


