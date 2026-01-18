"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { RandomRecipeModal } from "@/components/random-recipe-modal"
import { HomeView } from "@/components/views/home-view"
import { CameraView } from "@/components/views/camera-view"
import { RecipeView } from "@/components/views/recipe-view"
import { MyPageView } from "@/components/views/mypage-view"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"

export default function MeatAEyeDashboard() {
  const [activeMenu, setActiveMenu] = useState("home")
  const [showRandomRecipe, setShowRandomRecipe] = useState(false)

  const handleRandomRecipe = () => {
    setShowRandomRecipe(true)
  }

  const handleSaveToFridge = () => {
    toast({
      title: "냉장고에 저장되었습니다!",
      description: "마이페이지에서 보관 현황을 확인하세요.",
    })
  }

  const renderView = () => {
    switch (activeMenu) {
      case "home":
        return <HomeView onNavigate={setActiveMenu} />
      case "camera":
        return <CameraView onSaveToFridge={handleSaveToFridge} />
      case "recipe":
        return <RecipeView />
      case "mypage":
        return <MyPageView />
      default:
        return <HomeView onNavigate={setActiveMenu} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <AppSidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <AppHeader
            onRandomRecipe={handleRandomRecipe}
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
          />

          {/* Content Area */}
          <main className="flex-1 p-4 pb-20 lg:pb-6 lg:p-6 max-w-3xl mx-auto w-full">
            {renderView()}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* Random Recipe Modal */}
      <RandomRecipeModal open={showRandomRecipe} onOpenChange={setShowRandomRecipe} />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
