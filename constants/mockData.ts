// Mock Data for Development - Used when backend is not available

export interface MeatAnalysisResult {
  id: string;
  partName: string;
  confidence: number;
  gradCAM?: string;
  timestamp: Date;
  origin?: string;
  grade?: string;
  traceabilityNumber?: string;
}

export interface FridgeItem {
  id: string;
  meatType: string;
  partName: string;
  addedDate: Date;
  expiryDate: Date;
  weight: number;
  grade?: string;
  memo?: string;
}

export interface Recipe {
  id: string;
  name: string;
  meatType: string;
  cookingTime: number;
  difficulty: "초급" | "중급" | "고급";
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
}

export interface PriceData {
  date: string;
  beef: number;
  pork: number;
  chicken: number;
}

// Mock Analysis Results
export const mockAnalysisResults: MeatAnalysisResult[] = [
  {
    id: "1",
    partName: "한우 등심",
    confidence: 0.95,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    origin: "국내산 한우",
    grade: "1++",
  },
  {
    id: "2",
    partName: "삼겹살",
    confidence: 0.92,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    origin: "국내산 돼지고기",
    grade: "1등급",
  },
  {
    id: "3",
    partName: "닭가슴살",
    confidence: 0.88,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    origin: "국내산 닭고기",
    grade: "-",
  },
];

// Mock Fridge Items
export const mockFridgeItems: FridgeItem[] = [
  {
    id: "1",
    meatType: "소고기",
    partName: "한우 등심",
    addedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // D-1 (빨강)
    weight: 500,
    grade: "1++",
    memo: "특별한 날을 위해 보관",
  },
  {
    id: "2",
    meatType: "돼지고기",
    partName: "삼겹살",
    addedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // D-3 (노랑)
    weight: 800,
    grade: "1등급",
  },
  {
    id: "3",
    meatType: "닭고기",
    partName: "닭가슴살",
    addedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // D-5 (초록)
    weight: 400,
  },
  {
    id: "4",
    meatType: "소고기",
    partName: "소갈비",
    addedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // D-7 (초록)
    weight: 1000,
    grade: "1+",
    memo: "가족 모임용",
  },
];

// Mock Recipes
export const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "등심 스테이크",
    meatType: "소고기",
    cookingTime: 30,
    difficulty: "중급",
    ingredients: [
      "소고기 등심 300g",
      "소금 약간",
      "후추 약간",
      "올리브유 2큰술",
      "버터 1큰술",
      "로즈마리 1줄기",
    ],
    instructions: [
      "등심을 실온에 30분간 두어 온도를 맞춥니다.",
      "소금과 후추로 간을 합니다.",
      "팬을 강불로 달군 뒤 올리브유를 두릅니다.",
      "등심을 넣고 각 면을 2-3분씩 굽습니다.",
      "버터와 로즈마리를 넣고 베이스팅합니다.",
      "5분간 휴지시킨 후 썰어 제공합니다.",
    ],
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "2",
    name: "삼겹살 김치찌개",
    meatType: "돼지고기",
    cookingTime: 40,
    difficulty: "초급",
    ingredients: [
      "삼겹살 200g",
      "김치 300g",
      "두부 1/2모",
      "대파 1대",
      "고춧가루 1큰술",
      "된장 1큰술",
      "물 3컵",
    ],
    instructions: [
      "냄비에 삼겹살을 볶습니다.",
      "김치를 넣고 함께 볶습니다.",
      "물을 붓고 끓입니다.",
      "고춧가루와 된장을 넣습니다.",
      "두부와 대파를 넣고 10분 더 끓입니다.",
    ],
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "3",
    name: "닭가슴살 샐러드",
    meatType: "닭고기",
    cookingTime: 15,
    difficulty: "초급",
    ingredients: [
      "닭가슴살 200g",
      "양상추 100g",
      "방울토마토 10개",
      "오이 1개",
      "발사믹 드레싱 3큰술",
      "소금, 후추 약간",
    ],
    instructions: [
      "닭가슴살에 소금, 후추로 간을 합니다.",
      "팬에 구워 익힙니다.",
      "야채를 씻어 먹기 좋게 자릅니다.",
      "닭가슴살을 한입 크기로 썹니다.",
      "모든 재료를 섞어 드레싱을 뿌립니다.",
    ],
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "4",
    name: "소갈비찜",
    meatType: "소고기",
    cookingTime: 120,
    difficulty: "고급",
    ingredients: [
      "소갈비 1kg",
      "간장 5큰술",
      "설탕 3큰술",
      "배 1개",
      "양파 1개",
      "당근 1개",
      "대추 5개",
      "밤 5개",
    ],
    instructions: [
      "소갈비를 찬물에 담가 핏물을 뺍니다.",
      "배, 양파를 갈아 양념장을 만듭니다.",
      "갈비에 양념을 골고루 재웁니다.",
      "압력솥에 갈비와 야채를 넣습니다.",
      "40분간 압력을 가해 익힙니다.",
      "뚜껑을 열고 조려 윤기를 냅니다.",
    ],
    imageUrl: "/placeholder.jpg",
  },
  {
    id: "5",
    name: "제육볶음",
    meatType: "돼지고기",
    cookingTime: 25,
    difficulty: "중급",
    ingredients: [
      "돼지고기 목살 300g",
      "고춧가루 2큰술",
      "고추장 2큰술",
      "간장 2큰술",
      "설탕 1큰술",
      "마늘 1큰술",
      "양파 1개",
      "대파 1대",
    ],
    instructions: [
      "돼지고기를 먹기 좋은 크기로 썹니다.",
      "양념장을 만들어 고기에 재웁니다.",
      "양파와 대파를 썰어 준비합니다.",
      "팬에 기름을 두르고 고기를 볶습니다.",
      "야채를 넣고 함께 볶습니다.",
      "센 불에서 빠르게 볶아냅니다.",
    ],
    imageUrl: "/placeholder.jpg",
  },
];

