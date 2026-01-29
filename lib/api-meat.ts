// Meat Info API - 부위명으로 영양정보 및 가격정보 조회

import { apiCall } from "./api";
import type { MeatInfoByPartNameResponse } from "@/types/api";

/**
 * 부위명으로 통합 정보 조회 (영양정보 + 가격정보)
 */
export const getMeatInfoByPartName = async (
  partName: string,
  region: string = "seoul"
): Promise<MeatInfoByPartNameResponse> => {
  return await apiCall<MeatInfoByPartNameResponse>(
    `/api/v1/meat/info/part/${encodeURIComponent(partName)}?region=${region}`
  );
};

