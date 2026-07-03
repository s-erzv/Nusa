import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import path from 'path';

// Ensure env variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY;

// Only initialize if we have the key to prevent immediate crashing on boot if missing
const groq = apiKey ? new Groq({ apiKey }) : null;

export interface FinanceResponse {
  isFinanceRecord: boolean;
  isComplete?: boolean;
  isBalanceInquiry?: boolean;
  isAnalysisInquiry?: boolean;
  data?: {
    amount: number;
    category: string;
    description: string;
    payment_method: string;
    type: 'income' | 'expense';
  };
  replyMessage?: string;
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
    // Build messages array with conversation history for context
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a financial tracking app called Nusa. You extract financial data from natural language and return it strictly as JSON. DO NOT use any emojis in your reply messages. Speak casually and naturally in Indonesian like a friend (e.g., use "aku" and "kamu").

IMPORTANT: You will receive previous conversation messages for context. Use them to understand follow-up answers. For example, if the previous exchange was about buying coffee and the user now just says "BCA", understand that they are answering the payment method question.

Classify the user's message into ONE of these intents:

1. ANALYSIS INQUIRY - user asks to analyze expenses/finances/report:
{"isFinanceRecord": false, "isAnalysisInquiry": true}

2. BALANCE INQUIRY - user asks about balance (optionally for a specific wallet):
{"isFinanceRecord": false, "isBalanceInquiry": true, "walletName": string | null}
(walletName is null for total balance, or e.g. "BCA" for specific wallet)

3. INCOMPLETE TRANSACTION - financial transaction with missing info (amount, purpose, OR payment method):
{"isFinanceRecord": true, "isComplete": false, "replyMessage": string}

4. COMPLETE TRANSACTION - all info present (amount, category, payment method, type):
{"isFinanceRecord": true, "isComplete": true, "amount": number, "category": string, "description": string, "payment_method": string, "type": "income" | "expense"}

5. DELETE TRANSACTION - user wants to delete/undo/cancel last or a specific transaction:
{"isFinanceRecord": false, "isDeleteRequest": true, "replyMessage": string}
(replyMessage should confirm what they want to delete, e.g. "Kamu mau hapus transaksi terakhir ya?")

6. EDIT TRANSACTION - user wants to edit/correct a previous transaction:
{"isFinanceRecord": false, "isEditRequest": true, "editData": {"field": "amount" | "category" | "payment_method", "newValue": string | number}, "replyMessage": string}

7. TRANSFER BETWEEN WALLETS - user moves money between their own wallets:
{"isFinanceRecord": false, "isTransfer": true, "fromWallet": string, "toWallet": string, "amount": number}

8. WALLET MANAGEMENT - user wants to add, remove, or rename a wallet:
{"isFinanceRecord": false, "isWalletManagement": true, "action": "add" | "remove" | "rename", "walletName": string, "walletType": "cash" | "bank" | "ewallet", "newName": string | null, "balance": number | null}

9. GENERAL CHAT - not financial at all:
{"isFinanceRecord": false, "isBalanceInquiry": false, "isAnalysisInquiry": false, "replyMessage": string}

Do not output any markdown formatting, only raw JSON. No emojis.`,
      },
    ];

    // Add conversation history for context
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant', 
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    const data = JSON.parse(content);

    // Pass through the raw parsed data with all fields
    // The listener will handle each intent type
    
    // Non-finance intents: pass through all flags
    if (!data.isFinanceRecord) {
      return {
        isFinanceRecord: false,
        isBalanceInquiry: data.isBalanceInquiry || false,
        isAnalysisInquiry: data.isAnalysisInquiry || false,
        replyMessage: data.replyMessage,
        // New intent fields - passed through as raw data
        ...data,
      } as any;
    }

    // Incomplete financial record
    if (data.isFinanceRecord && !data.isComplete) {
      return {
        isFinanceRecord: true,
        isComplete: false,
        replyMessage: data.replyMessage || "Bisa diperjelas lagi detail transaksinya?"
      };
    }

    // Complete financial record - strict validation
    if (
      typeof data.amount !== 'number' || 
      typeof data.category !== 'string' || 
      typeof data.description !== 'string' ||
      typeof data.payment_method !== 'string' ||
      !['income', 'expense'].includes(data.type)
    ) {
      throw new Error('Invalid JSON structure returned by Groq for a valid transaction');
    }

    return {
      isFinanceRecord: true,
      isComplete: true,
      data: {
        amount: data.amount,
        category: data.category,
        description: data.description,
        payment_method: data.payment_method,
        type: data.type
      }
    };
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
      "balance": 5000000 // Number, parsed from text
    }
  ]
}
If no wallet is found, return {"wallets": []}.
Example input: "aku ada bca 5 juta, gopay sisa 300rb, sama tunai 100 ribu"
Example output:
{
  "wallets": [
    { "name": "BCA", "type": "bank", "balance": 5000000 },
    { "name": "GoPay", "type": "ewallet", "balance": 300000 },
    { "name": "Tunai", "type": "cash", "balance": 100000 }
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

export const analyzeFinances = async (userId: string, transactions: any[], wallets: any[]): Promise<string> => {
  if (!groq) return "Maaf, fitur analisis AI sedang tidak tersedia.";
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional but casual financial advisor for the Nusa app. You speak in Indonesian, without any emojis.
You will be provided with the user's transactions and wallet balances. 
Provide a concise, insightful financial analysis. Highlight top spending categories, evaluate their remaining balance, and give a short practical tip. 
Keep it under 3 paragraphs. DO NOT output JSON. Output regular text.`,
        },
        {
          role: 'user',
          content: `Wallets: ${JSON.stringify(wallets)}\nTransactions: ${JSON.stringify(transactions)}`,
        },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.5,
    });

    return chatCompletion.choices[0]?.message?.content || "Analisis gagal dibuat.";
  } catch (error) {
    console.error(`[AI Analysis Error]:`, error);
    return "Maaf, terjadi kesalahan saat menganalisis datamu.";
  }
};
