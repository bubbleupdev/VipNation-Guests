export interface ILoginResult {
  result: string;
  error: string;
  token: IUserAuth;
}

export interface IUserAuth {
  name: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: string;
}
