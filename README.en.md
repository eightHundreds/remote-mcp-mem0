# Cloudflare Workers Remote MCP Template (Mem0)

Spin up a Mem0-enabled remote MCP server on Cloudflare Workers in just a few minutes, complete with memory write/read tools and support for both SSE and standard MCP connections.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/eightHundreds/remote-mcp-mem0)

> Click the button above to open the template pre-loaded in the Cloudflare dashboard—no manual repository setup required.

## Highlights
- Ready-to-use `add-memory` and `search-memories` tools powered by the Mem0 API
- Exposes both `/sse` and `/mcp` endpoints for Cloudflare AI Playground and local MCP clients
- Optional bearer-token enforcement and STDIO mode for desktop MCP integrations

## Prerequisites
1. Ensure your Cloudflare account has Workers enabled and a Worker namespace available.
2. Generate a Mem0 API key and store it as the `MEM0_API_KEY` environment variable.
3. (Optional) Configure a default user ID with `DEFAULT_USER_ID` (defaults to `mem0-mcp-user`).
4. (Optional) Set `MCP_ACCESS_TOKEN` if you want bearer-token access control.

## One-Click Deployment
1. Sign in to Cloudflare and click the "Deploy to Workers" button above.
2. Pick the target account and deployment name in the creation flow.
3. Add the required environment variables under **Environment Variables** and deploy.
4. After deployment, Workers will expose a domain like `remote-mcp-mem0.<your-account>.workers.dev`:
   - SSE endpoint: `https://<domain>/sse`
   - HTTP endpoint: `https://<domain>/mcp`

## Scaffold with the CLI
```bash
npm create cloudflare@latest -- <project-name> --template=eightHundreds/remote-mcp-mem0
```
Follow the prompts to configure your account, environment variables, and deployment options.

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch the local dev server (serves both `/sse` and `/mcp` endpoints):
   ```bash
   npm run dev
   ```
3. Deploy updates to Cloudflare:
   ```bash
   npm run deploy
   ```

For STDIO-based MCP clients, reuse the `main()` implementation in `src/index.ts` and run the bundled `index.js` with Node.js while providing the same environment variables.

## Customize the Tools
- Core server setup lives in `src/index.ts`; define additional tools in the `init()` method via `this.server.tool(...)`.
- Mem0 API interactions are encapsulated within `src/mem0-client.ts`; extend or swap logic there as needed.
- When introducing new environment variables, update `worker-configuration.d.ts` to preserve type hints.

## MCP Client Integrations
- **Cloudflare AI Playground**: Visit [playground.ai.cloudflare.com](https://playground.ai.cloudflare.com/) and paste your deployed `/sse` URL to try the tools directly in the browser.
- **Claude Desktop / Other local clients**: Use [mcp-remote](https://www.npmjs.com/package/mcp-remote) as a proxy with a configuration similar to:
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
  If `MCP_ACCESS_TOKEN` is set, append `--bearer <token>` to the arguments or supply an `Authorization` header.

## Useful Scripts
- `npm run dev`: Start the Wrangler dev server locally.
- `npm run deploy`: Publish the current build to Cloudflare Workers.
- `npm run type-check`: Perform a TypeScript type check.
- `npm run lint:fix` / `npm run format`: Format or lint the project with Biome.

Contributions are welcome—feel free to open issues or PRs to enhance the template or expand the available MCP tools.

> 中文版请见 [README.md](README.md)
