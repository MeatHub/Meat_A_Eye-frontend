"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { LayoutDashboard, ScanLine, BookOpen, Refrigerator, Beef, TrendingUp, Lightbulb } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
  guestNickname?: string
}

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "analysis", label: "AI 분석", icon: ScanLine },
  { id: "fridge", label: "냉장고 관리", icon: Refrigerator },
  { id: "recipe", label: "레시피 탐색", icon: BookOpen },
]

const meatFacts = [
  "한우의 마블링은 근내지방도라고 부르며, 1++등급은 마블링 비율이 가장 높습니다.",
  "돼지고기는 비타민 B1이 소고기의 10배나 함유되어 있습니다.",
  "양고기의 특유 냄새는 카프릴산 때문이며, 로즈마리로 중화할 수 있습니다.",
  "닭가슴살 100g에는 약 31g의 단백질이 들어있습니다.",
]

const popularCuts = [
  { name: "삼겹살", trend: "+12%" },
  { name: "한우 등심", trend: "+8%" },
  { name: "닭가슴살", trend: "+15%" },
]

export function AppSidebar({ activeMenu, onMenuChange, guestNickname = "게스트" }: AppSidebarProps) {
  const [factIndex] = useState(() => Math.floor(Math.random() * meatFacts.length))

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Beef className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Meat-A-Eye</h1>
            <p className="text-xs text-muted-foreground">AI 축산물 인식 서비스</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-4">
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {guestNickname.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{guestNickname}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                  Lv.3 미식가
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">이번 달 인식 횟수</span>
              <span className="font-semibold text-foreground">12회</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.id
            return (
              <li key={item.id}>
                <motion.button
                  onClick={() => onMenuChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </motion.button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Widget */}
      <div className="p-4 space-y-3">
        {/* Today's Meat Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">오늘의 고기 상식</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {meatFacts[factIndex]}
          </p>
        </motion.div>

        {/* Popular Cuts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">실시간 인기 부위</span>
          </div>
          <ul className="space-y-2">
            {popularCuts.map((cut, idx) => (
              <li key={cut.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-foreground">{cut.name}</span>
                </span>
                <span className="text-green-600 font-medium">{cut.trend}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </aside>
  )
}
