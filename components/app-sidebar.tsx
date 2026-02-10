"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  BookOpen,
  Refrigerator,
  Beef,
  Lightbulb,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFridgeItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FridgeItemResponse } from "@/src/types/api";

interface AppSidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "analysis", label: "AI 분석", icon: ScanLine },
  { id: "fridge", label: "냉장고 관리", icon: Refrigerator },
  { id: "recipe", label: "레시피 탐색", icon: BookOpen },
];

const meatFacts = [
  "한우의 마블링은 근내지방도라고 부르며, 1++등급은 마블링 비율이 가장 높습니다.",
  "돼지고기는 비타민 B1이 소고기의 10배나 함유되어 있습니다.",
  "양고기의 특유 냄새는 카프릴산 때문이며, 로즈마리로 중화할 수 있습니다.",
  "닭가슴살 100g에는 약 31g의 단백질이 들어있습니다.",
];

// 17부위 영문 → 한글 표시 (최근 분석 결과 등)
const PART_DISPLAY_NAMES: Record<string, string> = {
  Beef_Tenderloin: "소/안심",
  Beef_Ribeye: "소/등심",
  Beef_Sirloin: "소/채끝",
  Beef_Chuck: "소/목심",
  Beef_Round: "소/우둔",
  Beef_BottomRound: "소/설도",
  Beef_Brisket: "소/양지",
  Beef_Shank: "소/사태",
  Beef_Rib: "소/갈비",
  Beef_Shoulder: "소/앞다리",
  Pork_Tenderloin: "돼지/안심",
  Pork_Loin: "돼지/등심",
  Pork_Neck: "돼지/목심",
  Pork_PicnicShoulder: "돼지/앞다리",
  Pork_Ham: "돼지/뒷다리",
  Pork_Belly: "돼지/삼겹살",
  Pork_Ribs: "돼지/갈비",
  Import_Beef_Rib_AU: "수입 소고기/갈비(호주)",
  Import_Beef_Ribeye_AU: "수입 소고기/갈비살(호주)",
  Import_Pork_Belly: "수입 돼지고기/삼겹살",
};
function getPartDisplayName(name: string): string {
  return PART_DISPLAY_NAMES[name] ?? name;
}

// 최근 분석 결과 컴포넌트
function RecentAnalysisResults({ onNavigate }: { onNavigate: (menu: string) => void }) {
  const [recentItems, setRecentItems] = useState<FridgeItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await getFridgeItems();
        // 최근 추가된 순서로 정렬 (ID 기준 내림차순)
        const sorted = res.items
          .filter((i) => i.status === "stored")
          .sort((a, b) => b.id - a.id)
          .slice(0, 3);
        setRecentItems(sorted);
      } catch (error) {
        console.error("Failed to load recent items:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRecent();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-card to-card/50 rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground">
            최근 분석 결과
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("analysis")}
          className="h-6 px-2 text-[10px] text-primary hover:text-primary/80"
        >
          더보기 →
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      ) : recentItems.length === 0 ? (
        <div className="text-center py-4">
          <Beef className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground mb-2">
            아직 분석한 고기가 없습니다
          </p>
          <Button
            onClick={() => onNavigate("analysis")}
            size="sm"
            className="h-6 px-3 text-[10px] bg-primary hover:bg-primary/90"
          >
            분석하기
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {recentItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="p-2 rounded-lg bg-background/60 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => onNavigate("fridge")}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground truncate flex-1">
                  {getPartDisplayName(item.name)}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1.5 ml-1 border-primary/30 text-primary"
                >
                  D-{item.dDay}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(item.expiryDate).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function AppSidebar({
  activeMenu,
  onMenuChange,
}: AppSidebarProps) {
  const [factIndex] = useState(() =>
    Math.floor(Math.random() * meatFacts.length)
  );

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo Header - 클릭시 홈화면 복귀 */}
      <button
        onClick={() => onMenuChange("dashboard")}
        className="w-full p-6 border-b border-border hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Beef className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Meat-A-Eye</h1>
            <p className="text-xs text-muted-foreground">
              AI 축산물 인식 서비스
            </p>
          </div>
        </div>
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <li key={item.id}>
                <motion.button
                  onClick={() => onMenuChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-secondary"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Widget - 최근 분석 결과 */}
      <div className="p-4 space-y-3 border-t border-border">
        {/* 최근 분석 결과 */}
        <RecentAnalysisResults onNavigate={onMenuChange} />
        
        {/* Today's Meat Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              오늘의 고기 상식
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {meatFacts[factIndex]}
          </p>
        </motion.div>
      </div>
    </aside>
  );
}
