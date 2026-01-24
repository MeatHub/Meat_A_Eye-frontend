"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Clock, ChefHat, Beef, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getRecipes } from "@/lib/api"
import type { Recipe } from "@/constants/mockData"

const categories = ["전체", "소고기", "돼지고기", "닭고기"]

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

export function RecipeView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("전체")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipes()
  }, [activeCategory])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const meatType = activeCategory === "전체" ? undefined : activeCategory
      const data = await getRecipes(meatType)
      setRecipes(data)
    } catch (error) {
      console.error("Failed to load recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => {
    return recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">레시피를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ChefHat className="w-5 h-5" />
            레시피 탐색
          </CardTitle>
          <CardDescription>부위별 다양한 요리법을 찾아보세요</CardDescription>
        </CardHeader>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="레시피 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl h-12"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <motion.button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="grid gap-4">
        {filteredRecipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="bg-card border-primary/20 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                    <Beef className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{recipe.name}</h3>
                      <Badge className={cn("text-[10px] shrink-0", getDifficultyColor(recipe.difficulty))}>
                        {recipe.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{recipe.meatType}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.cookingTime}분
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        인기
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </motion.div>
      )}
    </div>
  )
}
