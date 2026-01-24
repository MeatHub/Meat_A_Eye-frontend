"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2, Loader2, ChefHat, Clock, TrendingUp, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getFridgeItems, generateRecipeWithLLM } from "@/lib/api"
import type { FridgeItem, Recipe } from "@/constants/mockData"

interface LLMRecipeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LLMRecipeModal({ open, onOpenChange }: LLMRecipeModalProps) {
  const [loading, setLoading] = useState(false)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && recipes.length === 0) {
      generateRecipes()
    }
  }, [open])

  const generateRecipes = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get current fridge items
      const items = await getFridgeItems()
      setFridgeItems(items)

      if (items.length === 0) {
        setError("냉장고에 고기가 없습니다. 먼저 고기를 추가해주세요!")
        setLoading(false)
        return
      }

      // Generate recipes using LLM
      const generatedRecipes = await generateRecipeWithLLM(items)
      setRecipes(generatedRecipes)
    } catch (err) {
      console.error("Failed to generate recipes:", err)
      setError("레시피 생성에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급":
        return "bg-green-100 text-green-700 border-green-300"
      case "중급":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "고급":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-primary">
            <Wand2 className="w-6 h-6" />
            AI 마법사의 레시피 추천
          </DialogTitle>
          <DialogDescription>
            냉장고에 있는 고기들로 만들 수 있는 최고의 레시피 3가지를 추천해드립니다
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <AnimatePresence mode="wait">
            {loading ? (
              // Loading State with Burgundy Animation
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full"
                  />
                  <Wand2 className="w-12 h-12 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mt-6 text-lg text-primary font-semibold"
                >
                  AI가 특별한 레시피를 찾고 있습니다...
                </motion.p>
                <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
              </motion.div>
            ) : error ? (
              // Error State
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12"
              >
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-900 mb-2">오류 발생</h3>
                      <p className="text-red-700">{error}</p>
                  <Button
                    onClick={generateRecipes}
                    className="mt-4 bg-primary hover:bg-primary/90"
                  >
                        다시 시도하기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : selectedRecipe ? (
              // Recipe Detail View
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 py-4"
              >
                <Button
                  onClick={() => setSelectedRecipe(null)}
                  variant="ghost"
                  className="text-burgundy hover:text-burgundy-light"
                >
                  ← 목록으로 돌아가기
                </Button>

                <Card className="bg-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-primary mb-2">
                          {selectedRecipe.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {selectedRecipe.meatType} 요리
                        </CardDescription>
                      </div>
                      <ChefHat className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                        {selectedRecipe.difficulty}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedRecipe.cookingTime}분
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ingredients */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                          1
                        </span>
                        재료
                      </h3>
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedRecipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    {/* Instructions */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                          2
                        </span>
                        조리 방법
                      </h3>
                      <div className="space-y-4">
                        {selectedRecipe.instructions.map((instruction, idx) => (
                          <div key={idx} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <p className="text-sm pt-0.5">{instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              // Recipe List View
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4"
              >
              {/* Fridge Items Summary */}
              {fridgeItems.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm text-primary">현재 냉장고에 있는 고기</CardTitle>
                  </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {fridgeItems.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.partName} ({item.weight}g)
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recipe Cards */}
                <div className="space-y-4">
                  {recipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                    <Card
                      className="bg-card border-primary/20 cursor-pointer hover:border-primary/50 transition-all shadow-md hover:shadow-lg"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <CardTitle className="text-xl">{recipe.name}</CardTitle>
                              </div>
                              <CardDescription>{recipe.meatType} 요리</CardDescription>
                          </div>
                          <ChefHat className="w-6 h-6 text-primary" />
                        </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={getDifficultyColor(recipe.difficulty)}>
                              {recipe.difficulty}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {recipe.cookingTime}분
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <TrendingUp className="w-3 h-3" />
                              AI 추천
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            클릭하여 자세한 레시피 확인하기 →
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Regenerate Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generateRecipes}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    다른 레시피 추천받기
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

