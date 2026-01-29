"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFridgeItems, addFridgeItem, deleteFridgeItem, updateFridgeItemStatus } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import type { FridgeItemResponse } from "@/types/api"

export function FridgeView() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItemResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    meatId: "",
    storageDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  })

  useEffect(() => {
    loadFridgeItems()
  }, [])

  const loadFridgeItems = async () => {
    try {
      const response = await getFridgeItems()
      setFridgeItems(response.items)
    } catch (error: any) {
      console.error("Failed to load fridge items:", error)
      toast({
        title: "로딩 실패",
        description: error.message || "냉장고 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.meatId || !newItem.expiryDate) {
      toast({
        title: "입력 오류",
        description: "필수 항목을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      await addFridgeItem({
        meatId: parseInt(newItem.meatId),
        storageDate: newItem.storageDate,
        expiryDate: newItem.expiryDate,
      })
      
      toast({
        title: "추가 완료",
        description: "냉장고에 고기가 추가되었습니다.",
      })
      
      // Reload items
      await loadFridgeItems()

      // Reset form
      setNewItem({
        meatId: "",
        storageDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
      })
      setIsAddModalOpen(false)
    } catch (error: any) {
      console.error("Failed to add item:", error)
      toast({
        title: "추가 실패",
        description: error.message || "고기 추가에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteFridgeItem(id)
      toast({
        title: "삭제 완료",
        description: "고기가 삭제되었습니다.",
      })
      setFridgeItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      console.error("Failed to delete item:", error)
      toast({
        title: "삭제 실패",
        description: error.message || "고기 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleConsumeItem = async (id: number) => {
    try {
      await updateFridgeItemStatus(id, "consumed")
      toast({
        title: "상태 변경 완료",
        description: "고기가 소비됨으로 표시되었습니다.",
      })
      await loadFridgeItems()
    } catch (error: any) {
      console.error("Failed to update item status:", error)
      toast({
        title: "상태 변경 실패",
        description: error.message || "상태 변경에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const getDDay = (expiryDate: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDDayColor = (daysLeft: number): "red" | "yellow" | "green" => {
    if (daysLeft <= 1) return "red"
    if (daysLeft <= 3) return "yellow"
    return "green"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">냉장고 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">냉장고 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            보관 중인 고기 {fridgeItems.length}개
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
              <DialogDescription>냉장고에 보관할 고기 정보를 입력하세요</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="meatId">고기 ID *</Label>
                <Input
                  id="meatId"
                  type="number"
                  placeholder="meat_info 테이블의 ID 입력"
                  value={newItem.meatId}
                  onChange={(e) => setNewItem({ ...newItem, meatId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  참고: 실제 구현에서는 meat_info 테이블에서 선택하도록 드롭다운을 제공해야 합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageDate">보관일 *</Label>
                <Input
                  id="storageDate"
                  type="date"
                  value={newItem.storageDate}
                  onChange={(e) => setNewItem({ ...newItem, storageDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">유통기한 *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                />
              </div>

              <Button onClick={handleAddItem} className="w-full bg-primary hover:bg-primary/90">
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
              <h3 className="text-xl font-semibold mb-2 text-foreground">아직 분석한 고기가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-6">
                카메라로 고기를 찍어보세요!
                <br />
                AI가 부위를 판별하고 냉장고에 자동으로 저장해드립니다.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    // 분석 페이지로 이동하는 로직 (부모 컴포넌트에서 처리)
                    window.location.href = "/dashboard?menu=analysis"
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
              .filter(item => item.status === "stored")
              .map((item, index) => {
                const daysLeft = item.dDay
                const color = getDDayColor(daysLeft)
                
                const borderColors = {
                  red: "border-red-500",
                  yellow: "border-yellow-500",
                  green: "border-green-500",
                }

                const bgColors = {
                  red: "bg-red-50",
                  yellow: "bg-yellow-50",
                  green: "bg-green-50",
                }

                const badgeColors = {
                  red: "bg-red-500 text-white",
                  yellow: "bg-yellow-500 text-white",
                  green: "bg-green-500 text-white",
                }

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
                    <Card className={`bg-card border-2 ${borderColors[color]} ${bgColors[color]} shadow-md hover:shadow-lg transition-all`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-foreground">{item.name}</CardTitle>
                            <CardDescription className="mt-1">
                              상태: {item.status === "stored" ? "보관 중" : "소비됨"}
                            </CardDescription>
                          </div>
                          <Badge className={`${badgeColors[color]} border-0 font-bold`}>
                            D{daysLeft >= 0 ? "-" : "+"}{Math.abs(daysLeft)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            유통기한: {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                            <Button
                              onClick={() => handleConsumeItem(item.id)}
                              variant="outline"
                              size="sm"
                              className="w-full border-primary/30 text-primary hover:bg-primary/10"
                            >
                              소비 완료
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
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
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      )}

      {/* Warning Message for Expiring Items */}
      {fridgeItems.some((item) => item.dDay <= 3 && item.status === "stored") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 border-2 border-red-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">유통기한 임박 알림</h4>
            <p className="text-sm text-red-700 mt-1">
              유통기한이 3일 이내인 고기가 있습니다. 빠른 시일 내에 소비해주세요!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
