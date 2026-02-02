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
import { getFridgeItems } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type { FridgeItemResponse } from "@/types/api";

interface DashboardViewProps {
  onNavigate: (menu: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [fridgeResponse] = await Promise.all([
        getFridgeItems(),
        // getAnalysisHistory(), // 실제 API 구현 시 활성화
        // getPriceData(), // 실제 API 구현 시 활성화
        // getRandomMeatFact(), // 실제 API 구현 시 활성화
      ]);
      setFridgeItems(
        fridgeResponse.items.filter((item) => item.status === "stored"),
      );
      // setRecentAnalysis(analysis) // 실제 API 구현 시 활성화
      // setPriceData(prices) // 실제 API 구현 시 활성화
      // setMeatFact(fact) // 실제 API 구현 시 활성화
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

  // Sort fridge items by expiry date (already sorted by API, but ensure)
  const sortedFridgeItems = [...fridgeItems].sort((a, b) => a.dDay - b.dDay);

  // Prepare chart data for meat parts distribution
  const meatPartsData = fridgeItems.reduce(
    (acc, item) => {
      const part = item.name;
      acc[part] = (acc[part] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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

  // Prepare expiry date data
  const expiryData = [
    {
      range: "D-0~1",
      count: fridgeItems.filter((item) => item.dDay <= 1).length,
    },
    {
      range: "D-2~3",
      count: fridgeItems.filter((item) => item.dDay >= 2 && item.dDay <= 3)
        .length,
    },
    {
      range: "D-4~7",
      count: fridgeItems.filter((item) => item.dDay >= 4 && item.dDay <= 7)
        .length,
    },
    {
      range: "D-8+",
      count: fridgeItems.filter((item) => item.dDay >= 8).length,
    },
  ];

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
                            "ko-KR",
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

        {/* Card D - Small: Meat Parts Distribution Chart */}
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

        {/* Card E - Medium: Expiry Date Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-5 h-5" />
                유통기한 임박도
              </CardTitle>
              <CardDescription>고기 유통기한 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={expiryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" />
                  <XAxis
                    dataKey="range"
                    stroke="#6B6B6B"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6B6B6B" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF9F6",
                      border: "1px solid #E8E4DD",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#800000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card F - Small: Today's Meat Fact (실제 API 연동 시 활성화) */}
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
