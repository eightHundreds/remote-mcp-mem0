import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import MemoryClient, { type Message } from './mem0-client';
import { z } from 'zod';

type NodeProcess = {
  env?: Record<string, string | undefined>;
  argv?: string[];
  exit?: (code?: number) => never;
};

const globalProcess = (globalThis as { process?: NodeProcess }).process;

if (globalProcess?.env) {
  import('dotenv')
    .then(({ config }) => {
      config();
    })
    .catch(() => {});
}

// Mem0 MCP Agent
export class Mem0MCP extends McpAgent {
  server = new McpServer({
    name: 'mem0-mcp',
    version: '0.0.1',
  });

  async init() {
    // 从环境变量获取配置
    const env = this.env as WorkerEnv;
    const apiKey = env.MEM0_API_KEY ?? globalProcess?.env?.MEM0_API_KEY ?? '';
    const defaultUserId = env.DEFAULT_USER_ID ?? 'mem0-mcp-user';

    const memoryClient = new MemoryClient({ apiKey });

    // add-memory tool
    this.server.tool(
      'add-memory',
      'Add a new memory about the user. Call this whenever the user shares preferences, facts about themselves, or explicitly asks you to remember something.',
      {
        content: z.string().describe('The content to store in memory'),
        userId: z
          .string()
          .optional()
          .describe('User ID for memory storage. If omitted, uses config.defaultUserId.'),
      },
      async ({ content, userId }) => {
        const resolvedUserId = userId || defaultUserId;
        try {
          const messages: Message[] = [{ role: 'user', content }];
          await memoryClient.add(messages, {
            user_id: resolvedUserId,
            async_mode: true,
            version: 'v2',
            output_format: 'v1.1',
          });
          return {
            content: [
              {
                type: 'text',
                text: 'Memory added successfully',
              },
            ],
          } as const;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text:
                  'Error adding memory: ' +
                  (error instanceof Error ? error.message : String(error)),
              },
            ],
            isError: true,
          } as const;
        }
      }
    );

    // search-memories tool
    this.server.tool(
      'search-memories',
      'Search through stored memories. Call this whenever you need to recall prior information relevant to the user query.',
      {
        query: z
          .string()
          .describe("The search query, typically derived from the user's current question."),
        userId: z
          .string()
          .optional()
          .describe('User ID for memory storage. If omitted, uses config.defaultUserId.'),
      },
      async ({ query, userId }) => {
        const resolvedUserId = userId || defaultUserId;
        try {
          const results: Array<{ memory?: string; score?: number }> =
            await memoryClient.search(query, {
              user_id: resolvedUserId,
            });
          const formattedResults = (results || [])
            .map(
              (result) =>
                `Memory: ${result.memory ?? ''}\nRelevance: ${result.score ?? ''}\n---`
            )
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: formattedResults || 'No memories found',
              },
            ],
          } as const;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text:
                  'Error searching memories: ' +
                  (error instanceof Error ? error.message : String(error)),
              },
            ],
            isError: true,
          } as const;
        }
      }
    );
  }
}

type WorkerEnv = {
  MEM0_API_KEY?: string;
  DEFAULT_USER_ID?: string;
  MCP_ACCESS_TOKEN?: string;
};

export async function fetch(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);

  // 身份验证检查（OPTIONS 请求除外）
  if (request.method !== 'OPTIONS') {
    const unauthorizedResponse = enforceAuth(request, env, url);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }
  }

  // SSE 端点
  if (url.pathname === '/sse' || url.pathname.startsWith('/sse/')) {
    return Mem0MCP.serveSSE('/sse', {
      corsOptions: {
        origin: '*',
        methods: 'GET, POST, DELETE, OPTIONS',
        headers: 'Content-Type, Accept, Authorization, mcp-session-id, MCP-Protocol-Version, x-mcp-auth-token, Cache-Control',
        exposeHeaders: 'mcp-session-id',
        maxAge: 86400,
      },
    }).fetch(request, env, ctx);
  }

  // HTTP 端点
  if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
    return Mem0MCP.serve('/mcp', {
      corsOptions: {
        origin: '*',
        methods: 'GET, POST, DELETE, OPTIONS',
        headers: 'Content-Type, Accept, Authorization, mcp-session-id, MCP-Protocol-Version, x-mcp-auth-token, Cache-Control',
        exposeHeaders: 'mcp-session-id',
        maxAge: 86400,
      },
    }).fetch(request, env, ctx);
  }

  return new Response('Not found', { status: 404 });
}

