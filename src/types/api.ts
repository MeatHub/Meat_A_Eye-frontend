// API Response Types - Backend Schema Mapping

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface RegisterResponse {
  userId: number;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nickname: string;
  isGuest: boolean;
}

export interface FridgeItemResponse {
  id: number;
  name: string;
  dDay: number;
  imgUrl: string | null;
  status: "stored" | "consumed";
  expiryDate: string; // ISO date string
}

export interface FridgeListResponse {
  items: FridgeItemResponse[];
}

export interface FridgeItemAdd {
  meatId: number;
  storageDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
}

export interface FridgeStatusUpdate {
  status: "stored" | "consumed";
}

export interface NutritionInfo {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
}

export interface PriceInfo {
  currentPrice: number;
  priceUnit: string;
  priceTrend: "up" | "down" | "flat";
  priceDate: string | null;
  priceSource: "api" | "cache" | "fallback";
}

export interface AIAnalyzeResponse {
  partName: string;
  confidence: number;
  historyNo: string | null;
  raw: any;
  nutrition?: NutritionInfo | null;
  price?: PriceInfo | null;
}

export interface LLMRecipeRequest {
  fridgeItems: Array<{
    partName: string;
    name: string;
  }>;
}

export interface LLMRecipeResponse {
  recipe: string; // Markdown formatted recipe
}

export interface MeatInfoByPartNameResponse {
  partName: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  currentPrice: number;
  priceUnit: string;
  priceTrend: "up" | "down" | "flat";
  priceDate: string | null;
  priceSource: "api" | "cache" | "fallback";
  storageGuide: string | null;
}

