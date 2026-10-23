#!/usr/bin/env bash
# A small app without pod: billing, search, and auth. A doc in the repo gives the reason billing uses cents.
set -e
git init -q -b main
mkdir -p src/billing src/search src/auth docs/decisions
cat > src/server.js <<'JS'
const { login } = require('./auth/login')
const { createInvoice } = require('./billing/invoice')
const { searchIndex } = require('./search/index')
module.exports = { routes: { 'POST /login': login, 'POST /invoices': createInvoice, 'GET /search': searchIndex } }
JS
cat > src/billing/invoice.js <<'JS'
const { charge } = require('./charge')
// Amounts are integer cents, never floats.
function createInvoice(user, items) {
  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
  const invoice = { userId: user.id, totalCents, status: 'open' }
  return charge(invoice)
}
module.exports = { createInvoice }
JS
cat > src/billing/charge.js <<'JS'
const stripe = require('./stripe-client')
// Idempotency key so a retried request never charges twice.
async function charge(invoice) {
  await stripe.charges.create({ amount: invoice.totalCents, idempotencyKey: `inv-${invoice.userId}-${invoice.totalCents}` })
  return { ...invoice, status: 'paid' }
}
module.exports = { charge }
JS
printf 'module.exports = { charges: { create: async () => ({}) } }\n' > src/billing/stripe-client.js
printf 'function searchIndex(q) { return [] }\nmodule.exports = { searchIndex }\n' > src/search/index.js
printf 'function login(user) { return { token: "t" } }\nmodule.exports = { login }\n' > src/auth/login.js
cat > docs/decisions/0001-money-in-cents.md <<'MD'
# 1. Store money as integer cents

Date: 2026-03-02

We stored prices as floats and lost a cent on some invoices (0.1 + 0.2). From now on every amount is an integer number of cents, and only the UI formats it as dollars.
MD
printf '# Shop API\n\nA small shop API: sign in, search products, and pay invoices.\n' > README.md
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
