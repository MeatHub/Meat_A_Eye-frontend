"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ChefHat, Beef, TrendingUp, Wand2, Loader2, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRecipes, getSavedRecipes } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import type { Recipe } from "@/constants/mockData";
import { LLMRecipeModal } from "@/components/llm-recipe-modal";

const categories = ["전체", "소고기", "돼지고기"];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "초급":
      return "bg-green-100 text-green-700 border-green-300";
    case "중급":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "고급":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

interface RecipeViewProps {
  onOpenLLMRecipe: () => void;
}

export function RecipeView({ onOpenLLMRecipe }: RecipeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // 전체 레시피 캐시
  const [loading, setLoading] = useState(true);
  const [showAIRandomModal, setShowAIRandomModal] = useState(false);
  const [showFridgeRandomModal, setShowFridgeRandomModal] = useState(false);
  const [showSavedRecipeModal, setShowSavedRecipeModal] = useState(false);
  const [selectedRecipeContent, setSelectedRecipeContent] = useState<string>("");
  const [selectedRecipeTitle, setSelectedRecipeTitle] = useState<string>("");

  // 초기 로드만 실행
  useEffect(() => {
    loadAllRecipes();
  }, []);

  // 카테고리 변경 시 필터링만 수행 (로딩 없이)
  useEffect(() => {
    filterRecipes();
  }, [activeCategory, allRecipes]);

  const loadAllRecipes = async () => {
    setLoading(true);
    try {
      const data = await getRecipes(); // 전체 레시피 로드
      setAllRecipes(data);
      setRecipes(data);
    } catch (error) {
      console.error("Failed to load recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    if (activeCategory === "전체") {
      setRecipes(allRecipes);
    } else {
      const filtered = allRecipes.filter((recipe) => recipe.meatType === activeCategory);
      setRecipes(filtered);
    }
  };

  const handleRecipeClick = async (recipeId: string) => {
    try {
      // 저장된 레시피 전체 정보 가져오기
      const response = await getSavedRecipes();
      const savedRecipe = response.recipes.find((r) => String(r.id) === recipeId);
      if (savedRecipe) {
        setSelectedRecipeContent(savedRecipe.content);
        setSelectedRecipeTitle(savedRecipe.title);
        setShowSavedRecipeModal(true);
      }
    } catch (error) {
      console.error("Failed to load recipe details:", error);
      toast({
        title: "레시피를 불러올 수 없습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    return recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
  });


  // 초기 로딩만 전체 화면 표시
  if (loading && allRecipes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card + AI 레시피 CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ChefHat className="w-5 h-5" />
                레시피 탐색
              </CardTitle>
              <CardDescription>
                부위별 다양한 요리법을 찾아보세요
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => setShowAIRandomModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm"
                >
                  <Wand2 className="w-4 h-4" />
                  AI로 레시피 생성
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => setShowFridgeRandomModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary hover:bg-primary/10 font-medium text-sm"
                >
                  <Shuffle className="w-4 h-4" />
                  냉장고 랜덤 레시피
                </button>
              </motion.div>
            </div>
          </div>
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
            <Card 
              className="bg-card border-primary/20 shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleRecipeClick(recipe.id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                    <Beef className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg">
                        {recipe.name}
                      </h3>
                      <Badge
                        className={cn(
                          "text-[10px] shrink-0",
                          getDifficultyColor(recipe.difficulty)
                        )}
                      >
                        {recipe.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {recipe.meatType}
                    </p>
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

      {/* AI 랜덤 레시피 모달 (아무 고기) */}
      <LLMRecipeModal
        open={showAIRandomModal}
        onOpenChange={setShowAIRandomModal}
        source="ai_random"
        onRecipeSaved={loadAllRecipes}
      />

      {/* 냉장고 랜덤 레시피 모달 */}
      <LLMRecipeModal
        open={showFridgeRandomModal}
        onOpenChange={setShowFridgeRandomModal}
        source="fridge_random"
        onRecipeSaved={loadAllRecipes}
      />

      {/* 저장된 레시피 상세 보기 모달 */}
      <LLMRecipeModal
        open={showSavedRecipeModal}
        onOpenChange={setShowSavedRecipeModal}
        initialContent={selectedRecipeContent}
        initialTitle={selectedRecipeTitle}
      />
    </div>
  );
}
