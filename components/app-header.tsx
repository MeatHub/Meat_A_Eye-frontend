"use client"

import { motion } from "framer-motion"
import { Beef, Wand2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AppHeaderProps {
  onRandomRecipe: () => void
  activeMenu: string
  onMenuChange: (menu: string) => void
  guestNickname?: string
}

const menuItems = [
  { id: "dashboard", label: "대시보드" },
  { id: "analysis", label: "AI 분석" },
  { id: "fridge", label: "냉장고 관리" },
  { id: "recipe", label: "레시피 탐색" },
]

export function AppHeader({ onRandomRecipe, activeMenu, onMenuChange, guestNickname = "게스트" }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">내비게이션 메뉴</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Logo */}
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

              {/* Profile */}
              <div className="p-4">
                <div className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {guestNickname.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{guestNickname}</p>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 mt-1">
                        Lv.3 미식가
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="flex-1 px-4">
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onMenuChange(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          activeMenu === item.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo (Mobile) */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Beef className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Meat-A-Eye</span>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-foreground">
            {menuItems.find(m => m.id === activeMenu)?.label || "대시보드"}
          </h2>
        </div>

        {/* Random Recipe Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onRandomRecipe}
            variant="default"
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">마법 레시피</span>
          </Button>
        </motion.div>
      </div>
    </header>
  )
}