function enforceAuth(
  request: Request,
  env: WorkerEnv,
  url: URL
): Response | undefined {
  const requiredToken =
    env.MCP_ACCESS_TOKEN ?? globalProcess?.env?.MCP_ACCESS_TOKEN;

  if (!requiredToken) {
    return undefined;
  }

  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  const headerToken = request.headers.get('x-mcp-auth-token') ?? undefined;
  const queryToken = url.searchParams.get('access_token') ?? undefined;

  if (
    bearerToken === requiredToken ||
    headerToken === requiredToken ||
    queryToken === requiredToken
  ) {
    return undefined;
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Bearer realm="mem0-mcp"',
    },
  });
}

// Optional: keep STDIO compatibility for local usage
async function main() {
  if (!globalProcess?.env) {
    console.error('STDIO mode is only supported in Node.js environments.');
    return;
  }

  try {
    console.error('Initializing Mem0 Memory MCP Server (stdio mode)...');

    const server = new McpServer({
      name: 'mem0-mcp',
      version: '0.0.1',
    });

    const apiKey = globalProcess.env.MEM0_API_KEY ?? '';
    const defaultUserId = globalProcess.env.DEFAULT_USER_ID ?? 'mem0-mcp-user';
    const memoryClient = new MemoryClient({ apiKey });

    // 注册工具
    server.tool(
      'add-memory',
      'Add a new memory about the user. Call this whenever the user shares preferences, facts about themselves, or explicitly asks you to remember something.',
      {
        content: z.string().describe('The content to store in memory'),
        userId: z
          .string()
          .optional()
          .describe('User ID for memory storage. If omitted, uses config.defaultUserId.'),
      },
      async ({ content, userId }) => {
        const resolvedUserId = userId || defaultUserId;
        try {
          const messages: Message[] = [{ role: 'user', content }];
          await memoryClient.add(messages, {
            user_id: resolvedUserId,
            async_mode: true,
            version: 'v2',
            output_format: 'v1.1',
          });
          return {
            content: [{ type: 'text', text: 'Memory added successfully' }],
          } as const;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text:
                  'Error adding memory: ' +
                  (error instanceof Error ? error.message : String(error)),
              },
            ],
            isError: true,
          } as const;
        }
      }
    );

    server.tool(
      'search-memories',
      'Search through stored memories. Call this whenever you need to recall prior information relevant to the user query.',
      {
        query: z
          .string()
          .describe("The search query, typically derived from the user's current question."),
        userId: z
          .string()
          .optional()
          .describe('User ID for memory storage. If omitted, uses config.defaultUserId.'),
      },
      async ({ query, userId }) => {
        const resolvedUserId = userId || defaultUserId;
        try {
          const results: Array<{ memory?: string; score?: number }> =
            await memoryClient.search(query, {
              user_id: resolvedUserId,
            });
          const formattedResults = (results || [])
            .map(
              (result) =>
                `Memory: ${result.memory ?? ''}\nRelevance: ${result.score ?? ''}\n---`
            )
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: formattedResults || 'No memories found',
              },
            ],
          } as const;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text:
                  'Error searching memories: ' +
                  (error instanceof Error ? error.message : String(error)),
              },
            ],
            isError: true,
          } as const;
        }
      }
    );

    const { StdioServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/stdio.js'
    );
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Memory MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    globalProcess.exit?.(1);
  }
}

if (globalProcess?.argv?.[1]?.includes('index.js')) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    globalProcess.exit?.(1);
  });
}

// Default export for Cloudflare Workers
export default {
  fetch,
};
