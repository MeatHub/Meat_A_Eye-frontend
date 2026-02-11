"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFridgeItems,
  addFridgeItem,
  deleteFridgeItem,
  updateFridgeItemStatus,
  updateFridgeItem,
  getMeatInfoList,
  getNutritionInfo,
  getTraceabilityByNumber,
  getIsGuest,
  getAuthToken,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { FridgeItemResponse } from "@/src/types/api";

export function FridgeView() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [meatInfoList, setMeatInfoList] = useState<
    Array<{
      id: number;
      name: string;
      displayName?: string | null;
      category: string;
      calories: number | null;
      protein: number | null;
      fat: number | null;
      storageGuide: string | null;
    }>
  >([]);
  const [editForm, setEditForm] = useState<{
    meatInfoId: number | null;
    customName: string;
    desiredConsumptionDate: string;
  }>({ meatInfoId: null, customName: "", desiredConsumptionDate: "" });
  const [nutritionData, setNutritionData] = useState<{
    [itemId: number]: {
      calories: number | null;
      protein: number | null;
      fat: number | null;
      carbohydrate: number | null;
    } | null;
  }>({});
  const [loadingNutrition, setLoadingNutrition] = useState<{
    [itemId: number]: boolean;
  }>({});
  const [newItem, setNewItem] = useState({
    meatId: "",
    storageDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  useEffect(() => {
    // 게스트 모드 체크
    const checkGuestMode = () => {
      const token = getAuthToken();
      const guest = getIsGuest();
      if (!token || guest) {
        setIsGuest(true);
        return false;
      }
      setIsGuest(false);
      return true;
    };

    if (!checkGuestMode()) {
      return; // 게스트 모드면 초기화하지 않음
    }

    const initialize = async () => {
      await loadMeatInfoList();
      await loadFridgeItems();
    };
    initialize();
  }, []);

  const loadMeatInfoList = async () => {
    try {
      const list = await getMeatInfoList();
      setMeatInfoList(list);
      return list;
    } catch (error: any) {
      console.error("Failed to load meat info list:", error);
      return [];
    }
  };

  const loadFridgeItems = async () => {
    try {
      const response = await getFridgeItems();
      setFridgeItems(response.items);

      // meatInfoList가 로드되지 않았으면 기다림
      let currentMeatInfoList = meatInfoList;
      if (currentMeatInfoList.length === 0) {
        currentMeatInfoList = (await loadMeatInfoList()) || [];
      }

      // 각 아이템의 영양정보 자동 로드
      for (const item of response.items) {
        // meatInfoId가 없거나 0이면 영양정보 로드하지 않음
        if (!item.meatInfoId || item.meatInfoId === 0) {
          continue;
        }

        let grade: string | null = item.grade || null;
        let partName: string | null = null;

        // 이력번호가 있고 등급이 없으면 이력정보 API 호출 (수입 이력번호만)
        if (item.traceNumber && !grade) {
          // 국내 이력번호인지 확인 (12자리 숫자 또는 L로 시작하는 묶음번호)
          const isDomesticTrace = /^\d{12}$/.test(item.traceNumber);
          const isDomesticBundle = /^L\d+$/.test(item.traceNumber);
          const isDomestic = isDomesticTrace || isDomesticBundle;

          // 수입 이력번호만 API 호출 (국내는 API 호출 안 함)
          if (!isDomestic) {
            try {
              const traceInfo = await getTraceabilityByNumber(
                item.traceNumber,
                "import"
              );
              grade = traceInfo.grade || null;
              partName = traceInfo.partName || null;
            } catch (error) {
              console.error(
                `Failed to load traceability for ${item.traceNumber}:`,
                error
              );
              // API 호출 실패해도 계속 진행 (부위명만으로 영양정보 찾기)
            }
          } else {
            // 국내 이력번호는 API 호출하지 않음 (등급 정보가 JSON에 없음)
            console.log(`국내 이력번호 ${item.traceNumber}는 API 호출 건너뜀`);
          }
        }

        // 부위명이 없으면 currentMeatInfoList에서 가져오기
        if (!partName) {
          const meatInfo = currentMeatInfoList.find(
            (m) => m.id === item.meatInfoId
          );
          if (meatInfo) {
            partName = meatInfo.name;
          } else if (item.name && item.name !== "부위 선택") {
            // currentMeatInfoList에 없으면 item.name 사용 (백엔드에서 이미 설정된 경우)
            partName = item.name;
          }
        }

        // 부위명이 있으면 영양정보 로드 (등급이 있으면 등급 포함, 없으면 부위명만)
        if (partName) {
          loadNutritionForItem(item.id, item.meatInfoId, partName, grade);
        }
      }
    } catch (error: any) {
      console.error("Failed to load fridge items:", error);
      toast({
        title: "로딩 실패",
        description:
          error.message || "냉장고 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 기능은 로그인 후 이용할 수 있습니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!newItem.meatId || !newItem.expiryDate) {
      const errorMsg = "필수 항목을 모두 입력해주세요.";
      // window.alert 제거 - UI 통합 알림만 사용
      toast({
        title: "입력 오류",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addFridgeItem({
        meatId: parseInt(newItem.meatId),
        storageDate: newItem.storageDate,
        expiryDate: newItem.expiryDate,
      });

      const successMsg = `냉장고에 고기가 추가되었습니다. (ID: ${result.id})`;
      toast({
        title: "추가 완료",
        description: successMsg,
        duration: 3000,
      });

      // Reload items
      await loadFridgeItems();

      // Reset form
      setNewItem({
        meatId: "",
        storageDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
      });
      setIsAddModalOpen(false);
    } catch (error: any) {
      const errorMsg = error.message || "고기 추가에 실패했습니다.";
      console.error("Failed to add item:", error);
      toast({
        title: "추가 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 기능은 로그인 후 이용할 수 있습니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    // confirm 제거 - 바로 삭제하고 toast로 알림만 표시
    try {
      await deleteFridgeItem(id);
      // 상태 업데이트 전에 toast 표시
      const successMsg = "고기가 삭제되었습니다.";
      toast({
        title: "삭제 완료",
        description: successMsg,
        duration: 3000,
      });
      // 상태 업데이트는 약간의 지연 후 실행하여 toast가 먼저 표시되도록
      setTimeout(() => {
        setFridgeItems((prev) => prev.filter((item) => item.id !== id));
      }, 100);
    } catch (error: any) {
      const errorMsg = error.message || "고기 삭제에 실패했습니다.";
      console.error("Failed to delete item:", error);
      toast({
        title: "삭제 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleConsumeItem = async (id: number) => {
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 기능은 로그인 후 이용할 수 있습니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      await updateFridgeItemStatus(id, "consumed");
      const successMsg = "고기가 소비됨으로 표시되었습니다.";
      toast({
        title: "상태 변경 완료",
        description: successMsg,
        duration: 3000,
      });
      await loadFridgeItems();
    } catch (error: any) {
      const errorMsg = error.message || "상태 변경에 실패했습니다.";
      console.error("Failed to update item status:", error);
      toast({
        title: "상태 변경 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleStartEdit = (item: FridgeItemResponse) => {
    setEditingItemId(item.id);
    setEditForm({
      meatInfoId: item.meatInfoId && item.meatInfoId > 0 ? item.meatInfoId : null,
      customName: item.customName ?? "",
      desiredConsumptionDate: item.desiredConsumptionDate
        ? new Date(item.desiredConsumptionDate).toISOString().split("T")[0]
        : "",
    });
    // 기존 부위가 있으면 영양정보는 미리 로드 (표시용)
    if (item.meatInfoId && item.meatInfoId > 0) {
      const meatInfo = meatInfoList.find((m) => m.id === item.meatInfoId);
      if (meatInfo) {
        loadNutritionForItem(
          item.id,
          item.meatInfoId,
          meatInfo.name,
          item.grade || null
        );
      }
    }
  };

  const loadNutritionForItem = async (
    itemId: number,
    meatInfoId: number,
    partName: string,
    grade: string | null = null
  ) => {
    setLoadingNutrition((prev) => ({ ...prev, [itemId]: true }));
    try {
      // 등급이 있으면 등급과 함께 호출, 없으면 부위명만으로 호출
      const nutrition = await getNutritionInfo(partName, grade || undefined);
      setNutritionData((prev) => ({
        ...prev,
        [itemId]: nutrition.default || null,
      }));
    } catch (error) {
      console.error("Failed to load nutrition:", error);
      setNutritionData((prev) => ({ ...prev, [itemId]: null }));
    } finally {
      setLoadingNutrition((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditForm({ meatInfoId: null, customName: "", desiredConsumptionDate: "" });
  };

  const handleSaveEdit = async (id: number) => {
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 기능은 로그인 후 이용할 수 있습니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (
      !editForm.meatInfoId ||
      editForm.meatInfoId === 0 ||
      editForm.meatInfoId === null
    ) {
      toast({
        title: "입력 오류",
        description: "고기 부위를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await updateFridgeItem(id, {
        meatInfoId: editForm.meatInfoId,
        customName: editForm.customName?.trim() || null,
        desiredConsumptionDate: editForm.desiredConsumptionDate || null,
      });
      setFridgeItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                name: res.name,
                customName: res.customName ?? i.customName,
              }
            : i
        )
      );

      // 저장 후 즉시 영양정보 로드
      const meatInfo = meatInfoList.find((m) => m.id === editForm.meatInfoId);
      const currentItem = fridgeItems.find((i) => i.id === id);
      if (meatInfo && currentItem) {
        await loadNutritionForItem(
          id,
          editForm.meatInfoId!,
          meatInfo.name,
          currentItem.grade || null
        );
      }

      toast({
        title: "수정 완료",
        description: "고기 정보가 수정되었습니다.",
        duration: 3000,
      });
      setEditingItemId(null);
      await loadFridgeItems();
    } catch (error: any) {
      const errorMsg = error.message || "수정에 실패했습니다.";
      console.error("Failed to update item:", error);
      toast({
        title: "수정 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const getDDay = (expiryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDDayColor = (daysLeft: number): "red" | "yellow" | "green" => {
    if (daysLeft <= 1) return "red";
    if (daysLeft <= 3) return "yellow";
    return "green";
  };

  // 게스트 모드일 때 접근 차단
  if (isGuest || (!getAuthToken() && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-card border-primary/20 max-w-md w-full">
          <CardContent className="py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">
                  로그인이 필요합니다
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  냉장고 기능은 로그인 후 이용할 수 있습니다.
                  <br />
                  게스트 모드에서는 냉장고 기능을 사용할 수 없습니다.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push("/login")}
                  className="bg-primary hover:bg-primary/90"
                >
                  로그인하기
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  회원가입
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            냉장고 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">냉장고 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            보관 중인 고기 {fridgeItems.filter((i) => i.status === "stored").length}개
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                추가하기
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="text-primary">고기 추가하기</DialogTitle>
              <DialogDescription>
                냉장고에 보관할 고기 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="meatId">고기 ID *</Label>
                <Input
                  id="meatId"
                  type="number"
                  placeholder="meat_info 테이블의 ID 입력"
                  value={newItem.meatId}
                  onChange={(e) =>
                    setNewItem({ ...newItem, meatId: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  참고: 실제 구현에서는 meat_info 테이블에서 선택하도록
                  드롭다운을 제공해야 합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageDate">보관일 *</Label>
                <Input
                  id="storageDate"
                  type="date"
                  value={newItem.storageDate}
                  onChange={(e) =>
                    setNewItem({ ...newItem, storageDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">유통기한 *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) =>
                    setNewItem({ ...newItem, expiryDate: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleAddItem}
                className="w-full bg-primary hover:bg-primary/90"
              >
                추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items List */}
      {fridgeItems.length === 0 ? (
        <Card className="bg-card border-primary/20">
          <CardContent className="py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <AlertCircle className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                아직 분석한 고기가 없습니다
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                카메라로 고기를 찍어보세요!
                <br />
                AI가 부위를 판별하고 냉장고에 자동으로 저장해드립니다.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    // 분석 페이지로 이동하는 로직 (부모 컴포넌트에서 처리)
                    window.location.href = "/dashboard?menu=analysis";
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  고기 분석하기
                </Button>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  수동으로 추가하기
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {fridgeItems
              .filter((item) => item.status === "stored")
              .map((item, index) => {
                const daysLeft = item.dDay;
                const color = getDDayColor(daysLeft);

                const borderColors = {
                  red: "border-red-500",
                  yellow: "border-yellow-500",
                  green: "border-green-500",
                };

                const bgColors = {
                  red: "bg-red-50",
                  yellow: "bg-yellow-50",
                  green: "bg-green-50",
                };

                const badgeColors = {
                  red: "bg-red-500 text-white",
                  yellow: "bg-yellow-500 text-white",
                  green: "bg-green-500 text-white",
                };

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <Card
                      className={`bg-card border-2 ${borderColors[color]} ${bgColors[color]} shadow-md hover:shadow-lg transition-all`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {editingItemId === item.id ? (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">고기 부위</Label>
                                  <Select
                                    value={
                                      editForm.meatInfoId &&
                                      editForm.meatInfoId > 0
                                        ? editForm.meatInfoId.toString()
                                        : ""
                                    }
                                    onValueChange={async (value) => {
                                      const newMeatInfoId =
                                        value && value !== ""
                                          ? parseInt(value)
                                          : null;
                                      setEditForm({
                                        ...editForm,
                                        meatInfoId: newMeatInfoId,
                                      });
                                      // 부위 변경 시 영양정보 로드
                                      const currentItem = fridgeItems.find(
                                        (i) => i.id === editingItemId
                                      );
                                      if (
                                        currentItem &&
                                        newMeatInfoId &&
                                        newMeatInfoId > 0
                                      ) {
                                        const meatInfo = meatInfoList.find(
                                          (m) => m.id === newMeatInfoId
                                        );
                                        if (meatInfo) {
                                          await loadNutritionForItem(
                                            currentItem.id,
                                            newMeatInfoId,
                                            meatInfo.name,
                                            currentItem.grade || null
                                          );
                                        }
                                      } else {
                                        // 부위 선택 해제 시 영양정보도 제거
                                        setNutritionData((prev) => {
                                          const updated = { ...prev };
                                          delete updated[currentItem?.id || 0];
                                          return updated;
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="text-lg font-semibold">
                                      <SelectValue placeholder="부위 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {meatInfoList.length > 0 ? (
                                        meatInfoList.map((meat) => (
                                          <SelectItem
                                            key={meat.id}
                                            value={meat.id.toString()}
                                          >
                                            {(meat.displayName || meat.name)}{" "}
                                            (
                                            {meat.category === "beef"
                                              ? "소"
                                              : "돼지"}
                                            )
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="0" disabled>
                                          로딩 중...
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : (
                              <>
                                <CardTitle className="text-lg text-foreground">
                                  {item.meatInfoId && item.meatInfoId > 0
                                    ? (() => {
                                        const meat = meatInfoList.find(
                                          (m) => m.id === item.meatInfoId
                                        );
                                        return meat
                                          ? meat.displayName || meat.name
                                          : item.name && item.name !== "알 수 없음"
                                            ? item.name
                                            : "부위 선택";
                                      })()
                                    : item.name && item.name !== "알 수 없음"
                                      ? item.name
                                      : "부위 선택"}
                                </CardTitle>
                                {item.grade && (
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-xs"
                                  >
                                    등급: {item.grade}
                                  </Badge>
                                )}
                              </>
                            )}
                            <CardDescription className="mt-1">
                              상태:{" "}
                              {item.status === "stored" ? "보관 중" : "소비됨"}
                            </CardDescription>
                            {item.traceNumber && (
                              <CardDescription className="mt-1 text-xs font-mono">
                                이력번호: {item.traceNumber}
                              </CardDescription>
                            )}
                          </div>
                          <Badge
                            className={`${badgeColors[color]} border-0 font-bold`}
                          >
                            D{daysLeft >= 0 ? "-" : "+"}
                            {Math.abs(daysLeft)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            유통기한:{" "}
                            {new Date(item.expiryDate).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                        {editingItemId === item.id ? (
                          <div className="space-y-2 pt-2 border-t">
                            {item.grade && (
                              <div className="text-xs text-muted-foreground mb-2">
                                등급: {item.grade} (이력번호에서 자동 설정)
                              </div>
                            )}
                            {loadingNutrition[item.id] ? (
                              <div className="text-xs text-muted-foreground">
                                영양정보 로딩 중...
                              </div>
                            ) : nutritionData[item.id] ? (
                              <div className="text-xs space-y-1 bg-secondary/50 p-2 rounded">
                                <div className="font-semibold">
                                  영양정보 (100g당)
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  {nutritionData[item.id]?.calories !==
                                    null && (
                                    <div>
                                      칼로리: {nutritionData[item.id]?.calories}
                                      kcal
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.protein !== null && (
                                    <div>
                                      단백질: {nutritionData[item.id]?.protein}g
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.fat !== null && (
                                    <div>
                                      지방: {nutritionData[item.id]?.fat}g
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.carbohydrate !==
                                    null && (
                                    <div>
                                      탄수화물:{" "}
                                      {nutritionData[item.id]?.carbohydrate}g
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                            <div className="space-y-1">
                              <Label className="text-xs">
                                표시 이름 (선택 사항)
                              </Label>
                              <Input
                                placeholder="예: 우리 집 등심 (레시피에 이 이름이 사용됩니다)"
                                value={editForm.customName}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    customName: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                비워두면 위에서 선택한 고기 부위명이 사용됩니다.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">희망 섭취기간</Label>
                              <Input
                                type="date"
                                value={editForm.desiredConsumptionDate}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    desiredConsumptionDate: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleSaveEdit(item.id)}
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                저장
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <X className="w-3 h-3 mr-1" />
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {item.desiredConsumptionDate && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  희망 섭취기간:{" "}
                                  {new Date(
                                    item.desiredConsumptionDate
                                  ).toLocaleDateString("ko-KR")}
                                </span>
                              </div>
                            )}
                            {/* 영양정보 간단 요약 표시 */}
                            {nutritionData[item.id] && (
                              <div className="text-xs space-y-1 bg-secondary/50 p-2 rounded mt-2">
                                <div className="font-semibold">
                                  영양정보 (100g당)
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  {nutritionData[item.id]?.calories !==
                                    null && (
                                    <div>
                                      칼로리: {nutritionData[item.id]?.calories}
                                      kcal
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.protein !== null && (
                                    <div>
                                      단백질: {nutritionData[item.id]?.protein}g
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.fat !== null && (
                                    <div>
                                      지방: {nutritionData[item.id]?.fat}g
                                    </div>
                                  )}
                                  {nutritionData[item.id]?.carbohydrate !==
                                    null && (
                                    <div>
                                      탄수화물:{" "}
                                      {nutritionData[item.id]?.carbohydrate}g
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {editingItemId !== item.id && (
                          <div className="flex gap-2 pt-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => handleStartEdit(item)}
                                variant="outline"
                                size="sm"
                                className="border-primary/30 text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                수정
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1"
                            >
                              <Button
                                onClick={() => handleConsumeItem(item.id)}
                                variant="outline"
                                size="sm"
                                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                              >
                                소비 완료
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1"
                            >
                              <Button
                                onClick={() => handleDeleteItem(item.id)}
                                variant="outline"
                                size="sm"
                                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                삭제
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      {/* Warning Message for Expiring Items */}
      {fridgeItems.some(
        (item) => item.dDay <= 3 && item.status === "stored"
      ) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 border-2 border-red-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">유통기한 임박 알림</h4>
            <p className="text-sm text-red-700 mt-1">
              유통기한이 3일 이내인 고기가 있습니다. 빠른 시일 내에
              소비해주세요!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
