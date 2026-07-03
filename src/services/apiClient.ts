const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RequestOtpResponse {
  success: boolean;
  message?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
}

export const requestOtp = async (phone: string): Promise<RequestOtpResponse> => {
  const response = await fetch(`${API_BASE}/api/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to request OTP');
  }
  
  return response.json();
};

export const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to verify OTP');
  }
  
  return response.json();
};
