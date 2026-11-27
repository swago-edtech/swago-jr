# MSG91 email templates

Email-safe HTML (tables + inline CSS) ready to paste into MSG91.

Logo: `https://swagojr.com/Swago_logo.png` (same asset as the live site navbar).

- Variable templates: files in this folder (`*.html`)
- Browser previews: open [`preview/index.html`](preview/index.html)
- Original design mocks (unchanged): parent folder `templates/*.html`

## Paste into MSG91

| File | Env var | Subject |
|------|---------|---------|
| `order-confirmation.html` | `MSG91_TPL_ORDER_CONFIRMATION` | `Your Swago Jr. Order #{{order_number}} has been confirmed!` |
| `admin-order.html` | `MSG91_TPL_ADMIN_ORDER` | `New Order on Swago! - Order ID: {{order_number}}` |
| `low-stock.html` | `MSG91_TPL_LOW_STOCK` | `Low stock alert — {{item_count}} inventory items need attention` |
| `lottery-winner.html` | `MSG91_TPL_LOTTERY_WINNER` | `You won the Swago Jr. Lottery!` |
| `swago-money-deposit.html` | `MSG91_TPL_SWAGO_MONEY` | `You just received Swago Money!` |

Until an env var is set, the app keeps sending via the legacy wrapper template `swagojr_order_confirmation2` with a full `html_body`.

### HTML variables (important)

These variables contain markup. In MSG91, mark them as **HTML** / do not escape them, or nested rows will show as raw text:

`items_html`, `stock_rows_html`, `discount_row`, `discounted_price_row`, `swago_money_row`, `you_saved_line`, `country_line`, `address_block`, `payment_status_badge`

## Variables

### order-confirmation

| Variable | Notes |
|----------|--------|
| `customer_name` | |
| `order_number` | |
| `order_date` | |
| `payment_status` | Plain text (Successful / Pending) |
| `payment_status_badge` | Full badge HTML (green or amber) |
| `payment_method` | e.g. Online (Razorpay) / Cash on Delivery |
| `item_count` | |
| `items_html` | Pre-built item rows |
| `currency_symbol` | `₹` or local symbol (e.g. `د.إ`) |
| `subtotal` | Amount without symbol |
| `discount_row` | Full `<tr>…</tr>` or empty |
| `discounted_price_row` | Full `<tr>…</tr>` or empty |
| `shipping_label` | `Shipping Fee` or `International Shipping` |
| `shipping_display` | `Free` or symbol + amount |
| `swago_money_row` | Full `<tr>…</tr>` or empty |
| `total_amount` | |
| `amount_label` | `Net Paid` or `Amount to Pay on Delivery` |
| `you_saved_line` | HTML paragraph or empty |
| `address_block` | Name + address HTML |

### admin-order

| Variable | Notes |
|----------|--------|
| `admin_url` | `https://admin.swagojr.com/orders/{id}` |
| `customer_name` | |
| `customer_email` | |
| `customer_phone` | |
| `item_count` | |
| `items_html` | Pre-built item rows (image when present; unit price) |
| `order_number` | |
| `order_date` | |
| `payment_method` | |
| `country_line` | `<tr>…</tr>` with country code, or empty for India |
| `currency_symbol` | |
| `subtotal` | |
| `discount_row` | or empty |
| `swago_money_row` | or empty |
| `shipping_display` | |
| `total_amount` | |

### low-stock

| Variable | Notes |
|----------|--------|
| `item_count` | |
| `stock_rows_html` | Pre-built `<tr>` rows |

### lottery-winner

| Variable | Notes |
|----------|--------|
| `customer_name` | |
| `prize_amount` | Number only; template prefixes `$` |
| `ticket_code` | |

### swago-money-deposit

| Variable | Notes |
|----------|--------|
| `customer_name` | |
| `deposit_amount` | Number only; template prefixes `$` |
| `deposit_reason` | |

## Static links (not variables)

- Orders: `https://swagojr.com/orders`
- Shop: `https://swagojr.com`
- Help: `https://swagojr.com/faq`
- Terms: `https://swagojr.com/terms`
- Support: `mailto:support@swagojr.com`
- Inventory: `https://admin.swagojr.com/inventory`
