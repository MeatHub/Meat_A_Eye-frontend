"use client"

import { Camera, BookOpen, TrendingUp, Beef, ChefHat, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HomeViewProps {
  onNavigate: (menu: string) => void
}

const quickActions = [
  {
    id: "camera",
    title: "AI 카메라로 촬영",
    description: "고기 부위를 인식하고 정보를 확인하세요",
    icon: Camera,
    color: "bg-primary",
  },
  {
    id: "recipe",
    title: "레시피 탐색",
    description: "부위별 추천 요리법을 확인하세요",
    icon: BookOpen,
    color: "bg-accent",
  },
]

const recentMeats = [
  { name: "삼겹살", date: "어제", grade: "1등급" },
  { name: "한우 등심", date: "3일 전", grade: "1++" },
  { name: "닭가슴살", date: "1주일 전", grade: "-" },
]

const todayRecipes = [
  { name: "등심 스테이크", time: "30분", difficulty: "중급" },
  { name: "삼겹살 김치찌개", time: "40분", difficulty: "초급" },
  { name: "닭가슴살 샐러드", time: "15분", difficulty: "초급" },
]

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">안녕하세요, 게스트 육류박사님!</p>
            <h2 className="text-xl font-bold mb-2">오늘도 맛있는 고기 여정을 시작해볼까요?</h2>
            <p className="text-sm opacity-80">이번 달 12번의 고기를 인식했어요</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Beef className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{action.title}</h3>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </button>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            최근 인식 기록
          </h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            전체보기
          </Button>
        </div>
        <div className="space-y-3">
          {recentMeats.map((meat, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Beef className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{meat.name}</p>
                  <p className="text-xs text-muted-foreground">{meat.date}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{meat.grade}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Recipe Recommendations */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            오늘의 추천 레시피
          </h3>
          <Badge className="bg-primary/10 text-primary border-0 gap-1">
            <Sparkles className="w-3 h-3" />
            AI 추천
          </Badge>
        </div>
        <div className="space-y-2">
          {todayRecipes.map((recipe, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate("recipe")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground text-sm text-left">{recipe.name}</p>
                <p className="text-xs text-muted-foreground">{recipe.time} · {recipe.difficulty}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">보기</Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
