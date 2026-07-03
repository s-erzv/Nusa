const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface InitiateLoginResponse {
  success: boolean;
  loginCode?: string;
  message?: string;
}

export interface LoginStatusResponse {
  success: boolean;
  status: 'pending' | 'verified' | 'expired';
  session?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
}

export interface BotInfoResponse {
  success: boolean;
  phone?: string;
  message?: string;
}

export const initiateLogin = async (): Promise<InitiateLoginResponse> => {
  const response = await fetch(`${API_BASE}/api/auth/initiate-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to initiate login');
  }
  
  return response.json();
};

export const checkLoginStatus = async (code: string): Promise<LoginStatusResponse> => {
  const response = await fetch(`${API_BASE}/api/auth/login-status/${code}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to check login status');
  }
  
  return response.json();
};

export const getBotInfo = async (): Promise<BotInfoResponse> => {
  const response = await fetch(`${API_BASE}/api/auth/bot-info`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to get bot info');
  }
  
  return response.json();
};
