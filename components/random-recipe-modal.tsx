"use client"

import { useState } from "react"
import { Wand2, Clock, Users, Flame, ChefHat, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RandomRecipeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const randomRecipes = [
  {
    name: "한우 등심 스테이크",
    description: "완벽한 미디엄 레어로 굽는 프리미엄 스테이크",
    time: "30분",
    servings: 2,
    calories: 450,
    difficulty: "중급",
    tips: "상온에서 30분 숙성 후 굽기",
  },
  {
    name: "매콤 돼지불고기",
    description: "고추장 양념에 잰 달콤 매콤한 불고기",
    time: "40분",
    servings: 3,
    calories: 380,
    difficulty: "초급",
    tips: "양파를 넉넉히 넣으면 더 맛있어요",
  },
  {
    name: "닭볶음탕",
    description: "감자와 당면이 들어간 얼큰한 닭볶음탕",
    time: "50분",
    servings: 4,
    calories: 320,
    difficulty: "초급",
    tips: "청양고추로 매운맛 조절 가능",
  },
  {
    name: "양갈비 로즈마리 구이",
    description: "허브 향 가득한 고급스러운 양갈비",
    time: "45분",
    servings: 2,
    calories: 520,
    difficulty: "고급",
    tips: "로즈마리 오일에 하루 마리네이드",
  },
]

export function RandomRecipeModal({ open, onOpenChange }: RandomRecipeModalProps) {
  const [currentRecipe, setCurrentRecipe] = useState(() => 
    randomRecipes[Math.floor(Math.random() * randomRecipes.length)]
  )
  const [isSpinning, setIsSpinning] = useState(false)

  const handleSpin = () => {
    setIsSpinning(true)
    setTimeout(() => {
      const newRecipe = randomRecipes[Math.floor(Math.random() * randomRecipes.length)]
      setCurrentRecipe(newRecipe)
      setIsSpinning(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Wand2 className="w-5 h-5 text-primary" />
            랜덤 레시피 마법봉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Recipe Card */}
          <div 
            className={`bg-secondary rounded-2xl p-5 transition-all duration-300 ${
              isSpinning ? "opacity-50 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{currentRecipe.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{currentRecipe.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-card rounded-xl">
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">조리시간</p>
                <p className="text-sm font-semibold text-foreground">{currentRecipe.time}</p>
              </div>
              <div className="text-center p-2 bg-card rounded-xl">
                <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">인분</p>
                <p className="text-sm font-semibold text-foreground">{currentRecipe.servings}인분</p>
              </div>
              <div className="text-center p-2 bg-card rounded-xl">
                <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">칼로리</p>
                <p className="text-sm font-semibold text-foreground">{currentRecipe.calories}kcal</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge className="bg-primary/10 text-primary border-0">
                {currentRecipe.difficulty}
              </Badge>
              <p className="text-xs text-muted-foreground italic">
                💡 {currentRecipe.tips}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2 bg-transparent"
              onClick={handleSpin}
              disabled={isSpinning}
            >
              <RefreshCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
              다시 뽑기
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onOpenChange(false)}
            >
              레시피 보기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
