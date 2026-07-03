import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import path from 'path';

// Ensure env variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY;

// Only initialize if we have the key to prevent immediate crashing on boot if missing
const groq = apiKey ? new Groq({ apiKey }) : null;

export interface FinanceAction {
  type: 'RECORD_TRANSACTION' | 'ANALYSIS_INQUIRY' | 'BALANCE_INQUIRY' | 'TRANSACTION_HISTORY' | 'INCOMPLETE_TRANSACTION' | 'DELETE_REQUEST' | 'EDIT_REQUEST' | 'TRANSFER' | 'ADD_WALLET' | 'WALLET_MANAGEMENT' | 'GENERAL_CHAT' | 'UPDATE_BALANCE' | 'ADD_ROUTINE_EXPENSE' | 'ADD_DEBT' | 'ADD_RECEIVABLE' | 'PAY_DEBT' | 'RECEIVE_DEBT_PAYMENT' | 'IDLE_CONFIRMATION';
  amount?: number;
  category?: string;
  description?: string;
  payment_method?: string;
  transaction_type?: 'income' | 'expense';
  mood?: string | null;
  walletName?: string | null;
  replyMessage?: string;
  editData?: any;
  fromWallet?: string;
  toWallet?: string;
  adminFee?: number | null;
  wallets?: any[];
  action?: 'remove' | 'rename';
  newName?: string | null;
  due_date_day?: number;
  person_name?: string;
}

export interface FinanceResponse {
  actions: FinanceAction[];
}

