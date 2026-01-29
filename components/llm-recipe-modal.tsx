"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wand2, Loader2, ChefHat, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getFridgeItems, generateRecipeWithLLM } from "@/lib/api"
import type { FridgeItemResponse } from "@/types/api"
import ReactMarkdown from "react-markdown"

interface LLMRecipeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LLMRecipeModal({ open, onOpenChange }: LLMRecipeModalProps) {
  const [loading, setLoading] = useState(false)
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([])
  const [recipeMarkdown, setRecipeMarkdown] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      generateRecipes()
    }
  }, [open])

  const generateRecipes = async () => {
    setLoading(true)
    setError(null)
    setRecipeMarkdown("")

    try {
      // Get current fridge items
      const response = await getFridgeItems()
      const items = response.items.filter(item => item.status === "stored")
      setFridgeItems(items)

      if (items.length === 0) {
        setError("냉장고에 고기가 없습니다. 먼저 고기를 추가해주세요!")
        setLoading(false)
        return
      }

      // Generate recipe using LLM
      const fridgeItemsForLLM = items.map(item => ({
        partName: item.name,
        name: item.name,
      }))
      
      const recipe = await generateRecipeWithLLM(fridgeItemsForLLM)
      setRecipeMarkdown(recipe)
    } catch (err: any) {
      console.error("Failed to generate recipes:", err)
      setError(err.message || "레시피 생성에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
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
            냉장고에 있는 고기들로 만들 수 있는 특별한 레시피를 추천해드립니다
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <AnimatePresence mode="wait">
            {loading ? (
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
            ) : recipeMarkdown ? (
              <motion.div
                key="recipe"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4"
              >
                {/* Fridge Items Summary */}
                {fridgeItems.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold text-primary mb-2">현재 냉장고에 있는 고기</h3>
                        <div className="flex flex-wrap gap-2">
                          {fridgeItems.map((item) => (
                            <Badge key={item.id} variant="secondary" className="text-xs">
                              {item.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recipe Content */}
                <Card className="bg-card border-primary/20">
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold text-primary mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 my-4">{children}</ol>,
                          li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                          p: ({ children }) => <p className="text-sm text-foreground my-2">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        }}
                      >
                        {recipeMarkdown}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>

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
            ) : null}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

