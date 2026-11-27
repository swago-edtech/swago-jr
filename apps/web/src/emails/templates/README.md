# Email templates (app)

## MSG91 paste-ready HTML (source of truth for new design)

See **`/templates/msg91/`** at the repo root:

- Variable templates: `templates/msg91/*.html`
- Browser previews: `templates/msg91/preview/*.html`
- Variable list + env keys: `templates/msg91/README.md`

Until `MSG91_TPL_*` env vars are set, sends still use the legacy wrapper `swagojr_order_confirmation2` with a rendered `html_body` (React Email components in this folder).

## Legacy React Email (fallback renderer)

| Component | Status | Purpose |
|-----------|--------|---------|
| `OrderConfirmation.tsx` | Active fallback | Customer confirmation |
| `OrderAdminNotification.tsx` | Active fallback | Admin new-order |
| `LowStockAlert.tsx` | Preview only | Low-stock (send lives in `@swago/database`) |
| `LotteryWinner.tsx` | Disabled send | Lottery win |
| `SwagoMoneyDeposit.tsx` | Disabled send | Manual wallet credit |

The `html/` folder holds older static previews and is not updated for the new design.
