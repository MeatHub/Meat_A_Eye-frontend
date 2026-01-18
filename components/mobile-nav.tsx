"use client"

import { Home, Camera, BookOpen, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
}

const menuItems = [
  { id: "home", label: "홈", icon: Home },
  { id: "camera", label: "AI 카메라", icon: Camera },
  { id: "recipe", label: "레시피", icon: BookOpen },
  { id: "mypage", label: "마이", icon: User },
]

export function MobileNav({ activeMenu, onMenuChange }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <ul className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeMenu === item.id
          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => onMenuChange(item.id)}
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
