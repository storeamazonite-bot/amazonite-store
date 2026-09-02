import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { searchAliExpress, getAliExpressProduct } from '../automation/aliexpress-mcp-adapter.mjs';
import { evaluateProduct } from '../automation/product_intelligence.mjs';

const server = new McpServer(
  { name: 'amazonite-store-ai-team', version: '1.0.0' },
  {
    instructions:
      'You are connected to the Amazonite Store AI Team. Use these tools for product research and intelligence. Treat NOVA as the orchestrator/manager. Do not publish products or claim affiliate eligibility unless authoritative affiliate data has been verified.'
  }
);

server.registerTool(
  'amazonite_team_manifest',
  {
    description: 'Returns the Amazonite Store AI Team roles, operating rules, and integration status.',
    inputSchema: z.object({})
  },
  async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        project: 'Amazonite Store',
        orchestrator: 'NOVA',
        specialist_role: 'Claude',
        mission: 'AI-assisted AliExpress affiliate product research and store intelligence',
        hard_gates: { orders: '>500', rating: '>4.5', commission: '>8%' },
        publication_policy: 'never publish from unverified affiliate data',
        markets: ['USA', 'UK', 'Canada', 'Europe'],
        marketing_languages: ['English', 'French', 'Spanish'],
        tools_exposed: ['amazonite_team_manifest', 'aliexpress_search', 'aliexpress_get_product']
      }, null, 2)
    }]
  })
);

server.registerTool(
  'aliexpress_search',
  {
    description: 'Searches AliExpress through the configured Amazonite AliExpress MCP adapter and normalizes product data.',
    inputSchema: z.object({
      query: z.string().min(2),
      sort: z.enum(['orders', 'price', 'rating']).default('orders'),
      page: z.number().int().min(1).max(50).default(1)
    })
  },
  async ({ query, sort, page }) => {
    try {
      const products = await searchAliExpress(query, { sort, page });
      return {
        content: [{ type: 'text', text: JSON.stringify({ query, sort, page, count: products.length, products }, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `AliExpress search failed: ${error.message}` }]
      };
    }
  }
);

server.registerTool(
  'aliexpress_get_product',
  {
    description: 'Gets and normalizes one AliExpress product by product ID or URL.',
    inputSchema: z.object({ productIdOrUrl: z.string().min(3) })
  },
  async ({ productIdOrUrl }) => {
    try {
      const product = await getAliExpressProduct(productIdOrUrl);
      return {
        content: [{ type: 'text', text: JSON.stringify(product, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `AliExpress product lookup failed: ${error.message}` }]
      };
    }
  }
);

export default createMcpHandler(() => server, { legacy: 'stateless' });
