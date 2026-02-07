"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Beef, BookOpen, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getFridgeItems,
  getDashboardPrices,
  getDashboardPriceHistory,
  getDashboardPriceHistoryCheck,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type {
  FridgeItemResponse,
  PriceItem,
  PriceHistoryPoint,
} from "@/src/types/api";

interface DashboardViewProps {
  onNavigate: (menu: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([]);
  const [priceData, setPriceData] = useState<{
    beef: PriceItem[];
    pork: PriceItem[];
  }>({ beef: [], pork: [] });
  const [priceHistory, setPriceHistory] = useState<{
    beef: PriceHistoryPoint[];
    pork: PriceHistoryPoint[];
  }>({ beef: [], pork: [] });
  const [loading, setLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [monthlyApiConnected, setMonthlyApiConnected] = useState<
    boolean | null
  >(null);

  // 필터 상태
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [selectedPart, setSelectedPart] = useState<string>("전체"); // 통합 부위 선택
  const [selectedGrade, setSelectedGrade] = useState("00"); // 00 = 전체 평균

  useEffect(() => {
    // 초기 로드: 전체 평균으로 기본 부위들만 조회
    loadDashboardData();
  }, []);

  // 부위 선택 핸들러: 돼지 선택 시 등급을 자동으로 "00"으로 변경
  const handlePartChange = (part: string) => {
    setSelectedPart(part);
    // 돼지 부위 선택 시 등급을 자동으로 전체 평균으로 변경
    if (part !== "전체" && part.startsWith("Pork_")) {
      setSelectedGrade("00");
    }
  };

  // 조회 버튼 클릭 핸들러
  const handleSearch = async () => {
    await Promise.all([loadPriceData(), loadPriceHistory()]);
  };

  useEffect(() => {
    getDashboardPriceHistoryCheck()
      .then((res) => setMonthlyApiConnected(res.connected))
      .catch(() => setMonthlyApiConnected(false));
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fridgeResponse, pricesResponse, historyResponse] =
        await Promise.all([
          getFridgeItems(),
          getDashboardPrices(
            selectedRegion,
            selectedPart !== "전체" && selectedPart.startsWith("Beef_")
              ? selectedPart
              : undefined,
            selectedPart !== "전체" && selectedPart.startsWith("Pork_")
              ? selectedPart
              : undefined,
            selectedGrade
          ).catch(() => ({ beef: [], pork: [] })),
          getDashboardPriceHistory(
            selectedRegion,
            selectedPart !== "전체" && selectedPart.startsWith("Beef_")
              ? selectedPart
              : undefined,
            selectedPart !== "전체" && selectedPart.startsWith("Pork_")
              ? selectedPart
              : undefined,
            selectedGrade,
            6
          ).catch(() => ({ beef: [], pork: [] })),
        ]);
      setFridgeItems(
        fridgeResponse.items.filter((item) => item.status === "stored")
      );
      setPriceData(pricesResponse);
      setPriceHistory(historyResponse);
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "로딩 실패",
        description: error.message || "데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPriceData = async () => {
    setPriceLoading(true);
    try {
      const pricesResponse = await getDashboardPrices(
        selectedRegion,
        selectedPart !== "전체" && selectedPart.startsWith("Beef_")
          ? selectedPart
          : undefined,
        selectedPart !== "전체" && selectedPart.startsWith("Pork_")
          ? selectedPart
          : undefined,
        selectedGrade
      );
      setPriceData(pricesResponse);
    } catch (error: any) {
      console.error("Failed to load price data:", error);
      setPriceData({ beef: [], pork: [] });
      toast({
        title: "가격 조회 실패",
        description: error.message || "가격 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setPriceLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getDashboardPriceHistory(
        selectedRegion,
        selectedPart !== "전체" && selectedPart.startsWith("Beef_")
          ? selectedPart
          : undefined,
        selectedPart !== "전체" && selectedPart.startsWith("Pork_")
          ? selectedPart
          : undefined,
        selectedGrade,
        6 // 최근 6주
      );
      console.log("주별 가격 이력 로드 성공:", {
        beef: res.beef.length,
        pork: res.pork.length,
        beefData: res.beef,
        porkData: res.pork,
      });
      setPriceHistory(res);
    } catch (error: any) {
      console.error("Failed to load price history:", error);
      console.error("에러 상세:", {
        message: error.message,
        stack: error.stack,
        region: selectedRegion,
        part: selectedPart,
        grade: selectedGrade,
      });
      setPriceHistory({ beef: [], pork: [] });
      toast({
        title: "주별 가격 이력 조회 실패",
        description: error.message || "주별 가격 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sort fridge items by expiry date (already sorted by API, but ensure)
  const sortedFridgeItems = [...fridgeItems].sort((a, b) => a.dDay - b.dDay);

  // Prepare chart data for meat parts distribution
  const meatPartsData = fridgeItems.reduce((acc, item) => {
    const part = item.name;
    acc[part] = (acc[part] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(meatPartsData).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "#800000",
    "#A52A2A",
    "#CD5C5C",
    "#DC143C",
    "#B22222",
    "#8B0000",
  ];

  // 주별 가격 변동 차트 데이터 (카테고리 가격 아래 그래프용)
  const priceChartData = (() => {
    // 백엔드에서 이미 날짜 순서대로 정렬되어 있으므로, 순서를 유지하면서 주 목록 추출
    const allWeeksMap = new Map<string, number>(); // week -> 최초 등장 순서
    let order = 0;
    
    // 소고기와 돼지고기 데이터를 순서대로 순회하면서 주 목록 생성
    [...priceHistory.beef, ...priceHistory.pork].forEach((p) => {
      if (!allWeeksMap.has(p.week)) {
        allWeeksMap.set(p.week, order++);
      }
    });
    
    // 등장 순서대로 정렬 (백엔드에서 이미 정렬되어 있음)
    const weeksSorted = Array.from(allWeeksMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([week]) => week);
    
    return weeksSorted.map((week) => {
      const row: Record<string, string | number> = { week };
      priceHistory.beef
        .filter((p) => p.week === week)
        .forEach((p) => (row[p.partName] = p.price));
      priceHistory.pork
        .filter((p) => p.week === week)
        .forEach((p) => (row[p.partName] = p.price));
      return row;
    });
  })();
  const priceChartParts = [
    ...new Set([
      ...priceHistory.beef.map((p) => p.partName),
      ...priceHistory.pork.map((p) => p.partName),
    ]),
  ];
  // 주별 가격 차트 Y축: 데이터 범위에 맞춰 변동이 잘 보이도록 domain 계산 (0 고정 X)
  const priceChartYDomain = (() => {
    if (priceChartData.length === 0 || priceChartParts.length === 0)
      return undefined;
    let dataMin = Infinity;
    let dataMax = -Infinity;
    for (const row of priceChartData) {
      for (const key of priceChartParts) {
        const v = row[key];
        if (typeof v === "number" && !Number.isNaN(v)) {
          dataMin = Math.min(dataMin, v);
          dataMax = Math.max(dataMax, v);
        }
      }
    }
    if (dataMin === Infinity || dataMax === -Infinity) return undefined;
    const span = dataMax - dataMin;
    const padding = span > 0 ? Math.max(span * 0.1, 200) : 500;
    const yMin = Math.max(0, Math.floor((dataMin - padding) / 500) * 500);
    const yMax = Math.ceil((dataMax + padding) / 500) * 500;
    return [yMin, yMax] as [number, number];
  })();
  const CHART_COLORS = ["#800000", "#A52A2A", "#CD5C5C", "#DC143C"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 가격 데이터의 날짜 정보 추출 (가장 최근 날짜만 표시)
  const getPriceDateInfo = () => {
    const allDates = [
      ...priceData.beef.map((p) => p.priceDate).filter(Boolean),
      ...priceData.pork.map((p) => p.priceDate).filter(Boolean),
    ];
    if (allDates.length === 0) return null;

    // 가장 최근 날짜 찾기
    const sortedDates = allDates
      .map((d) => {
        try {
          return new Date(d!);
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime()); // 내림차순 정렬

    if (sortedDates.length === 0) return null;

    const latestDate = sortedDates[0];
    
    // 가장 최근 날짜 표시
    return latestDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const priceDateInfo = getPriceDateInfo();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* 왼쪽: 실시간 가격정보 + 그래프 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className="bg-gradient-to-br from-card via-card/95 to-card border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold text-primary mb-2">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="truncate">실시간 시세 (100g당)</span>
                </CardTitle>
                <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    KAMIS 기준 소매가격
                  </CardDescription>
                  {priceDateInfo && (
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs border-primary/30 text-primary bg-primary/5 whitespace-nowrap"
                    >
                      {priceDateInfo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            {/* 카테고리바 - 트렌디한 디자인 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5 bg-gradient-to-br from-primary/8 via-primary/5 to-primary/8 rounded-2xl border-2 border-primary/20 shadow-lg backdrop-blur-sm">
              {/* 지역 선택 */}
              <div className="space-y-2.5">
                <label className="text-sm sm:text-base font-bold text-foreground/90 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  지역
                </label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                  disabled={priceLoading || historyLoading}
                >
                  <SelectTrigger className="h-12 sm:h-11 text-sm sm:text-base bg-background/90 border-primary/30 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전국">전국</SelectItem>
                    <SelectItem value="서울">서울</SelectItem>
                    <SelectItem value="부산">부산</SelectItem>
                    <SelectItem value="대구">대구</SelectItem>
                    <SelectItem value="인천">인천</SelectItem>
                    <SelectItem value="광주">광주</SelectItem>
                    <SelectItem value="대전">대전</SelectItem>
                    <SelectItem value="울산">울산</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 부위 선택 */}
              <div className="space-y-2.5">
                <label className="text-sm sm:text-base font-bold text-foreground/90 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  부위
                </label>
                <Select
                  value={selectedPart}
                  onValueChange={handlePartChange}
                  disabled={priceLoading || historyLoading}
                >
                  <SelectTrigger className="h-12 sm:h-11 text-sm sm:text-base bg-background/90 border-primary/30 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                    <SelectValue placeholder="부위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <div className="px-2 py-2 text-xs sm:text-sm font-bold text-primary border-t border-border mt-1 bg-primary/5">
                      소고기
                    </div>
                    <SelectItem value="Beef_Tenderloin">소/안심</SelectItem>
                    <SelectItem value="Beef_Ribeye">소/등심</SelectItem>
                    <SelectItem value="Beef_BottomRound">소/설도</SelectItem>
                    <SelectItem value="Beef_Brisket">소/양지</SelectItem>
                    <SelectItem value="Beef_Rib">소/갈비</SelectItem>
                    <div className="px-2 py-2 text-xs sm:text-sm font-bold text-primary border-t border-border mt-1 bg-primary/5">
                      돼지고기
                    </div>
                    <SelectItem value="Pork_Shoulder">돼지/앞다리</SelectItem>
                    <SelectItem value="Pork_Belly">돼지/삼겹살</SelectItem>
                    <SelectItem value="Pork_Rib">돼지/갈비</SelectItem>
                    <SelectItem value="Pork_Loin">돼지/목심</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 등급 선택 */}
              <div className="space-y-2.5">
                <label className="text-sm sm:text-base font-bold text-foreground/90 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  등급
                </label>
                <Select
                  value={selectedGrade}
                  onValueChange={setSelectedGrade}
                  disabled={priceLoading || historyLoading || (selectedPart !== "전체" && selectedPart.startsWith("Pork_"))}
                >
                  <SelectTrigger className="h-12 sm:h-11 text-sm sm:text-base bg-background/90 border-primary/30 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                    <SelectValue placeholder="등급 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">전체 평균</SelectItem>
                    {selectedPart === "전체" || selectedPart.startsWith("Beef_") ? (
                      <>
                        <SelectItem value="01">1++등급</SelectItem>
                        <SelectItem value="02">1+등급</SelectItem>
                        <SelectItem value="03">1등급</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              {/* 조회 버튼 */}
              <div className="space-y-2.5 flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={priceLoading || historyLoading}
                  className="w-full h-12 sm:h-11 text-sm sm:text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {priceLoading || historyLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                      조회 중...
                    </>
                  ) : (
                    "조회"
                  )}
                </Button>
              </div>
            </div>

            {/* 가격 정보 표시 - 트렌디한 디자인 */}
            {priceLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto"></div>
                  <p className="text-sm font-medium text-muted-foreground">
                    가격 정보를 불러오는 중...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 소고기 섹션 */}
                {(selectedPart === "전체" ||
                  selectedPart.startsWith("Beef_")) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-red-50/80 via-red-50/60 to-red-100/40 border-2 border-red-200/70 shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-red-200/50">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/20">
                          <Beef className="w-5 h-5 text-red-600" />
                        </div>
                        소고기
                      </h4>
                    </div>
                    {priceData.beef.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {priceData.beef.map((p) => (
                          <motion.div
                            key={p.partName}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-background/80 hover:bg-background shadow-md hover:shadow-lg transition-all border border-red-200/30 gap-2 sm:gap-0"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm sm:text-base font-bold text-foreground block mb-1 truncate">
                                {p.partName}
                              </span>
                              {p.priceDate && (
                                <span className="text-xs sm:text-[10px] text-muted-foreground">
                                  {new Date(p.priceDate).toLocaleDateString(
                                    "ko-KR",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 flex-shrink-0">
                              <span className="text-base sm:text-lg font-extrabold text-red-600 tracking-tight whitespace-nowrap">
                                {p.currentPrice.toLocaleString()}원
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold border-red-300/50 text-red-700 bg-red-50/50 px-2 py-1 whitespace-nowrap"
                              >
                                {p.unit}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Beef className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">
                          소고기 가격 정보가 없습니다
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 돼지고기 섹션 */}
                {(selectedPart === "전체" ||
                  selectedPart.startsWith("Pork_")) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-pink-50/80 via-pink-50/60 to-pink-100/40 border-2 border-pink-200/70 shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-pink-200/50">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-pink-500/20">
                          <Beef className="w-5 h-5 text-pink-600" />
                        </div>
                        돼지고기
                      </h4>
                    </div>
                    {priceData.pork.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {priceData.pork.map((p) => (
                          <motion.div
                            key={p.partName}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-background/80 hover:bg-background shadow-md hover:shadow-lg transition-all border border-pink-200/30 gap-2 sm:gap-0"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm sm:text-base font-bold text-foreground block mb-1 truncate">
                                {p.partName}
                              </span>
                              {p.priceDate && (
                                <span className="text-xs sm:text-[10px] text-muted-foreground">
                                  {new Date(p.priceDate).toLocaleDateString(
                                    "ko-KR",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 flex-shrink-0">
                              <span className="text-base sm:text-lg font-extrabold text-pink-600 tracking-tight whitespace-nowrap">
                                {p.currentPrice.toLocaleString()}원
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold border-pink-300/50 text-pink-700 bg-pink-50/50 px-2 py-1 whitespace-nowrap"
                              >
                                {p.unit}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Beef className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">
                          돼지고기 가격 정보가 없습니다
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 주별 가격 변동 그래프 */}
                <div className="mt-8 pt-6 border-t-2 border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      주별 가격 변동
                    </h4>
                    <div className="flex items-center gap-2">
                      {monthlyApiConnected === true && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-500/15 text-green-700 border-green-500/40 font-semibold px-2 py-1"
                        >
                          ✓ KAMIS 연동됨
                        </Badge>
                      )}
                      {monthlyApiConnected === false && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-500/15 text-amber-700 border-amber-500/40 font-semibold px-2 py-1"
                        >
                          ⚠ API 미연결
                        </Badge>
                      )}
                    </div>
                  </div>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent"></div>
                    </div>
                  ) : priceChartData.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">
                        주별 가격 데이터가 없습니다.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {priceHistory.beef.length === 0 && priceHistory.pork.length === 0
                          ? "선택한 조건에 해당하는 데이터가 없거나 API 연결에 문제가 있을 수 있습니다."
                          : `소고기: ${priceHistory.beef.length}개, 돼지고기: ${priceHistory.pork.length}개 데이터`}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-background/50 rounded-xl p-2 sm:p-4 border border-border/50 overflow-x-auto">
                      <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
                        <LineChart
                          data={priceChartData}
                          margin={{ top: 12, right: 12, left: 12, bottom: 12 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E8E4DD"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="week"
                            stroke="#6B6B6B"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                            tickFormatter={(v) =>
                              typeof v === "string" ? v : String(v)
                            }
                          />
                          <YAxis
                            stroke="#6B6B6B"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            domain={priceChartYDomain ?? undefined}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FAF9F6",
                              border: "2px solid #E8E4DD",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            labelFormatter={(v) =>
                              typeof v === "string" ? v : String(v)
                            }
                            formatter={(value: number) => [
                              `${Number(value).toLocaleString()}원`,
                              "",
                            ]}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "12px", fontWeight: 500 }}
                          />
                          {priceChartParts.map((partName, idx) => (
                            <Line
                              key={partName}
                              type="monotone"
                              dataKey={partName}
                              name={partName}
                              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                              strokeWidth={3}
                              dot={{
                                fill: CHART_COLORS[idx % CHART_COLORS.length],
                                r: 4,
                              }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 오른쪽: 냉장고 정보 (부위별 분포 + 냉장고 보관 현황) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        {/* 부위별 분포 */}
        <Card className="bg-gradient-to-br from-card to-card/95 border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-primary">
              <div className="p-2 rounded-xl bg-primary/10">
                <Beef className="w-5 h-5" />
              </div>
              부위별 분포
            </CardTitle>
            <CardDescription className="font-medium">
              냉장고 고기 부위 비율
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Beef className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">데이터가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={75}
                      innerRadius={20}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => {
                        // 커스텀 라벨 렌더링으로 글자 잘림 방지
                        const { name, percent } = entry;
                        const shortName = name.length > 4 ? name.substring(0, 3) + "..." : name;
                        return (
                          <text
                            x={entry.x}
                            y={entry.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={11}
                            fontWeight="bold"
                            fill="#fff"
                            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                          >
                            {`${shortName} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {pieData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium text-foreground">
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-bold text-primary">
                        {entry.value}개
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 냉장고 보관 현황 */}
        <Card className="bg-gradient-to-br from-card to-card/95 border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-primary">
              <div className="p-2 rounded-xl bg-primary/10">
                <AlertCircle className="w-5 h-5" />
              </div>
              냉장고 보관 현황
            </CardTitle>
            <CardDescription className="font-medium">
              유통기한 임박순
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedFridgeItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    보관 중인 고기가 없습니다
                  </h3>
                  <p className="text-sm mb-6">
                    고기를 분석하고 냉장고에 추가해보세요!
                  </p>
                  <Button
                    onClick={() => onNavigate("analysis")}
                    className="bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    고기 분석하기 →
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedFridgeItems.slice(0, 8).map((item, index) => {
                  const daysLeft = item.dDay;
                  const color =
                    daysLeft <= 1
                      ? "red"
                      : daysLeft <= 3
                      ? "yellow"
                      : "green";
                  const colorClasses = {
                    red: "border-red-500/70 bg-gradient-to-r from-red-50 to-red-100/50 shadow-red-200/50",
                    yellow:
                      "border-yellow-500/70 bg-gradient-to-r from-yellow-50 to-yellow-100/50 shadow-yellow-200/50",
                    green:
                      "border-green-500/70 bg-gradient-to-r from-green-50 to-green-100/50 shadow-green-200/50",
                  };

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className={`p-4 rounded-xl border-2 ${colorClasses[color]} transition-all shadow-md hover:shadow-lg cursor-pointer`}
                      onClick={() => onNavigate("fridge")}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base text-foreground">
                          {item.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-2 py-1 ${
                            color === "red"
                              ? "border-red-500 text-red-700 bg-red-100/50"
                              : color === "yellow"
                              ? "border-yellow-500 text-yellow-700 bg-yellow-100/50"
                              : "border-green-500 text-green-700 bg-green-100/50"
                          }`}
                        >
                          D-{daysLeft}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          유통기한:{" "}
                          {new Date(item.expiryDate).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                        {item.grade && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/30 text-primary"
                          >
                            {item.grade}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {sortedFridgeItems.length > 8 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate("fridge")}
                    className="w-full py-3 text-sm font-bold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all border-2 border-primary/20 hover:border-primary/40"
                  >
                    +{sortedFridgeItems.length - 8}개 더보기 →
                  </motion.button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
