// API Wrapper with Mock Data Interceptor

import type {
  MeatAnalysisResult,
  FridgeItem,
  Recipe,
  PriceData,
} from "@/constants/mockData";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  FridgeListResponse,
  FridgeItemResponse,
  FridgeItemAdd,
  FridgeStatusUpdate,
  AIAnalyzeResponse,
  LLMRecipeRequest,
  LLMRecipeResponse,
} from "@/types/api";

// Environment variables
const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:8000";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"; // Default to false - 실전 모드

// JWT Token management
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_nickname");
  }
};

export const getAuthNickname = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_nickname");
};

export const setAuthNickname = (nickname: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_nickname", nickname);
  }
};

// Generic API call function
interface ApiCallOptions {
  isAiServer?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  isMultipart?: boolean;
}

export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { isAiServer = false, method = "GET", body, headers = {}, isMultipart = false } = options;
  const baseUrl = isAiServer ? AI_SERVER_URL : BACKEND_URL;
  const url = `${baseUrl}${endpoint}`;

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add content type for JSON (unless multipart)
  if (body && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isMultipart ? body : (body ? JSON.stringify(body) : undefined),
    });

    // Handle token expiration (401) - 일부 엔드포인트는 게스트 접근 허용
    if (response.status === 401) {
      // 냉장고 목록 같은 경우는 게스트도 접근 가능하므로 빈 데이터 반환
      if (endpoint.includes("/fridge/list")) {
        return { items: [] } as T;
      }
      // 다른 엔드포인트는 인증 필요
      removeAuthToken();
      if (typeof window !== "undefined") {
        // 로그인 페이지로 리다이렉트하지 않고, 에러만 던짐 (게스트 모드 지원)
        console.warn("인증 토큰이 없거나 만료되었습니다. 게스트 모드로 계속 진행합니다.");
      }
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
}

// Mock Data Interceptor - Returns mock data if USE_MOCK_DATA is true or API fails
async function apiCallWithMock<T>(
  endpoint: string,
  mockData: T,
  options: ApiCallOptions = {}
): Promise<T> {
  if (USE_MOCK_DATA) {
    console.log(`[Mock Mode] Returning mock data for: ${endpoint}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockData;
  }

  try {
    return await apiCall<T>(endpoint, options);
  } catch (error) {
    console.warn(`[Fallback to Mock] API call failed for: ${endpoint}`, error);
    return mockData;
  }
}

// API Methods

// Auth APIs
export const signup = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const result = await apiCall<RegisterResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: data,
  });
  setAuthToken(result.token);
  return result;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const result = await apiCall<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: data,
  });
  setAuthToken(result.token);
  setAuthNickname(result.nickname);
  return result;
};

export const logout = (): void => {
  removeAuthToken();
};

// Analysis APIs (AI Server)
export const analyzeImage = async (
  imageFile: File,
  mode: "vision" | "ocr" = "vision",
  autoAddFridge: boolean = false
): Promise<AIAnalyzeResponse> => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("mode", mode);
  formData.append("auto_add_fridge", String(autoAddFridge));

  return await apiCall<AIAnalyzeResponse>("/api/analyze", {
    method: "POST",
    body: formData,
    isMultipart: true,
  });
};

// Fridge APIs (Backend)
export const getFridgeItems = async (): Promise<FridgeListResponse> => {
  try {
    return await apiCall<FridgeListResponse>("/api/v1/fridge/list");
  } catch (error: any) {
    console.error(`API call failed for: /api/v1/fridge/list`, error);
    // 에러 발생 시 빈 리스트 반환
    return { items: [] };
  }
};

export const addFridgeItem = async (item: FridgeItemAdd): Promise<{ id: number; status: string; alertScheduled: boolean }> => {
  return await apiCall<{ id: number; status: string; alertScheduled: boolean }>("/api/v1/fridge/item", {
    method: "POST",
    body: item,
  });
};

export const updateFridgeItemStatus = async (
  itemId: number,
  status: "stored" | "consumed"
): Promise<{ success: boolean; status: string }> => {
  return await apiCall<{ success: boolean; status: string }>(`/api/v1/fridge/${itemId}/status`, {
    method: "PATCH",
    body: { status } as FridgeStatusUpdate,
  });
};

export const deleteFridgeItem = async (itemId: number): Promise<void> => {
  await apiCall(`/api/v1/fridge/${itemId}`, {
    method: "DELETE",
  });
};

// Recipe APIs (Backend) - 실제 API 구현 시 활성화
export const getRecipes = async (meatType?: string): Promise<Recipe[]> => {
  // TODO: 실제 레시피 API 구현
  return [];
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  // TODO: 실제 레시피 API 구현
  return null;
};

// LLM Recipe Generation (Backend + LLM)
export const generateRecipeWithLLM = async (
  fridgeItems: Array<{ partName: string; name: string }>
): Promise<string> => {
  const response = await apiCall<LLMRecipeResponse>("/api/v1/ai/recipe", {
    method: "POST",
    body: { fridgeItems } as LLMRecipeRequest,
  });
  return response.recipe;
};

// Analysis History APIs - 실제 API 구현 시 활성화
export const getAnalysisHistory = async (): Promise<MeatAnalysisResult[]> => {
  // TODO: 실제 분석 이력 API 구현
  return [];
};

// Price Data APIs - 실제 API 구현 시 활성화
export const getPriceData = async (): Promise<PriceData[]> => {
  // TODO: 실제 가격 데이터 API 구현
  return [];
};

// Meat Facts APIs - 실제 API 구현 시 활성화
export const getRandomMeatFact = async (): Promise<{ title: string; content: string }> => {
  // TODO: 실제 고기 상식 API 구현
  return { title: "", content: "" };
};

// User/Guest APIs
export const createGuestSession = async (nickname: string): Promise<{ token: string; nickname: string; isGuest: boolean }> => {
  // localStorage에서 guest_id 가져오기 또는 생성
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("guest_id", guestId);
  }
  
  try {
    const result = await apiCall<{ token: string; nickname: string; isGuest: boolean }>("/api/v1/auth/guest", {
      method: "POST",
      body: {
        browserSessionId: guestId,
        nickname,
      },
    });
    
    // Store token
    setAuthToken(result.token);
    setAuthNickname(result.nickname);
    
    return result;
  } catch (error: any) {
    console.error("Failed to create guest session:", error);
    // Fallback: 로컬 세션 생성
    const fallbackToken = `guest_${Date.now()}`;
    setAuthToken(fallbackToken);
    setAuthNickname(nickname);
    return {
      token: fallbackToken,
      nickname,
      isGuest: true,
    };
  }
};

export const getGuestNickname = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("guest_nickname");
};

export const setGuestNickname = (nickname: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("guest_nickname", nickname);
  }
};

