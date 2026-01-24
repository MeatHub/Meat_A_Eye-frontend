"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Beef, BookOpen, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getAnalysisHistory, getFridgeItems, getPriceData, getRandomMeatFact } from "@/lib/api"
import { getDDay, getDDayColor, formatDate } from "@/constants/mockData"
import type { MeatAnalysisResult, FridgeItem, PriceData } from "@/constants/mockData"

interface DashboardViewProps {
  onNavigate: (menu: string) => void
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [recentAnalysis, setRecentAnalysis] = useState<MeatAnalysisResult[]>([])
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [meatFact, setMeatFact] = useState<{ title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [analysis, fridge, prices, fact] = await Promise.all([
        getAnalysisHistory(),
        getFridgeItems(),
        getPriceData(),
        getRandomMeatFact(),
      ])
      setRecentAnalysis(analysis)
      setFridgeItems(fridge)
      setPriceData(prices)
      setMeatFact(fact)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Sort fridge items by expiry date
  const sortedFridgeItems = [...fridgeItems].sort((a, b) => {
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
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
              {recentAnalysis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Beef className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>아직 분석한 고기가 없습니다</p>
                  <button
                    onClick={() => onNavigate("analysis")}
                    className="text-primary hover:underline mt-2"
                  >
                    지금 분석하기 →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAnalysis.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <Beef className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{item.partName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.origin} · {formatDate(item.timestamp)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              신뢰도: {(item.confidence * 100).toFixed(0)}%
                            </Badge>
                            {item.grade && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                {item.grade}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => onNavigate("analysis")}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    전체 기록 보기 →
                  </button>
                </div>
              )}
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>보관 중인 고기가 없습니다</p>
                  <button
                    onClick={() => onNavigate("fridge")}
                    className="text-primary hover:underline mt-2"
                  >
                    추가하기 →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedFridgeItems.slice(0, 5).map((item) => {
                    const daysLeft = getDDay(item.expiryDate)
                    const color = getDDayColor(daysLeft)
                    const colorClasses = {
                      red: "border-red-500 bg-red-50",
                      yellow: "border-yellow-500 bg-yellow-50",
                      green: "border-green-500 bg-green-50",
                    }

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 ${colorClasses[color]} transition-all hover:scale-105`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm text-foreground">{item.partName}</h4>
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
                          {item.weight}g · {item.meatType}
                        </p>
                      </div>
                    )
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

        {/* Card C - Medium: Price Trend Chart */}
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
              <CardDescription>최근 6주간 가격 변동</CardDescription>
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

        {/* Card D - Small: Today's Meat Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
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
      </div>
    </div>
  )
}
