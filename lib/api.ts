// API Wrapper with Mock Data Interceptor

import {
  mockAnalysisResults,
  mockFridgeItems,
  mockRecipes,
  mockPriceData,
  mockMeatFacts,
  type MeatAnalysisResult,
  type FridgeItem,
  type Recipe,
  type PriceData,
} from "@/constants/mockData";

// Environment variables
const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:8000";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false"; // Default to true

// JWT Token management
const getAuthToken = (): string | null => {
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
  }
};

// Generic API call function
interface ApiCallOptions {
  isAiServer?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const { isAiServer = false, method = "GET", body, headers = {} } = options;
  const baseUrl = isAiServer ? AI_SERVER_URL : BACKEND_URL;
  const url = `${baseUrl}${endpoint}`;

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add content type for JSON
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

// Analysis APIs (AI Server)
export const analyzeImage = async (
  imageData: string,
  mode: "vision" | "ocr"
): Promise<MeatAnalysisResult> => {
  const mockResult: MeatAnalysisResult = {
    id: Date.now().toString(),
    partName: mode === "vision" ? "한우 등심" : "이력번호: 123456789012",
    confidence: 0.94,
    timestamp: new Date(),
    origin: "국내산 한우",
    grade: "1++",
    gradCAM: "/placeholder.jpg", // Mock heatmap
  };

  return await apiCallWithMock(
    `/api/analyze/${mode}`,
    mockResult,
    {
      isAiServer: true,
      method: "POST",
      body: { image: imageData },
    }
  );
};

// Fridge APIs (Backend)
export const getFridgeItems = async (): Promise<FridgeItem[]> => {
  return await apiCallWithMock("/api/fridge", mockFridgeItems);
};

export const addFridgeItem = async (item: Omit<FridgeItem, "id">): Promise<FridgeItem> => {
  const newItem: FridgeItem = {
    ...item,
    id: Date.now().toString(),
  };
  return await apiCallWithMock("/api/fridge", newItem, {
    method: "POST",
    body: item,
  });
};

export const updateFridgeItem = async (
  id: string,
  updates: Partial<FridgeItem>
): Promise<FridgeItem> => {
  const updated = mockFridgeItems.find((item) => item.id === id);
  return await apiCallWithMock(`/api/fridge/${id}`, { ...updated, ...updates }, {
    method: "PUT",
    body: updates,
  });
};

export const deleteFridgeItem = async (id: string): Promise<void> => {
  return await apiCallWithMock(`/api/fridge/${id}`, undefined, {
    method: "DELETE",
  });
};

// Recipe APIs (Backend)
export const getRecipes = async (meatType?: string): Promise<Recipe[]> => {
  const filtered = meatType
    ? mockRecipes.filter((r) => r.meatType === meatType)
    : mockRecipes;
  return await apiCallWithMock("/api/recipes", filtered);
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  const recipe = mockRecipes.find((r) => r.id === id) || null;
  return await apiCallWithMock(`/api/recipes/${id}`, recipe);
};

// LLM Recipe Generation (Backend + LLM)
export const generateRecipeWithLLM = async (
  fridgeItems: FridgeItem[]
): Promise<Recipe[]> => {
  // Mock 3 recipes based on fridge items
  const mockGeneratedRecipes = mockRecipes.slice(0, 3);
  
  return await apiCallWithMock("/api/recipes/generate", mockGeneratedRecipes, {
    method: "POST",
    body: { fridgeItems },
  });
};

// Analysis History APIs
export const getAnalysisHistory = async (): Promise<MeatAnalysisResult[]> => {
  return await apiCallWithMock("/api/analysis/history", mockAnalysisResults);
};

// Price Data APIs
export const getPriceData = async (): Promise<PriceData[]> => {
  return await apiCallWithMock("/api/prices", mockPriceData);
};

// Meat Facts APIs
export const getRandomMeatFact = async (): Promise<{ title: string; content: string }> => {
  const randomFact = mockMeatFacts[Math.floor(Math.random() * mockMeatFacts.length)];
  return await apiCallWithMock("/api/facts/random", randomFact);
};

// User/Guest APIs
export const createGuestSession = async (nickname: string): Promise<{ token: string; nickname: string }> => {
  const mockSession = {
    token: `guest_${Date.now()}`,
    nickname,
  };
  
  const result = await apiCallWithMock("/api/guest/create", mockSession, {
    method: "POST",
    body: { nickname },
  });
  
  // Store token
  setAuthToken(result.token);
  
  return result;
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

