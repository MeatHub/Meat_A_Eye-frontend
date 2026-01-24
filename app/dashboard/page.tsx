"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { LLMRecipeModal } from "@/components/llm-recipe-modal"
import { GuestModeModal } from "@/components/guest-mode-modal"
import { DashboardView } from "@/components/views/dashboard-view"
import { AnalysisView } from "@/components/views/analysis-view"
import { RecipeView } from "@/components/views/recipe-view"
import { FridgeView } from "@/components/views/fridge-view"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { getGuestNickname } from "@/lib/api"

export default function MeatAEyeDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard")
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [guestNickname, setGuestNickname] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for existing nickname
    const nickname = getGuestNickname()
    if (nickname) {
      setGuestNickname(nickname)
    }
  }, [])

  const handleGuestComplete = (nickname: string) => {
    setGuestNickname(nickname)
    toast({
      title: `환영합니다, ${nickname}님! 🎉`,
      description: "Meat-A-Eye에서 즐거운 시간 보내세요.",
    })
  }

  const handleRandomRecipe = () => {
    setShowRecipeModal(true)
  }

  const handleSaveToFridge = () => {
    toast({
      title: "냉장고에 저장되었습니다! 🥩",
      description: "냉장고 관리 페이지에서 보관 현황을 확인하세요.",
    })
    // Optionally navigate to fridge
    setTimeout(() => setActiveMenu("fridge"), 1000)
  }

  const renderView = () => {
    const viewVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    }

    switch (activeMenu) {
      case "dashboard":
        return (
          <motion.div
            key="dashboard"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DashboardView onNavigate={setActiveMenu} />
          </motion.div>
        )
      case "analysis":
        return (
          <motion.div
            key="analysis"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <AnalysisView onSaveToFridge={handleSaveToFridge} />
          </motion.div>
        )
      case "recipe":
        return (
          <motion.div
            key="recipe"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <RecipeView />
          </motion.div>
        )
      case "fridge":
        return (
          <motion.div
            key="fridge"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <FridgeView />
          </motion.div>
        )
      default:
        return (
          <motion.div
            key="dashboard"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DashboardView onNavigate={setActiveMenu} />
          </motion.div>
        )
    }
  }

  if (!mounted) {
    return null // Prevent hydration issues
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Guest Mode Modal - Shows on first visit */}
      {!guestNickname && <GuestModeModal onComplete={handleGuestComplete} />}

      <div className="flex">
        {/* Desktop Sidebar */}
        <AppSidebar 
          activeMenu={activeMenu} 
          onMenuChange={setActiveMenu}
          guestNickname={guestNickname || "게스트"}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <AppHeader
            onRandomRecipe={handleRandomRecipe}
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
            guestNickname={guestNickname || "게스트"}
          />

          {/* Content Area */}
          <main className="flex-1 p-4 pb-20 lg:pb-6 lg:p-6 max-w-7xl mx-auto w-full">
            {renderView()}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* LLM Recipe Modal */}
      <LLMRecipeModal open={showRecipeModal} onOpenChange={setShowRecipeModal} />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

