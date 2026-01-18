"use client"

import { useState } from "react"
import { User, Refrigerator, Calendar, Settings, LogIn, Beef, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const fridgeItems = [
  { name: "한우 등심", expiry: "1/21", daysLeft: 3 },
  { name: "삼겹살", expiry: "1/20", daysLeft: 2 },
  { name: "닭가슴살", expiry: "1/22", daysLeft: 4 },
]

// Generate mock grass data for meat tracking calendar
const generateGrassData = () => {
  const data = []
  for (let i = 0; i < 35; i++) {
    const level = Math.floor(Math.random() * 5) // 0-4 intensity levels
    data.push(level)
  }
  return data
}

const grassData = generateGrassData()

export function MyPageView() {
  const [showLoginModal, setShowLoginModal] = useState(true)

  return (
    <div className="space-y-4">
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Beef className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center">나만의 고기 잔디를 키워보세요!</DialogTitle>
            <DialogDescription className="text-center">
              로그인하면 인식 기록이 저장되고,<br />
              나만의 고기 잔디를 관리할 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setShowLoginModal(false)}>
              <LogIn className="w-4 h-4 mr-2" />
              로그인하기
            </Button>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowLoginModal(false)}>
              게스트로 계속하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">게스트 육류박사</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary/10 text-primary border-0">Lv.3 미식가</Badge>
              <Badge variant="outline" className="text-xs">12회 인식</Badge>
            </div>
          </div>
        </div>

        {/* Meat Grass (Activity Calendar) */}
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              나의 고기 잔디
            </h3>
            <span className="text-xs text-muted-foreground">최근 5주</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grassData.map((level, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor:
                    level === 0
                      ? "var(--muted)"
                      : level === 1
                      ? "rgba(128, 0, 0, 0.2)"
                      : level === 2
                      ? "rgba(128, 0, 0, 0.4)"
                      : level === 3
                      ? "rgba(128, 0, 0, 0.6)"
                      : "rgba(128, 0, 0, 0.9)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground mr-1">적음</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    level === 0
                      ? "var(--muted)"
                      : `rgba(128, 0, 0, ${0.2 + level * 0.2})`,
                }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">많음</span>
          </div>
        </div>
      </div>

      {/* My Fridge */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Refrigerator className="w-4 h-4 text-primary" />
            나의 냉장고
          </h3>
          <Badge variant="outline" className="text-xs">{fridgeItems.length}개 보관중</Badge>
        </div>
        <div className="space-y-2">
          {fridgeItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-secondary rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Beef className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">폐기 권장: {item.expiry}</p>
                </div>
              </div>
              <Badge
                className={
                  item.daysLeft <= 2
                    ? "bg-red-100 text-red-700 border-0"
                    : "bg-green-100 text-green-700 border-0"
                }
              >
                D-{item.daysLeft}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Settings */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-primary" />
          설정
        </h3>
        <div className="space-y-2">
          {["알림 설정", "개인정보 관리", "앱 정보", "고객센터"].map((item) => (
            <button
              key={item}
              className="w-full flex items-center justify-between p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
            >
              <span className="text-sm text-foreground">{item}</span>
              <span className="text-muted-foreground">{">"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
