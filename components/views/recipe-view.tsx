"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ChefHat, Beef, TrendingUp, Wand2, Shuffle, Star, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRecipes, getSavedRecipes, addRecipeBookmark, removeRecipeBookmark, deleteSavedRecipe } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type { Recipe } from "@/constants/mockData";
import { LLMRecipeModal } from "@/components/llm-recipe-modal";
import { PorkIcon } from "@/components/icons/pork-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categories = ["전체", "돼지고기", "소고기"];
type ViewMode = "all" | "bookmarks";

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
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIRandomModal, setShowAIRandomModal] = useState(false);
  const [showFridgeRandomModal, setShowFridgeRandomModal] = useState(false);
  const [showSavedRecipeModal, setShowSavedRecipeModal] = useState(false);
  const [selectedRecipeContent, setSelectedRecipeContent] = useState<string>("");
  const [selectedRecipeTitle, setSelectedRecipeTitle] = useState<string>("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmRecipeId, setDeleteConfirmRecipeId] = useState<string | null>(null);

  useEffect(() => {
    loadAllRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [activeCategory, viewMode, allRecipes]);

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
    let list = allRecipes;
    if (viewMode === "bookmarks") list = list.filter((r) => r.isBookmarked);
    if (activeCategory !== "전체") list = list.filter((r) => r.meatType === activeCategory);
    setRecipes(list);
  };

  const handleToggleBookmark = async (e: React.MouseEvent, recipeId: string, isBookmarked: boolean) => {
    e.stopPropagation();
    if (bookmarkingId) return;
    const id = parseInt(recipeId, 10);
    const nextBookmarked = !isBookmarked;
    setBookmarkingId(recipeId);
    // 낙관적 업데이트: 화면은 즉시 반영
    setAllRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, isBookmarked: nextBookmarked } : r))
    );
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, isBookmarked: nextBookmarked } : r))
    );
    try {
      if (isBookmarked) await removeRecipeBookmark(id);
      else await addRecipeBookmark(id);
      toast({
        title: isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가",
        description: isBookmarked ? "즐겨찾기에서 제거되었습니다." : "즐겨찾기에 추가되었습니다.",
      });
    } catch (err) {
      setAllRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, isBookmarked } : r))
      );
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, isBookmarked } : r))
      );
      toast({ title: "오류", description: "즐겨찾기 변경에 실패했습니다.", variant: "destructive" });
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleDeleteRecipeClick = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeleteConfirmRecipeId(recipeId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecipeId) return;
    setDeletingId(deleteConfirmRecipeId);
    setDeleteConfirmRecipeId(null);
    try {
      await deleteSavedRecipe(parseInt(deleteConfirmRecipeId, 10));
      await loadAllRecipes();
    } catch (err) {
      toast({ title: "삭제 실패", description: "레시피 삭제에 실패했습니다.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecipeClick = async (recipeId: string) => {
    try {
      const response = await getSavedRecipes();
      const savedRecipe = response.recipes.find((r) => String(r.id) === recipeId);
      if (savedRecipe) {
        setSelectedRecipeId(recipeId);
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

      {/* 1행: 전체 / 즐겨찾기 */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "bookmarks"] as const).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {mode === "all" ? "전체" : "즐겨찾기"}
          </motion.button>
        ))}
      </div>

      {/* 2행: 전체 / 돼지고기 / 소고기 */}
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
                  <div className={cn(
                    "w-20 h-20 rounded-xl flex items-center justify-center shrink-0",
                    recipe.meatType === "돼지고기"
                      ? "bg-gradient-to-br from-pink-100 to-pink-50"
                      : "bg-gradient-to-br from-primary/20 to-primary/10"
                  )}>
                    {recipe.meatType === "돼지고기" ? (
                      <PorkIcon size={32} className="text-pink-600" />
                    ) : (
                      <Beef className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg">
                        {recipe.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(e, recipe.id, !!recipe.isBookmarked)}
                          disabled={bookmarkingId === recipe.id}
                          className="p-1 rounded-md hover:bg-secondary transition-colors"
                          aria-label={recipe.isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                          <Star
                            className={cn(
                              "w-8 h-8",
                              recipe.isBookmarked ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                            )}
                          />
                        </button>
                        <Badge
                          className={cn(
                            "text-[10px]",
                            getDifficultyColor(recipe.difficulty)
                          )}
                        >
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {recipe.meatType}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.cookingTime}분
                        </span>
                        {recipe.isPopular && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            인기
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => handleDeleteRecipeClick(e, recipe.id)}
                        disabled={deletingId === recipe.id}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        aria-label="레시피 삭제"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
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
        onOpenChange={(open) => {
          setShowSavedRecipeModal(open);
          if (!open) setSelectedRecipeId(null);
        }}
        initialContent={selectedRecipeContent}
        initialTitle={selectedRecipeTitle}
        savedRecipeId={selectedRecipeId ? parseInt(selectedRecipeId, 10) : undefined}
        onRecipeDeleted={() => {
          setShowSavedRecipeModal(false);
          setSelectedRecipeId(null);
          loadAllRecipes();
        }}
      />

      {/* 레시피 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteConfirmRecipeId} onOpenChange={(open) => !open && setDeleteConfirmRecipeId(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">레시피 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              저장 목록에서 이 레시피를 삭제합니다. 삭제된 레시피는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
