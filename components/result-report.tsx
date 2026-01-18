"use client"

import { Beef, Calendar, MapPin, Award, Refrigerator, TrendingUp, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"

interface ResultReportProps {
  mode: "vision" | "ocr"
  onSaveToFridge: () => void
}

const priceData = [
  { date: "1/12", price: 52000 },
  { date: "1/13", price: 51500 },
  { date: "1/14", price: 53000 },
  { date: "1/15", price: 52800 },
  { date: "1/16", price: 54000 },
  { date: "1/17", price: 53500 },
  { date: "1/18", price: 54200 },
]

const nutritionData = [
  { name: "단백질", value: 26, color: "var(--chart-1)" },
  { name: "지방", value: 15, color: "var(--chart-2)" },
  { name: "탄수화물", value: 0, color: "var(--chart-3)" },
]

const chartConfig = {
  price: { label: "가격", color: "var(--chart-1)" },
  protein: { label: "단백질", color: "var(--chart-1)" },
  fat: { label: "지방", color: "var(--chart-2)" },
  carbs: { label: "탄수화물", color: "var(--chart-3)" },
}

export function ResultReport({ mode, onSaveToFridge }: ResultReportProps) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 3)
  const formattedExpiry = `${expiryDate.getMonth() + 1}월 ${expiryDate.getDate()}일`

  return (
    <div className="space-y-4">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Cut Result Card - Full width */}
        <div className="col-span-2 bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Beef className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">인식된 부위</p>
                <h3 className="text-2xl font-bold text-foreground">한우 등심</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border-0">1++ 등급</Badge>
                  <Badge variant="outline" className="text-xs">소고기</Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">AI 신뢰도</p>
              <p className="text-2xl font-bold text-primary">94%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>인식 정확도</span>
              <span>94%</span>
            </div>
            <Progress value={94} className="h-2" />
          </div>
        </div>

        {/* OCR History Card - Only shown in OCR mode */}
        {mode === "ocr" && (
          <div className="col-span-2 bg-card rounded-2xl p-4 border border-border shadow-sm">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              이력 정보
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-secondary rounded-xl">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">도축일자</p>
                <p className="font-semibold text-foreground text-sm">2026.01.15</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-xl">
                <Award className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">등급</p>
                <p className="font-semibold text-foreground text-sm">1++</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-xl">
                <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">사육지</p>
                <p className="font-semibold text-foreground text-sm">횡성군</p>
              </div>
            </div>
          </div>
        )}

        {/* Storage Card */}
        <div className="col-span-2 md:col-span-1 bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Refrigerator className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">보관 관리</h4>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 mb-3">
            <p className="text-xs text-amber-800">폐기 권장일</p>
            <p className="text-lg font-bold text-amber-900">{formattedExpiry}</p>
            <p className="text-[10px] text-amber-700 mt-1">구매 후 냉장 보관 기준</p>
          </div>
          <Button 
            onClick={onSaveToFridge}
            className="w-full bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Refrigerator className="w-4 h-4 mr-2" />
            냉장고에 저장
          </Button>
        </div>

        {/* Price Chart Card */}
        <div className="col-span-2 md:col-span-1 bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">KAMIS 시세</h4>
            </div>
            <Badge variant="outline" className="text-[10px]">100g 기준</Badge>
          </div>
          <div className="text-right mb-2">
            <span className="text-2xl font-bold text-foreground">54,200</span>
            <span className="text-sm text-muted-foreground">원</span>
            <p className="text-xs text-green-600">+1.3% 전일대비</p>
          </div>
          <ChartContainer config={chartConfig} className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="var(--chart-1)" 
                  strokeWidth={2}
                  dot={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Nutrition Card */}
        <div className="col-span-2 bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">영양 성분</h4>
            <Badge variant="outline" className="text-[10px] ml-auto">100g 기준</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {nutritionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground">{item.value}g</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">칼로리</span>
                  <span className="font-semibold text-foreground">250kcal</span>
                </div>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nutritionData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
