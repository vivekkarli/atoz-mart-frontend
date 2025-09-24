export interface ErrorResponse {
  errorMsg: string;
  errorCode: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  mail: string;
  mobileNo: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}