export const processFinanceChat = async (
  userId: string, 
  message: string, 
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<FinanceResponse | null> => {
  if (!groq) {
    console.error('Groq API Key is missing. Cannot process finance chat.');
    return null;
  }

  try {
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a financial tracking app called Nusa. You extract financial data from natural language and return ONLY raw JSON representing an array of actions. DO NOT use emojis. Speak casually in Indonesian ("aku"/"kamu").

CRITICAL TERMINOLOGY (DO NOT CONFUSE THEM):
- "Kantong" / "Budget": Is an allocation of funds or a Category of spending (e.g., Makan, Transport, Tagihan).
- "Dompet" / "Wallet" / "Rekening": Is the actual source of money/payment method (e.g., BCA, OVO, Gopay, Cash).

CRITICAL DISAMBIGUATION RULES:
- If user sends multiple intents in one message (e.g., "beli kopi 50k pake bca, terus utang ke budi 100k"), return multiple objects in the 'actions' array.
- If user is just confirming or saying "iya bener", "y", "betul", "oke", output type: "IDLE_CONFIRMATION" with a friendly reply (e.g., "Sip, sudah dicatat!"). DO NOT re-record the transaction.
- If user wants to reset or change the balance of a specific wallet (e.g., "reset saldo bsi jadi 300rb", "saldoku sisa 0"), output type: "UPDATE_BALANCE".
- If user mentions recurring payments like subscriptions, Netflix, utang bulanan, etc. (e.g., "subscription claude pro 350 ribu tiap tanggal 4"), output type: "ADD_ROUTINE_EXPENSE".
- If user says they owe someone money (e.g., "utang ke budi 50rb"), output type: "ADD_DEBT".
- If user says someone owes them money (e.g., "budi utang ke aku 50rb", "piutang 50rb ke andi"), output type: "ADD_RECEIVABLE".
- If user wants to delete/cancel the last transaction (e.g., "hapus transaksi", "apus"), output type: "DELETE_REQUEST".
- If user asks for transaction history (e.g., "lihat transaksi jago", "riwayat pengeluaran"), output type: "TRANSACTION_HISTORY" and extract the walletName if specified.
- If user asks for financial tips, analysis, or advice, output type: "ANALYSIS_INQUIRY".
- If user says they are paying a debt to someone (e.g., "bayar utang ke budi 20rb pake bca"), output type: "PAY_DEBT".
- If user says someone is paying their debt to the user (e.g., "budi bayar utang 20rb ke gopay"), output type: "RECEIVE_DEBT_PAYMENT".

CRITICAL NUMBER PARSING:
- ALWAYS convert shorthand into full numeric values. For example: "20 ribu" = 20000, "2 rb" = 2000, "50k" = 50000, "1 juta" = 1000000. DO NOT just return 20 for "20 ribu".

JSON OUTPUT FORMAT (Return exactly this JSON structure):
{
  "actions": [
    {
      "type": "RECORD_TRANSACTION",
      "amount": number,
      "category": string,
      "description": string,
      "payment_method": string,
      "transaction_type": "income" | "expense",
      "mood": string | null
    },
    {
      "type": "IDLE_CONFIRMATION",
      "replyMessage": "Sip, sudah dicatat!"
    },
    {
      "type": "UPDATE_BALANCE",
      "walletName": string,
      "amount": number
    },
    {
      "type": "ADD_ROUTINE_EXPENSE",
      "description": string,
      "amount": number,
      "due_date_day": number,
      "transaction_type": "expense" | "income"
    },
    {
      "type": "ADD_DEBT",
      "person_name": string,
      "amount": number
    },
    {
      "type": "ADD_RECEIVABLE",
      "person_name": string,
      "amount": number
    },
    {
      "type": "PAY_DEBT",
      "person_name": string,
      "amount": number,
      "walletName": string | null
    },
    {
      "type": "RECEIVE_DEBT_PAYMENT",
      "person_name": string,
      "amount": number,
      "walletName": string | null
    },
    {
      "type": "DELETE_REQUEST"
    },
    {
      "type": "INCOMPLETE_TRANSACTION",
      "replyMessage": "Tunggu, sepertinya ada info yang kurang (misalnya jumlah, untuk apa, atau pakai dompet apa)."
    },
    {
      "type": "BALANCE_INQUIRY",
      "walletName": string | null
    },
    {
      "type": "TRANSACTION_HISTORY",
      "walletName": string | null
    },
    {
      "type": "ANALYSIS_INQUIRY"
    },
    {
      "type": "GENERAL_CHAT",
      "replyMessage": string
    }
  ]
}

AUTO-CATEGORIZATION & MOOD RULES:
For RECORD_TRANSACTION, if the user doesn't explicitly state the category, guess the most appropriate standard category (e.g. "Makan" for Indomie/food). 
Also extract "mood" if they express feelings (e.g. "lapar", "impulsive"). If no mood, null.

Output only raw JSON. No markdown.`,
      },
    ];

    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: message });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    const data = JSON.parse(content);
    
    if (!data.actions || !Array.isArray(data.actions)) {
      return { actions: [{ type: 'GENERAL_CHAT', replyMessage: "Maaf, aku bingung membaca instruksinya." }] };
    }

    return { actions: data.actions };
  } catch (error) {
    console.error(`[Finance AI Error for User ${userId}]:`, error);
    return null;
  }
};

export const extractNumber = async (text: string): Promise<number | null> => {
  if (!groq) return null;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract numerical values from Indonesian natural language. 
Return exactly the number as JSON in this format: {"value": number}. 
If there is no number, return {"value": null}.
Example: "lima juta" -> {"value": 5000000}
Example: "500k" -> {"value": 500000}
Example: "sejuta setengah" -> {"value": 1500000}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return null;

    const data = JSON.parse(content);
    return typeof data.value === 'number' ? data.value : null;
  } catch (error) {
    console.error(`[AI Extract Number Error]:`, error);
    return null;
  }
};

export interface WalletInfo {
  name: string;
  type: string;
  balance: number;
  is_main?: boolean;
}

export const extractWallets = async (text: string): Promise<WalletInfo[]> => {
  if (!groq) return [];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract wallet or bank account information from Indonesian natural language.
Return a JSON array of objects in this exact format, under the key "wallets":
{
  "wallets": [
    {
      "name": "BCA", // Standardized name
      "type": "bank", // "cash", "bank", or "ewallet"
      "balance": 5000000, // Number, parsed from text
      "is_main": true // boolean, true if user implies this is main account for daily transactions
    }
  ]
}
If no wallet is found, return {"wallets": []}.
Example input: "aku ada bca 5 juta, gopay sisa 300rb, sama tunai 100 ribu"
Example output:
{
  "wallets": [
    { "name": "BCA", "type": "bank", "balance": 5000000, "is_main": true },
    { "name": "GoPay", "type": "ewallet", "balance": 300000, "is_main": false },
    { "name": "Tunai", "type": "cash", "balance": 100000, "is_main": false }
  ]
}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return [];

    const data = JSON.parse(content);
    return Array.isArray(data.wallets) ? data.wallets : [];
  } catch (error) {
    console.error(`[AI Extract Wallets Error]:`, error);
    return [];
  }
};

export interface IncomeInfo {
  amount: number | null;
  is_fixed: boolean | null;
  pay_date: number | null;
}

export const extractIncomeInfo = async (text: string): Promise<IncomeInfo | null> => {
  if (!groq) return null;
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract monthly income information from Indonesian natural language.
Return exactly this JSON format:
{
  "amount": 5000000, // The estimated monthly income amount (number) or null if unknown
  "is_fixed": true, // boolean: true if fixed salary, false if variable (freelance, business)
  "pay_date": 25 // integer 1-31, the typical payday date, or null if unknown
}
Output ONLY raw JSON. No markdown.`,
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.error(`[AI Extract Income Error]:`, error);
    return null;
  }
};

export interface RoutineExpense {
  description: string;
  amount: number;
  due_date_day: number;
  type: 'subscription' | 'debt' | 'insurance';
}

export const extractRoutineExpenses = async (text: string): Promise<RoutineExpense[]> => {
  if (!groq) return [];
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract routine monthly expenses (subscriptions, debts/installments, insurance, rent) from Indonesian natural language.
Return exactly this JSON format:
{
  "expenses": [
    { "description": "Netflix", "amount": 150000, "due_date_day": 5, "type": "subscription" },
    { "description": "KPR", "amount": 3000000, "due_date_day": 1, "type": "debt" },
    { "description": "BPJS", "amount": 150000, "due_date_day": 10, "type": "insurance" }
  ]
}
Rules for 'type': Use 'subscription' for netflix, rent/kos, spotify, etc. Use 'debt' for KPR, paylater, pinjol, cicilan. Use 'insurance' for BPJS, asuransi.
Rules for 'due_date_day': Must be integer 1-31. Default to 1 if unknown.
Output ONLY raw JSON. No markdown.`,
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.3-70b-versatile', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return [];
    const data = JSON.parse(content);
    return Array.isArray(data.expenses) ? data.expenses : [];
  } catch (error) {
    console.error(`[AI Extract Routine Expense Error]:`, error);
    return [];
  }
};

export interface EnvelopeBudget {
  category: string;
  amount: number;
}

export const extractEnvelopeBudgets = async (text: string): Promise<EnvelopeBudget[]> => {
  if (!groq) return [];
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract category budgets (Envelope Budgeting / Kantong) from Indonesian natural language.
Return exactly this JSON format:
{
  "budgets": [
    { "category": "Makan", "amount": 2000000 },
    { "category": "Transport", "amount": 500000 }
  ]
}
Output ONLY raw JSON. No markdown.`,
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return [];
    const data = JSON.parse(content);
    return Array.isArray(data.budgets) ? data.budgets : [];
  } catch (error) {
    console.error(`[AI Extract Budgets Error]:`, error);
    return [];
  }
};

