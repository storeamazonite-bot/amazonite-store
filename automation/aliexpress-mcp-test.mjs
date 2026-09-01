import assert from 'node:assert/strict';
import { createSession, listTools } from './aliexpress-mcp-adapter.mjs';

async function main() {
  const session = await createSession();
  const tools = await listTools(session);
  const names = (tools?.tools || []).map(tool => tool.name);
  assert(names.includes('search_aliexpress'), 'search_aliexpress tool is missing');
  assert(names.includes('get_aliexpress_product'), 'get_aliexpress_product tool is missing');
  console.log('PASS: AliExpress MCP session established and required tools are available.');
  console.log(names.join(', '));
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
