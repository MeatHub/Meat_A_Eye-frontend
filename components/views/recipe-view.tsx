"use client"

import { useState } from "react"
import { Search, Clock, Users, ChefHat, Beef, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const categories = ["전체", "소고기", "돼지고기", "닭고기", "양고기"]

const recipes = [
  {
    id: 1,
    name: "한우 등심 스테이크",
    category: "소고기",
    time: "30분",
    servings: 2,
    difficulty: "중급",
    calories: 450,
  },
  {
    id: 2,
    name: "삼겹살 김치찌개",
    category: "돼지고기",
    time: "40분",
    servings: 4,
    difficulty: "초급",
    calories: 380,
  },
  {
    id: 3,
    name: "닭가슴살 샐러드",
    category: "닭고기",
    time: "15분",
    servings: 1,
    difficulty: "초급",
    calories: 250,
  },
  {
    id: 4,
    name: "양갈비 로즈마리 구이",
    category: "양고기",
    time: "45분",
    servings: 2,
    difficulty: "고급",
    calories: 520,
  },
  {
    id: 5,
    name: "불고기 덮밥",
    category: "소고기",
    time: "25분",
    servings: 2,
    difficulty: "초급",
    calories: 550,
  },
  {
    id: 6,
    name: "돼지갈비찜",
    category: "돼지고기",
    time: "90분",
    servings: 4,
    difficulty: "중급",
    calories: 420,
  },
]

export function RecipeView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("전체")

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "전체" || recipe.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="레시피 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="grid gap-3">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Beef className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">{recipe.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {recipe.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{recipe.category}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {recipe.servings}인분
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {recipe.calories}kcal
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  )
}
