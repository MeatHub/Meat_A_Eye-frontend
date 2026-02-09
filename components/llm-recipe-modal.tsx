"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, ChefHat, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateRecipeWithLLM, getFridgeItems } from "@/lib/api";
import type { FridgeItemResponse } from "@/src/types/api";
import ReactMarkdown from "react-markdown";
import { Calendar, Package } from "lucide-react";

interface LLMRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 재료 섹션을 정리하는 함수 - 줄 단위로 처리하여 카테고리별로 분리
function preprocessIngredientsSection(markdown: string): string {
  const lines = markdown.split("\n");
  let ingredientsStartIndex = -1;
  let ingredientsEndIndex = -1;

  // 재료 섹션 찾기
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "## 재료" || line.startsWith("## 재료")) {
      ingredientsStartIndex = i;
    } else if (
      ingredientsStartIndex !== -1 &&
      (line.startsWith("## ") || line.startsWith("# "))
    ) {
      ingredientsEndIndex = i;
      break;
    }
  }

  if (ingredientsStartIndex === -1) {
    return markdown;
  }

  if (ingredientsEndIndex === -1) {
    ingredientsEndIndex = lines.length;
  }

  // 재료 섹션의 각 줄을 순회하면서 카테고리별로 분리
  const ingredientsSection = lines.slice(
    ingredientsStartIndex + 1,
    ingredientsEndIndex,
  );

  const categoryPattern = /^([가-힣]+(?:\s+[가-힣]+)*):\s*(.*)$/;
  const processedLines: string[] = [];
  let currentCategory: string | null = null;
  let currentContent: string[] = [];

  for (const line of ingredientsSection) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue; // 빈 줄 무시

    const match = trimmedLine.match(categoryPattern);

    if (match) {
      // 새 카테고리 발견
      // 이전 카테고리 저장
      if (currentCategory) {
        const content = currentContent.join(" ").trim();
        if (content) {
          processedLines.push(`${currentCategory}: ${content}`);
        }
      }
      // 새 카테고리 시작
      currentCategory = match[1];
      currentContent = match[2] ? [match[2]] : [];
    } else {
      // 카테고리 패턴이 없으면 현재 카테고리의 내용에 추가
      if (currentCategory) {
        currentContent.push(trimmedLine);
      } else {
        // 카테고리가 없는 경우 (첫 줄이 카테고리가 아닌 경우)
        processedLines.push(trimmedLine);
      }
    }
  }

  // 마지막 카테고리 저장
  if (currentCategory) {
    const content = currentContent.join(" ").trim();
    if (content) {
      processedLines.push(`${currentCategory}: ${content}`);
    }
  }

  // 재료 섹션 교체
  const beforeIngredients = lines.slice(0, ingredientsStartIndex + 1);
  const afterIngredients = lines.slice(ingredientsEndIndex);
  const newLines = [
    ...beforeIngredients,
    ...processedLines,
    ...afterIngredients,
  ];

  return newLines.join("\n");
}

