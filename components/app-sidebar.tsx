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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFridgeItems } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export function AppSidebar({
  activeMenu,
  onMenuChange,
}: AppSidebarProps) {
  const [factIndex] = useState(() =>
    Math.floor(Math.random() * meatFacts.length)
  );
  const [expiryData, setExpiryData] = useState<
    { range: string; count: number }[]
  >([
    { range: "D-0~1", count: 0 },
    { range: "D-2~3", count: 0 },
    { range: "D-4~7", count: 0 },
    { range: "D-8+", count: 0 },
  ]);

  useEffect(() => {
    const loadFridgeExpiry = async () => {
      try {
        const res = await getFridgeItems();
        const stored = (res.items || []).filter((i) => i.status === "stored");
        setExpiryData([
          { range: "D-0~1", count: stored.filter((i) => i.dDay <= 1).length },
          {
            range: "D-2~3",
            count: stored.filter((i) => i.dDay >= 2 && i.dDay <= 3).length,
          },
          {
            range: "D-4~7",
            count: stored.filter((i) => i.dDay >= 4 && i.dDay <= 7).length,
          },
          { range: "D-8+", count: stored.filter((i) => i.dDay >= 8).length },
        ]);
      } catch (error) {
        console.error("Failed to load fridge for expiry:", error);
      }
    };
    loadFridgeExpiry();
  }, []);

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

      {/* Bottom Widget */}
      <div className="p-4 space-y-3">
        {/* Today's Meat Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary rounded-xl p-4"
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

        {/* 유통기한 임박도 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-secondary rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              유통기한 임박도
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            고기 유통기한 분포
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={expiryData}>
              <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="range"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "10px" }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "10px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </aside>
  );
}
