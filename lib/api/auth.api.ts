import { http } from "@/lib/api/http";
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/types/auth";
import type { User } from "@/types/user";

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const payload: RefreshTokenRequest = {
      refreshToken,
    };

    const response = await http.post<RefreshTokenResponse>("/auth/refresh", payload);
    return response.data;
  },

  async logout(refreshToken: string): Promise<LogoutResponse> {
    const payload: LogoutRequest = {
      refreshToken,
    };

    const response = await http.post<LogoutResponse>("/auth/logout", payload);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await http.get<User>("/auth/me");
    return response.data;
  },
};

export default authApi;
