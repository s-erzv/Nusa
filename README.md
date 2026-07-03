<div align="center">
  <img src="public/nusa.png" alt="Nusa Logo" width="250" />
  <h1>Nusa</h1>
  <p><strong>Smart AI Financial Assistant via WhatsApp & Web Dashboard</strong></p>
</div>

<hr />

## 🌟 About Nusa

**Nusa** is a modern solution for managing personal and small business finances effortlessly. No need to open complex apps or manually fill out spreadsheets—simply send a chat message detailing your expenses or income to the Nusa WhatsApp bot. Powered by AI and Natural Language Processing (NLP), Nusa automatically extracts the amount, category, and context of your transaction.

Beyond the WhatsApp bot, Nusa provides a premium Web Dashboard (with full Light & Dark mode support) to visualize your financial data through charts, manage dynamic envelope budgeting, and intelligently track debts and receivables.

---

## 🚀 Key Features

- **📝 Chat-Based Tracking (AI-Powered)**
  Send a message like *"Had chicken soup for lunch for 25k using Jago wallet"*, and Nusa will automatically log it as an expense in your Jago wallet.
- **📊 Premium Web Dashboard**
  Monitor your cash flow, income/expense charts, and financial trends on a highly responsive, modern glassmorphism dashboard.
- **💼 Envelope Budgeting**
  Allocate your monthly funds into virtual envelopes (e.g., Electricity, Entertainment, Emergency). Nusa automatically deducts from the correct envelope whenever a relevant transaction occurs.
- **🤝 Smart Debt & Receivable Tracking**
  Log when a friend borrows money or repays an installment directly via WhatsApp. Nusa accurately tracks the remaining balances for you.
- **🌗 Dark & Light Mode**
  The Landing Page and Web Dashboard fully support seamless Dark and Light themes.

---

## 🛠️ Tech Stack

**Frontend:**
- [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (Build tool)
- [Tailwind CSS v4](https://tailwindcss.com/) (Styling & Dark Mode Variant)
- [Framer Motion](https://www.framer.com/motion/) (Animations & Interactions)
- [Lucide React](https://lucide.dev/) (Icons)

**Backend & Services:**
- [Supabase](https://supabase.com/) (PostgreSQL Database, Authentication, Row Level Security)
- [whatsapp-web.js](https://wwebjs.dev/) (WhatsApp Bot Integration via Puppeteer)
- [Groq AI (Llama 3)](https://groq.com/) (Natural Language Processing for financial parsing)
- [Node.js + Express / tsx](https://nodejs.org/) (Server environment)

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm or npm
- A Supabase account (for Database & Auth)
- A Groq API Key (for AI NLP parsing)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/username/nusa.git
   cd nusa
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env` or `.env.local` file in the root directory and add the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the Web Application (Frontend)**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:5173`.

5. **Run the WhatsApp Bot (Backend)**
   Open a new terminal window and run:
   ```bash
   pnpm dev:server
   ```
   *The terminal will display a QR Code. Scan this QR Code using the WhatsApp app (Linked Devices) to start the Nusa bot.*

---

## 🔐 Security & Privacy

Nusa is designed with privacy as a top priority. 
- WhatsApp messages are processed transiently and are strictly **not** used to train AI models (Zero Data Retention).
- Data is securely stored in Supabase with Row Level Security (RLS) protection, ensuring that your transaction data is **only accessible by you**.

---

<div align="center">
  <p>Crafted by <b>Nuza</b>.</p>
</div>