export interface InvestmentInfo {
  type: string;
  value: number;
  notes: string;
}

export const extractInvestments = async (text: string): Promise<InvestmentInfo[]> => {
  if (!groq) return [];
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract investment portfolios from Indonesian natural language.
Return exactly this JSON format:
{
  "investments": [
    { "type": "Reksadana", "value": 5000000, "notes": "Bibit" },
    { "type": "Saham", "value": 10000000, "notes": "BBCA" }
  ]
}
Output ONLY raw JSON. No markdown.`,
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return [];
    const data = JSON.parse(content);
    return Array.isArray(data.investments) ? data.investments : [];
  } catch (error) {
    console.error(`[AI Extract Investments Error]:`, error);
    return [];
  }
};

export interface GoalInfo {
  name: string;
  target_amount: number;
  target_date: string | null;
}

export const extractGoals = async (text: string): Promise<GoalInfo[]> => {
  if (!groq) return [];
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You extract financial goals from Indonesian natural language.
Return exactly this JSON format:
{
  "goals": [
    { "name": "DP Rumah", "target_amount": 50000000, "target_date": "2027-12-31" }
  ]
}
If target_date is unknown, use null.
Output ONLY raw JSON. No markdown.`,
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) return [];
    const data = JSON.parse(content);
    return Array.isArray(data.goals) ? data.goals : [];
  } catch (error) {
    console.error(`[AI Extract Goals Error]:`, error);
    return [];
  }
};

export const analyzeFinances = async (
  userId: string,
  transactions: any[],
  wallets: any[]
): Promise<string> => {
  if (!groq) {
    return "Maaf, fitur AI belum dikonfigurasi. (Missing Groq API Key)";
  }
  try {
    const prompt = `You are a professional but casual financial advisor for the Nusa app. You speak in Indonesian, without any emojis.
You will be provided with the user's transactions and wallet balances. 
Provide a concise, insightful financial analysis. Highlight top spending categories, evaluate their remaining balance, and give a short practical tip. 
Keep it extremely brief, friendly, and under 2 short paragraphs. DO NOT output JSON. Output regular text.
Wallets: ${JSON.stringify(wallets)}\nTransactions: ${JSON.stringify(transactions)}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    return chatCompletion.choices[0]?.message?.content || "Analisis gagal.";
  } catch (error) {
    console.error('[AI Analysis Error]', error);
    return "Lagi ada gangguan teknis buat menganalisis. Coba lagi nanti ya.";
  }
};
