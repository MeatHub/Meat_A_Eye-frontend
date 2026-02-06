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
import { getFridgeItems, getDashboardPrices, getDashboardPriceHistory, getDashboardPriceHistoryCheck } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type { FridgeItemResponse, PriceItem, PriceHistoryPoint } from "@/src/types/api";

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
  const [monthlyApiConnected, setMonthlyApiConnected] = useState<boolean | null>(null);

  // 필터 상태
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [selectedPart, setSelectedPart] = useState<string>("전체"); // 통합 부위 선택
  const [selectedGrade, setSelectedGrade] = useState("00"); // 00 = 전체 평균

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // 필터 변경 시 가격 데이터 + 월별 이력 로드
    if (!loading) {
      loadPriceData();
      loadPriceHistory();
    }
  }, [selectedRegion, selectedPart, selectedGrade]);

  useEffect(() => {
    getDashboardPriceHistoryCheck()
      .then((res) => setMonthlyApiConnected(res.connected))
      .catch(() => setMonthlyApiConnected(false));
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fridgeResponse, pricesResponse, historyResponse] = await Promise.all([
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
      setPriceHistory(res);
    } catch (error: any) {
      console.error("Failed to load price history:", error);
      setPriceHistory({ beef: [], pork: [] });
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
    const allWeeks = new Set<string>();
    priceHistory.beef.forEach((p) => allWeeks.add(p.week));
    priceHistory.pork.forEach((p) => allWeeks.add(p.week));
    const weeksSorted = Array.from(allWeeks).sort();
    return weeksSorted.map((week) => {
      const row: Record<string, string | number> = { week };
      priceHistory.beef.filter((p) => p.week === week).forEach((p) => (row[p.partName] = p.price));
      priceHistory.pork.filter((p) => p.week === week).forEach((p) => (row[p.partName] = p.price));
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
    if (priceChartData.length === 0 || priceChartParts.length === 0) return undefined;
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

  return (
    <div className="space-y-6">
      {/* Bento Grid Layout - Responsive: Desktop 3 columns, Mobile 1 column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Card A - Large: Recent Analysis Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Beef className="w-5 h-5" />
                최근 분석 결과
              </CardTitle>
              <CardDescription>AI가 분석한 고기 부위 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Beef className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    아직 분석한 고기가 없습니다
                  </h3>
                  <p className="text-sm mb-4">카메라로 고기를 찍어보세요!</p>
                  <Button
                    onClick={() => onNavigate("analysis")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    지금 분석하기 →
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card B - Medium: Fridge Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-5 h-5" />
                냉장고 보관 현황
              </CardTitle>
              <CardDescription>유통기한 임박순</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedFridgeItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      보관 중인 고기가 없습니다
                    </h3>
                    <p className="text-sm mb-4">
                      고기를 분석하고 냉장고에 추가해보세요!
                    </p>
                    <Button
                      onClick={() => onNavigate("analysis")}
                      className="bg-primary hover:bg-primary/90"
                    >
                      고기 분석하기 →
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedFridgeItems.slice(0, 5).map((item) => {
                    const daysLeft = item.dDay;
                    const color =
                      daysLeft <= 1
                        ? "red"
                        : daysLeft <= 3
                        ? "yellow"
                        : "green";
                    const colorClasses = {
                      red: "border-red-500 bg-red-50",
                      yellow: "border-yellow-500 bg-yellow-50",
                      green: "border-green-500 bg-green-50",
                    };

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 ${colorClasses[color]} transition-all hover:scale-105`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {item.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              color === "red"
                                ? "border-red-500 text-red-700"
                                : color === "yellow"
                                ? "border-yellow-500 text-yellow-700"
                                : "border-green-500 text-green-700"
                            }`}
                          >
                            D-{daysLeft}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          유통기한:{" "}
                          {new Date(item.expiryDate).toLocaleDateString(
                            "ko-KR"
                          )}
                        </p>
                      </div>
                    );
                  })}
                  {sortedFridgeItems.length > 5 && (
                    <button
                      onClick={() => onNavigate("fridge")}
                      className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      +{sortedFridgeItems.length - 5}개 더보기 →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Card C - Medium: Price Trend Chart (실제 API 연동 시 활성화) */}
        {/* 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                고기 시세 추이
              </CardTitle>
              <CardDescription>최근 가격 변동</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B6B6B"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#6B6B6B"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF9F6",
                      border: "1px solid #E8E4DD",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()}원`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="beef"
                    stroke="#800000"
                    strokeWidth={2}
                    name="소고기"
                    dot={{ fill: "#800000" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pork"
                    stroke="#A52A2A"
                    strokeWidth={2}
                    name="돼지고기"
                    dot={{ fill: "#A52A2A" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chicken"
                    stroke="#CD5C5C"
                    strokeWidth={2}
                    name="닭고기"
                    dot={{ fill: "#CD5C5C" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        */}

        {/* Card D - 실시간 시세 (돼지/소 100g당) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                실시간 시세 (100g당)
              </CardTitle>
              <CardDescription>KAMIS 기준 당일 도매가</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 카테고리바 - 더 세련된 디자인 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm">
                {/* 지역 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    지역
                  </label>
                  <Select
                    value={selectedRegion}
                    onValueChange={setSelectedRegion}
                    disabled={priceLoading}
                  >
                    <SelectTrigger className="h-10 bg-background/80 border-primary/20 hover:border-primary/40 transition-colors">
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

                {/* 부위 선택 - 통합된 단일 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    부위
                  </label>
                  <Select
                    value={selectedPart}
                    onValueChange={setSelectedPart}
                    disabled={priceLoading}
                  >
                    <SelectTrigger className="h-10 bg-background/80 border-primary/20 hover:border-primary/40 transition-colors">
                      <SelectValue placeholder="부위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-1">
                        소
                      </div>
                      <SelectItem value="Beef_Tenderloin">소/안심</SelectItem>
                      <SelectItem value="Beef_Ribeye">소/등심</SelectItem>
                      <SelectItem value="Beef_BottomRound">소/설도</SelectItem>
                      <SelectItem value="Beef_Brisket">소/양지</SelectItem>
                      <SelectItem value="Beef_Rib">소/갈비</SelectItem>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t border-border mt-1">
                        돼지
                      </div>
                      <SelectItem value="Pork_Shoulder">돼지/앞다리</SelectItem>
                      <SelectItem value="Pork_Belly">돼지/삼겹살</SelectItem>
                      <SelectItem value="Pork_Rib">돼지/갈비</SelectItem>
                      <SelectItem value="Pork_Loin">돼지/목심</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 등급 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    등급
                  </label>
                  <Select
                    value={selectedGrade}
                    onValueChange={setSelectedGrade}
                    disabled={priceLoading}
                  >
                    <SelectTrigger className="h-10 bg-background/80 border-primary/20 hover:border-primary/40 transition-colors">
                      <SelectValue placeholder="등급 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">전체 평균</SelectItem>
                      <SelectItem value="01">1++등급</SelectItem>
                      <SelectItem value="02">1+등급</SelectItem>
                      <SelectItem value="03">1등급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 가격 정보 표시 - 필터링된 디자인 */}
              {priceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">
                      가격 정보를 불러오는 중...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 선택된 부위에 따라 필터링된 가격 표시 */}
                  {selectedPart === "전체" ||
                  selectedPart.startsWith("Beef_") ? (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-red-50/60 to-red-100/40 border-2 border-red-200/60 shadow-md">
                      <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-red-200/50">
                        <Beef className="w-5 h-5 text-red-600" />
                        소고기
                      </h4>
                      {priceData.beef.length > 0 ? (
                        <div className="space-y-3">
                          {priceData.beef.map((p) => (
                            <div
                              key={p.partName}
                              className="flex items-center justify-between p-3 rounded-lg bg-background/70 hover:bg-background/90 transition-all shadow-sm hover:shadow-md"
                            >
                              <span className="text-sm font-semibold text-foreground">
                                {p.partName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-red-600">
                                  {p.currentPrice.toLocaleString()}원
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-red-300 text-red-700"
                                >
                                  {p.unit}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Beef className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">소고기 가격 정보가 없습니다</p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {selectedPart === "전체" ||
                  selectedPart.startsWith("Pork_") ? (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-pink-50/60 to-pink-100/40 border-2 border-pink-200/60 shadow-md">
                      <h4 className="text-base font-bold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-pink-200/50">
                        <Beef className="w-5 h-5 text-pink-600" />
                        돼지고기
                      </h4>
                      {priceData.pork.length > 0 ? (
                        <div className="space-y-3">
                          {priceData.pork.map((p) => (
                            <div
                              key={p.partName}
                              className="flex items-center justify-between p-3 rounded-lg bg-background/70 hover:bg-background/90 transition-all shadow-sm hover:shadow-md"
                            >
                              <span className="text-sm font-semibold text-foreground">
                                {p.partName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-pink-600">
                                  {p.currentPrice.toLocaleString()}원
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-pink-300 text-pink-700"
                                >
                                  {p.unit}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Beef className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">
                            돼지고기 가격 정보가 없습니다
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* 선택된 부위가 없을 때 안내 메시지 */}
                  {selectedPart !== "전체" &&
                  !selectedPart.startsWith("Beef_") &&
                  !selectedPart.startsWith("Pork_") &&
                  priceData.beef.length === 0 &&
                  priceData.pork.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">
                        부위를 선택하면 가격 정보가 표시됩니다
                      </p>
                    </div>
                  ) : null}

                  {/* 카테고리 가격 아래: 주별 가격 변동 그래프 */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        주별 가격 변동
                      </h4>
                      {monthlyApiConnected === true && (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-700 border-green-500/30">
                          KAMIS 연동됨
                        </Badge>
                      )}
                      {monthlyApiConnected === false && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                          API 미연결
                        </Badge>
                      )}
                    </div>
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : priceChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        주별 가격 데이터를 불러오는 중이거나 데이터가 없습니다.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart
                          data={priceChartData}
                          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" />
                          <XAxis
                            dataKey="week"
                            stroke="#6B6B6B"
                            style={{ fontSize: "11px" }}
                            tickFormatter={(v) => (typeof v === "string" ? v : String(v))}
                          />
                          <YAxis
                            stroke="#6B6B6B"
                            style={{ fontSize: "11px" }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            domain={priceChartYDomain ?? undefined}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FAF9F6",
                              border: "1px solid #E8E4DD",
                              borderRadius: "8px",
                            }}
                            labelFormatter={(v) => (typeof v === "string" ? v : String(v))}
                            formatter={(value: number) => [`${Number(value).toLocaleString()}원`, ""]}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                          {priceChartParts.map((partName, idx) => (
                            <Line
                              key={partName}
                              type="monotone"
                              dataKey={partName}
                              name={partName}
                              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                              strokeWidth={2}
                              dot={{ fill: CHART_COLORS[idx % CHART_COLORS.length], r: 3 }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Card E - Small: Meat Parts Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Beef className="w-5 h-5" />
                부위별 분포
              </CardTitle>
              <CardDescription>냉장고 고기 부위 비율</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>데이터가 없습니다</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Card G - Small: Today's Meat Fact (실제 API 연동 시 활성화) */}
        {/* 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                오늘의 고기 상식
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meatFact ? (
                <div>
                  <h3 className="font-bold text-lg mb-2">{meatFact.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">{meatFact.content}</p>
                </div>
              ) : (
                <p className="text-sm opacity-80">고기 상식을 불러오는 중...</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        */}
      </div>
    </div>
  );
}
