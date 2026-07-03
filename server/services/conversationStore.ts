/**
 * In-memory conversation context store.
 * Stores the last N messages per user so the AI can understand multi-turn conversations.
 * Also stores a "pending action" so confirmations like "iya" can be resolved correctly.
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PendingAction {
  type: 'delete_transaction' | 'add_wallets' | 'edit_transaction';
  // For delete_transaction
  transactionId?: string;
  transactionDescription?: string;
  transactionAmount?: number;
  transactionPaymentMethod?: string;
  transactionType?: string;
  // For add_wallets
  wallets?: { name: string; type: string; balance: number }[];
  // For edit_transaction
  editTransactionId?: string;
  editField?: 'amount' | 'category' | 'payment_method';
  editNewValue?: string | number;
  editOldAmount?: number;
  editWalletName?: string;
  editTransactionType?: string;
  editConfirmMessage?: string;
  timestamp: number;
}

const MAX_HISTORY_PER_USER = 10;
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const PENDING_ACTION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const conversationStore = new Map<string, ChatMessage[]>();
const pendingActionStore = new Map<string, PendingAction>();

export const addUserMessage = (userId: string, content: string) => {
  cleanStaleMessages(userId);
  const history = conversationStore.get(userId) || [];
  history.push({ role: 'user', content, timestamp: Date.now() });
  if (history.length > MAX_HISTORY_PER_USER) {
    history.splice(0, history.length - MAX_HISTORY_PER_USER);
  }
  conversationStore.set(userId, history);
};

export const addAssistantMessage = (userId: string, content: string) => {
  const history = conversationStore.get(userId) || [];
  history.push({ role: 'assistant', content, timestamp: Date.now() });
  if (history.length > MAX_HISTORY_PER_USER) {
    history.splice(0, history.length - MAX_HISTORY_PER_USER);
  }
  conversationStore.set(userId, history);
};

export const getConversationHistory = (userId: string): { role: 'user' | 'assistant'; content: string }[] => {
  cleanStaleMessages(userId);
  const history = conversationStore.get(userId) || [];
  return history.map(({ role, content }) => ({ role, content }));
};

export const setPendingAction = (userId: string, action: Omit<PendingAction, 'timestamp'>) => {
  pendingActionStore.set(userId, { ...action, timestamp: Date.now() });
};

export const getPendingAction = (userId: string): PendingAction | null => {
  const action = pendingActionStore.get(userId);
  if (!action) return null;
  // Expire after 5 minutes
  if (Date.now() - action.timestamp > PENDING_ACTION_EXPIRY_MS) {
    pendingActionStore.delete(userId);
    return null;
  }
  return action;
};

export const clearPendingAction = (userId: string) => {
  pendingActionStore.delete(userId);
};

export const clearConversation = (userId: string) => {
  conversationStore.delete(userId);
  pendingActionStore.delete(userId);
};

// Detect if text is a confirmation
export const isConfirmation = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  return ['iya', 'ya', 'yep', 'yap', 'yes', 'oke', 'ok', 'sip', 'boleh', 'setuju', 'yoi', 'yup', 'gas', 'lanjut'].some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w));
};

// Detect if text is a rejection
export const isRejection = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  return ['gak', 'ga', 'tidak', 'enggak', 'nggak', 'jangan', 'batal', 'cancel', 'no', 'nope'].some(w => lower === w || lower.startsWith(w + ' '));
};

const cleanStaleMessages = (userId: string) => {
  const history = conversationStore.get(userId);
  if (!history) return;
  
  const cutoff = Date.now() - CONTEXT_EXPIRY_MS;
  const filtered = history.filter(m => m.timestamp > cutoff);
  
  if (filtered.length === 0) {
    conversationStore.delete(userId);
  } else {
    conversationStore.set(userId, filtered);
  }
};
