# AliExpress API contract

The adapter targets the documented Omkar Cloud endpoints:

- `GET /aliexpress/search` with `query` and optional `page`
- `GET /aliexpress/product` with `product_id`

Keep API credentials in runtime secrets; never commit the API key.
