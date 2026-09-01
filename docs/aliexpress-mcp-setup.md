# AliExpress MCP — local setup and verification

Amazonite Store uses a replaceable, read-only AliExpress MCP adapter. The public storefront never calls MCP directly.

## Reference server

The current reference is `jnslmk/aliexpress-mcp`:

`https://github.com/jnslmk/aliexpress-mcp`

If the server is run locally, configure:

```text
ALIEXPRESS_MCP_URL=http://127.0.0.1:8000/mcp
AE_REGION=US
AE_CURRENCY=USD
AE_LOCALE=en_US
```

## Smoke test

From the repository root, with Node.js 18+ available:

```bash
node automation/aliexpress-mcp-test.mjs
```

Expected result:

```text
PASS: AliExpress MCP session established and required tools are available.
```

## Search test

```bash
node automation/aliexpress-mcp-adapter.mjs search wireless headphones
```

## Product-detail test

```bash
node automation/aliexpress-mcp-adapter.mjs product <ALIEXPRESS_PRODUCT_ID_OR_URL>
```

## Safety rules

- MCP is read-only for this project.
- Never store secrets in Git.
- Never treat MCP data as proof of affiliate commission.
- Never publish a product until the exact product-level AliExpress Affiliate URL is verified.
- Keep request volume low and retry conservatively because the reference server relies on AliExpress web/internal endpoints.
- If MCP is unavailable or blocked, Product Intelligence must fail closed and the storefront remains unchanged.
