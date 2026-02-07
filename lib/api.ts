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
  FridgeItemFromTraceabilityAdd,
  FridgeStatusUpdate,
  AIAnalyzeResponse,
  TraceabilityInfo,
  LLMRecipeRequest,
  LLMRecipeResponse,
  PopularCutsResponse,
  DashboardPricesResponse,
  PriceHistoryResponse,
} from "@/src/types/api";

// Environment variables
// 동적 백엔드 URL 감지: 모바일에서 접속 시 현재 호스트의 IP 사용
const getBackendUrl = (): string => {
  // 환경 변수가 설정되어 있으면 우선 사용
  if (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  }
  
  // 브라우저 환경에서만 동적 감지
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // localhost나 127.0.0.1이 아니면 (모바일 등) 같은 호스트의 8000 포트 사용
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8000`;
    }
  }
  
  return "http://localhost:8000";
};

const AI_SERVER_URL =
  process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:8001";
const BACKEND_URL = getBackendUrl();
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"; // Default to false - 실전 모드

// 백엔드 URL 로깅 (개발 환경)
if (typeof window !== "undefined") {
  console.log("🔧 [BACKEND URL]:", BACKEND_URL, "| Current hostname:", window.location.hostname);
}

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
    localStorage.removeItem("is_guest");
    localStorage.removeItem("guest_nickname");
  }
};

export const getIsGuest = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("is_guest") === "true";
};

export const setIsGuest = (value: boolean): void => {
  if (typeof window !== "undefined") {
    if (value) localStorage.setItem("is_guest", "true");
    else localStorage.removeItem("is_guest");
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
  const {
    isAiServer = false,
    method = "GET",
    body,
    headers = {},
    isMultipart = false,
  } = options;
  const baseUrl = isAiServer ? AI_SERVER_URL : BACKEND_URL;
  const url = `${baseUrl}${endpoint}`;

  // 강력한 로깅: API 요청 시작
  console.log("📡 [API REQUEST]: ", endpoint, options);

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
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
      });
    } catch (fetchError: any) {
      // 네트워크 에러 (연결 실패, CORS, 타임아웃 등)
      console.error(`❌ [NETWORK ERROR]: ${url}`, fetchError);
      const errorMessage = fetchError.message || "네트워크 연결에 실패했습니다.";
      
      // 모바일에서 localhost 접근 시도 감지
      if (url.includes("localhost") && typeof window !== "undefined" && window.location.hostname !== "localhost") {
        throw new Error(
          `백엔드 서버에 연결할 수 없습니다. ` +
          `모바일에서 접속 시 백엔드 서버가 같은 네트워크에 있어야 하며, ` +
          `백엔드가 ${window.location.hostname}:8000에서 실행 중인지 확인해주세요.`
        );
      }
      
      throw new Error(`${errorMessage} (URL: ${url})`);
    }

    // Handle token expiration (401) - 일부 엔드포인트는 게스트 접근 허용
    if (response.status === 401) {
      console.error(
        `[API ERROR] ${endpoint} - status: 401, message: 인증 토큰이 없거나 만료되었습니다.`
      );
      // 냉장고 목록 같은 경우는 게스트도 접근 가능하므로 빈 데이터 반환
      if (endpoint.includes("/fridge/list")) {
        return { items: [] } as T;
      }
      // 다른 엔드포인트는 인증 필요
      removeAuthToken();
      if (typeof window !== "undefined") {
        // 로그인 페이지로 리다이렉트하지 않고, 에러만 던짐 (게스트 모드 지원)
        console.warn(
          "인증 토큰이 없거나 만료되었습니다. 게스트 모드로 계속 진행합니다."
        );
      }
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      const errorMessage =
        errorData.detail ||
        `API Error: ${response.status} ${response.statusText}`;
      console.error(
        `❌ [API RESPONSE ERROR]: status: ${response.status}, message: ${errorMessage}`
      );
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`✅ [API RESPONSE SUCCESS]: ${endpoint}`, result);
    return result;
  } catch (error: any) {
    console.error(
      `❌ [API RESPONSE ERROR]: status: ${
        error.status || "NETWORK_ERROR"
      }, message: ${error.message || error}`
    );
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
export const signup = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
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

  // 게스트 모드: localStorage에서 guest_id 가져오기
  if (typeof window !== "undefined") {
    const guestId = localStorage.getItem("guest_id");
    if (guestId) {
      formData.append("guest_id", guestId);
    }
  }

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

export const addFridgeItem = async (
  item: FridgeItemAdd
): Promise<{ id: number; status: string; alertScheduled: boolean }> => {
  return await apiCall<{ id: number; status: string; alertScheduled: boolean }>(
    "/api/v1/fridge/item",
    {
      method: "POST",
      body: item,
    }
  );
};

export const addFridgeItemFromTraceability = async (
  item: FridgeItemFromTraceabilityAdd
): Promise<{ id: number; status: string; alertScheduled: boolean }> => {
  return await apiCall<{ id: number; status: string; alertScheduled: boolean }>(
    "/api/v1/fridge/item-from-traceability",
    {
      method: "POST",
      body: item,
    }
  );
};

export const updateFridgeItemStatus = async (
  itemId: number,
  status: "stored" | "consumed"
): Promise<{ success: boolean; status: string }> => {
  return await apiCall<{ success: boolean; status: string }>(
    `/api/v1/fridge/${itemId}/status`,
    {
      method: "PATCH",
      body: { status } as FridgeStatusUpdate,
    }
  );
};

export const deleteFridgeItem = async (itemId: number): Promise<void> => {
  await apiCall(`/api/v1/fridge/${itemId}`, {
    method: "DELETE",
  });
};

export const updateFridgeItem = async (
  itemId: number,
  data: { meatInfoId?: number; desiredConsumptionDate?: string | null }
): Promise<{
  success: boolean;
  id: number;
  meatInfoId: number;
  desiredConsumptionDate: string | null;
  name: string;
}> => {
  return await apiCall<{
    success: boolean;
    id: number;
    meatInfoId: number;
    desiredConsumptionDate: string | null;
    name: string;
  }>(`/api/v1/fridge/${itemId}`, {
    method: "PATCH",
    body: data,
  });
};

// 고기 부위 목록 조회
export const getMeatInfoList = async (
  category?: string
): Promise<
  Array<{
    id: number;
    name: string;
    category: string;
    calories: number | null;
    protein: number | null;
    fat: number | null;
    storageGuide: string | null;
  }>
> => {
  let url = "/api/v1/meat/info/list";
  if (category) {
    url += `?category=${encodeURIComponent(category)}`;
  }
  return await apiCall<
    Array<{
      id: number;
      name: string;
      category: string;
      calories: number | null;
      protein: number | null;
      fat: number | null;
      storageGuide: string | null;
    }>
  >(url);
};

// 영양정보 조회 (부위명과 등급 기반)
export const getNutritionInfo = async (
  partName: string,
  grade?: string | null
): Promise<{
  by_grade: Array<{
    grade: string;
    nutrition: {
      calories: number | null;
      protein: number | null;
      fat: number | null;
      carbohydrate: number | null;
      grade?: string;
      subpart?: string;
      source?: string;
    };
    by_subpart?: Array<{
      subpart: string;
      nutrition: {
        calories: number | null;
        protein: number | null;
        fat: number | null;
        carbohydrate: number | null;
      };
    }>;
  }>;
  default: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbohydrate: number | null;
    grade?: string;
    subpart?: string;
    source?: string;
  };
}> => {
  let url = `/api/v1/meat/nutrition?part_name=${encodeURIComponent(partName)}`;
  if (grade) {
    url += `&grade=${encodeURIComponent(grade)}`;
  }
  return await apiCall(url);
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

// 묶음번호 여부 (A + 19~29자리 숫자, 백엔드 로직과 일치)
export function isBundleNumber(number: string): boolean {
  const t = (number || "").trim();
  // 백엔드: A + 19~29자리 숫자
  return (
    t.length >= 20 && t.length <= 30 && t[0] === "A" && /^\d+$/.test(t.slice(1))
  );
}

// 이력번호/묶음번호로 이력제 조회 (단건 — 묶음이면 첫 건)
export const getTraceabilityByNumber = async (
  number: string,
  source?: "import" | "domestic"
): Promise<TraceabilityInfo> => {
  const trimmed = (number || "").trim();
  if (!trimmed) {
    throw new Error("이력번호 또는 묶음번호를 입력해 주세요.");
  }
  let url = `/api/v1/meat/traceability?number=${encodeURIComponent(trimmed)}`;
  if (source) {
    url += `&source=${encodeURIComponent(source)}`;
  }
  return await apiCall<TraceabilityInfo>(url);
};

// 수입육 묶음번호로 이력 목록 조회 (클릭 시 getTraceabilityByNumber(이력번호)로 상세)
export const getTraceabilityBundleList = async (
  number: string
): Promise<TraceabilityInfo[]> => {
  const trimmed = (number || "").trim();
  if (!trimmed) {
    throw new Error("묶음번호를 입력해 주세요.");
  }
  return await apiCall<TraceabilityInfo[]>(
    `/api/v1/meat/traceability/bundle?number=${encodeURIComponent(trimmed)}`
  );
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
export const getRandomMeatFact = async (): Promise<{
  title: string;
  content: string;
}> => {
  // TODO: 실제 고기 상식 API 구현
  return { title: "", content: "" };
};

// User/Guest APIs
export const createGuestSession = async (
  nickname: string
): Promise<{ token: string; nickname: string; isGuest: boolean }> => {
  // localStorage에서 guest_id 가져오기 또는 생성 (UUID 형식)
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    // UUID v4 형식으로 생성
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
    guestId = uuid;
    localStorage.setItem("guest_id", guestId);
  }

  try {
    const result = await apiCall<{
      token: string;
      nickname: string;
      isGuest: boolean;
    }>("/api/v1/auth/guest", {
      method: "POST",
      body: {
        browserSessionId: guestId,
        nickname,
      },
    });

    setAuthToken(result.token);
    setAuthNickname(result.nickname);
    setIsGuest(true);

    return result;
  } catch (error: any) {
    console.error("Failed to create guest session:", error);
    const fallbackToken = `guest_${Date.now()}`;
    setAuthToken(fallbackToken);
    setAuthNickname(nickname);
    setIsGuest(true);
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

// Dashboard API
export const getPopularCuts = async (
  limit: number = 5
): Promise<PopularCutsResponse> => {
  return apiCall<PopularCutsResponse>(
    `/api/dashboard/popular-cuts?limit=${limit}`,
    {
      method: "GET",
    }
  );
};

export const getDashboardPrices = async (
  region?: string,
  beefPart?: string,
  porkPart?: string,
  gradeCode?: string
): Promise<DashboardPricesResponse> => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (beefPart) params.append("beef_part", beefPart);
  if (porkPart) params.append("pork_part", porkPart);
  if (gradeCode) params.append("grade_code", gradeCode);

  const queryString = params.toString();
  const url = `/api/dashboard/prices${queryString ? `?${queryString}` : ""}`;

  return apiCall<DashboardPricesResponse>(url, {
    method: "GET",
  });
};

/** 주별 가격 변동 (그래프용). KAMIS periodProductList(p_startday/p_endday) 연동. */
export const getDashboardPriceHistory = async (
  region?: string,
  beefPart?: string,
  porkPart?: string,
  gradeCode?: string,
  weeks: number = 6
): Promise<PriceHistoryResponse> => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (beefPart) params.append("beef_part", beefPart);
  if (porkPart) params.append("pork_part", porkPart);
  if (gradeCode) params.append("grade_code", gradeCode);
  params.set("weeks", String(weeks));

  const url = `/api/dashboard/prices/history?${params.toString()}`;
  return apiCall<PriceHistoryResponse>(url, { method: "GET" });
};

/** 월별 가격 API(KAMIS monthlyPriceTrendList) 연결 확인 */
export const getDashboardPriceHistoryCheck = async (): Promise<{
  connected: boolean;
  message: string;
}> => {
  return apiCall<{ connected: boolean; message: string }>(
    "/api/dashboard/prices/history/check",
    { method: "GET" }
  );
};
