# Integration Audit Events

## علاش هاد المرحلة؟

Audit Events كيسجلو شنو وقع فكل محاولة استعمال لأداة: شكون طلب، شنو capability، شنو adapter اختار، واش تقبل أو ترفض، وشنو خاص يتدار من بعد. هادشي كيعطي traceability وكيعاون QA وSelf-Healing.

## Event types

- `adapter_rejected`
- `adapter_execution`
- `verification_passed`
- `verification_failed`
- `self_healing_plan`
- `approval_requested`
- `approval_granted`
- `approval_denied`

## Required metadata

`event_id`, `timestamp`, `task_id/request_id`, `agent_id` when available, `event_type`, `status`, and safe evidence references.

Never store passwords, tokens, API keys, private keys, or raw credentials in events.

## Lifecycle

`request → gateway validation → authorization → adapter execution → event → verification → final outcome`
