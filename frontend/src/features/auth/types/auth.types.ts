export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accountPendingDeletion: boolean;
  deletionRemainingDays: number | null;
}

export interface AuthError {
  statusCode: number;
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface WithdrawResponse {
  message: string;
}

export interface RestoreResponse {
  message: string;
}
