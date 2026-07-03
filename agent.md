# Nusa System Context

Nusa is a financial tracking application integrated with WhatsApp.

## System Architecture
- **Backend**: Node.js, Express, TypeScript (Vite/tsx for dev server)
- **AI Engine**: Groq (Llama models) for parsing natural language into structured financial data.
- **WhatsApp Integration**: `whatsapp-web.js` (Puppeteer-based)
- **Database**: PostgreSQL (Supabase)

## Database Schema Overview
The database uses Supabase. Here are the core tables:

- **profiles**: Linked to `auth.users`, storing `phone_number`, `monthly_budget`, `current_balance`, `income_amount`, `income_type`, etc.
- **whatsapp_otps** / **whatsapp_auth_sessions** / **otp_sessions** / **auth_requests**: WhatsApp authentication and session handling.
- **transactions**: Financial records (`amount`, `type`, `category`, `payment_method`, `description`).
- **wallets**: Stores user accounts/balances (e.g., BCA, Gopay, Cash) with `is_main` flag.
- **category_budgets**: Envelope budgeting limits per category.
- **routine_expenses**: Recurring expenses (`subscription`, `debt`, `insurance`) with `due_date_day`.
- **investments**: Portfolio tracking.
- **financial_goals**: Savings targets.
- **debts**: Tracking money owed to/by the user.

## AI Processing Pipeline
User messages from WhatsApp are routed to `financeAiService.ts`, which uses Groq (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`) to:
1. Parse intents into structured JSON actions (e.g., `RECORD_TRANSACTION`, `ADD_ROUTINE_EXPENSE`).
2. Extract specific entities (numbers, wallets, income, budgets, goals).
3. Generate natural language analysis of finances.

## Important Notes & Quirks
- **Number Parsing**: AI must explicitly be instructed to handle Indonesian shorthand like "20 ribu", "2 rb", "50k", or "1 juta" and convert them into full integers (`20000`, `2000`, `50000`, `1000000`) before returning JSON.
- **WhatsApp Web Hangs**: The WhatsApp client initialization may occasionally hang; it is recommended to test with `headless: false` during debugging or clear `.wwebjs_cache` if sessions get corrupted.