// 에러 메시지 정리 함수
function formatErrorMessage(err: any): string {
  if (!err?.message) {
    return "레시피 생성에 실패했습니다. 다시 시도해주세요.";
  }

  const messageStr = String(err.message);

  // 429 에러 (할당량 초과) 처리
  if (
    messageStr.includes("429") ||
    messageStr.includes("RESOURCE_EXHAUSTED") ||
    messageStr.includes("quota")
  ) {
    return "API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }

  // JSON 객체 문자열이 포함된 경우 제거
  const jsonMatch = messageStr.match(/^(\d+\s+\w+\.?\s*)/);
  if (jsonMatch) {
    return jsonMatch[1].trim() + " - 잠시 후 다시 시도해주세요.";
  }

  // 너무 긴 메시지는 잘라내기
  if (messageStr.length > 200) {
    return messageStr.substring(0, 200) + "...";
  }

  return messageStr;
}

export function LLMRecipeModal({ open, onOpenChange }: LLMRecipeModalProps) {
  const [loading, setLoading] = useState(false);
  const [recipeMarkdown, setRecipeMarkdown] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([]);

  const generateRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecipeMarkdown("");
    setFridgeItems([]);

    try {
      // 냉장고 아이템 조회
      const fridgeResponse = await getFridgeItems();
      const storedItems = fridgeResponse.items.filter(
        (item) => item.status === "stored",
      );
      setFridgeItems(storedItems);

      if (storedItems.length === 0) {
        setError("냉장고에 고기가 없습니다. 먼저 고기를 추가해주세요!");
        setLoading(false);
        return;
      }

      // 백엔드가 냉장고 아이템을 조회하므로 빈 배열만 전송
      const recipe = await generateRecipeWithLLM([]);

      // 재료 섹션 전처리
      const processedRecipe = preprocessIngredientsSection(recipe);
      setRecipeMarkdown(processedRecipe);
    } catch (err: any) {
      console.error("Failed to generate recipes:", err);
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      generateRecipes();
    }
  }, [open, generateRecipes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card max-h-[90vh] !grid grid-rows-[auto_1fr] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl text-primary">
            <Wand2 className="w-6 h-6" />
            AI 마법사의 레시피 추천
          </DialogTitle>
          <DialogDescription>
            냉장고에 있는 고기들로 만들 수 있는 특별한 레시피를 추천해드립니다
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-6 min-h-0">
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
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
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
                <p className="text-sm text-muted-foreground mt-2">
                  잠시만 기다려주세요
                </p>
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
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        오류 발생
                      </h3>
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
                  <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5 border-primary/20 shadow-md">
                    <CardContent className="pt-6 pb-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          냉장고 현황
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {fridgeItems.map((item) => {
                            const expiryDate = new Date(item.expiryDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            expiryDate.setHours(0, 0, 0, 0);
                            const daysUntilExpiry = Math.ceil(
                              (expiryDate.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );

                            return (
                              <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-primary/20 p-4 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-base text-foreground">
                                    {item.name}
                                  </h4>
                                  <Badge
                                    variant={
                                      daysUntilExpiry <= 3
                                        ? "destructive"
                                        : daysUntilExpiry <= 7
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    D-{daysUntilExpiry}
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                      유통기한:{" "}
                                      {expiryDate.toLocaleDateString("ko-KR")}
                                    </span>
                                  </div>
                                  {item.traceNumber && (
                                    <div className="text-xs text-muted-foreground/80">
                                      이력번호: {item.traceNumber}
                                    </div>
                                  )}
                                  {item.grade && (
                                    <div className="text-xs text-primary font-medium">
                                      등급: {item.grade}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
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
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-primary mb-4">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => {
                            const text =
                              typeof children === "string"
                                ? children
                                : String(children);
                            const isRecipeSection =
                              text.includes("재료") ||
                              text.includes("조리 방법") ||
                              text.includes("조리방법") ||
                              text.includes("팁");
                            return (
                              <h2
                                className={`text-xl font-semibold mt-6 mb-3 ${isRecipeSection ? "text-primary" : "text-foreground"}`}
                              >
                                {children}
                              </h2>
                            );
                          },
                          h3: ({ children }) => (
                            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-2 my-4">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-2 my-4">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-foreground leading-relaxed">
                              {children}
                            </li>
                          ),
                          p: ({ children }) => {
                            const text =
                              typeof children === "string"
                                ? children
                                : String(children);

                            // 카테고리:내용 형식인지 확인 (전처리된 재료 섹션)
                            const categoryMatch = text.match(
                              /^([가-힣]+(?:\s+[가-힣]+)*):\s*(.+)$/,
                            );
                            if (categoryMatch) {
                              const [, category, content] = categoryMatch;
                              return (
                                <div className="flex flex-row items-start gap-3 pb-3 border-b border-border/30 last:border-b-0 last:pb-0">
                                  <span className="font-semibold text-primary text-base whitespace-nowrap flex-shrink-0 leading-tight">
                                    {category}:
                                  </span>
                                  <span className="text-base text-foreground/90 leading-relaxed flex-1 min-w-0">
                                    {content}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <p className="text-sm text-foreground my-2 leading-relaxed whitespace-pre-line">
                                {children}
                              </p>
                            );
                          },
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {recipeMarkdown}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Regenerate Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