// Mock Price Data (for charts)
export const mockPriceData: PriceData[] = [
  { date: "1월 1주", beef: 25000, pork: 12000, chicken: 8000 },
  { date: "1월 2주", beef: 26000, pork: 11500, chicken: 8200 },
  { date: "1월 3주", beef: 24500, pork: 12500, chicken: 7800 },
  { date: "1월 4주", beef: 25500, pork: 12200, chicken: 8100 },
  { date: "2월 1주", beef: 26500, pork: 12800, chicken: 8300 },
  { date: "2월 2주", beef: 27000, pork: 13000, chicken: 8500 },
];

// Mock Meat Facts
export const mockMeatFacts = [
  {
    title: "한우의 등급 체계",
    content: "한우는 1++, 1+, 1, 2, 3등급으로 나뉘며, 마블링(지방의 분포)과 고기의 색, 지방색, 조직감, 성숙도 등을 종합적으로 평가합니다.",
  },
  {
    title: "소고기의 숙성",
    content: "소고기는 도축 후 숙성 과정을 거치면 육질이 부드러워지고 풍미가 깊어집니다. 일반적으로 14-21일 숙성이 이상적입니다.",
  },
  {
    title: "삼겹살의 영양",
    content: "삼겹살은 단백질과 비타민 B1이 풍부하며, 특히 피로회복에 도움을 줍니다. 적당량 섭취 시 에너지원으로 좋습니다.",
  },
  {
    title: "닭가슴살의 효능",
    content: "닭가슴살은 고단백 저지방 식품으로 다이어트에 적합합니다. 100g당 약 23g의 단백질을 함유하고 있습니다.",
  },
  {
    title: "고기 보관 온도",
    content: "신선한 고기는 0-4°C에서 보관해야 하며, 장기 보관 시에는 -18°C 이하의 냉동실에 보관하는 것이 좋습니다.",
  },
];

// Utility function to get D-Day
export const getDDay = (expiryDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Utility function to get D-Day color
export const getDDayColor = (daysLeft: number): string => {
  if (daysLeft <= 1) return "red";
  if (daysLeft <= 3) return "yellow";
  return "green";
};

// Utility function to format date
export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주일 전`;
  return `${Math.floor(days / 30)}개월 전`;
};

