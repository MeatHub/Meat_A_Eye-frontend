"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit, AlertCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFridgeItems, addFridgeItem, deleteFridgeItem } from "@/lib/api"
import { getDDay, getDDayColor } from "@/constants/mockData"
import type { FridgeItem } from "@/constants/mockData"

export function FridgeView() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    meatType: "",
    partName: "",
    weight: "",
    expiryDate: "",
    grade: "",
    memo: "",
  })

  useEffect(() => {
    loadFridgeItems()
  }, [])

  const loadFridgeItems = async () => {
    try {
      const items = await getFridgeItems()
      // Sort by expiry date (ascending)
      const sorted = items.sort((a, b) => {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      })
      setFridgeItems(sorted)
    } catch (error) {
      console.error("Failed to load fridge items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.meatType || !newItem.partName || !newItem.weight || !newItem.expiryDate) {
      alert("필수 항목을 모두 입력해주세요.")
      return
    }

    try {
      const item = await addFridgeItem({
        meatType: newItem.meatType,
        partName: newItem.partName,
        weight: parseInt(newItem.weight),
        expiryDate: new Date(newItem.expiryDate),
        addedDate: new Date(),
        grade: newItem.grade || undefined,
        memo: newItem.memo || undefined,
      })

      setFridgeItems((prev) =>
        [...prev, item].sort((a, b) => {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        })
      )

      // Reset form
      setNewItem({
        meatType: "",
        partName: "",
        weight: "",
        expiryDate: "",
        grade: "",
        memo: "",
      })
      setIsAddModalOpen(false)
    } catch (error) {
      console.error("Failed to add item:", error)
      alert("추가에 실패했습니다.")
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteFridgeItem(id)
      setFridgeItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Failed to delete item:", error)
      alert("삭제에 실패했습니다.")
    }
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
                <Label htmlFor="meatType">고기 종류 *</Label>
                <Select value={newItem.meatType} onValueChange={(value) => setNewItem({ ...newItem, meatType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="소고기">소고기</SelectItem>
                    <SelectItem value="돼지고기">돼지고기</SelectItem>
                    <SelectItem value="닭고기">닭고기</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partName">부위명 *</Label>
                <Input
                  id="partName"
                  placeholder="예: 등심, 삼겹살"
                  value={newItem.partName}
                  onChange={(e) => setNewItem({ ...newItem, partName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">중량 (g) *</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="500"
                  value={newItem.weight}
                  onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="grade">등급 (선택)</Label>
                <Input
                  id="grade"
                  placeholder="예: 1++, 1등급"
                  value={newItem.grade}
                  onChange={(e) => setNewItem({ ...newItem, grade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">메모 (선택)</Label>
                <Textarea
                  id="memo"
                  placeholder="메모를 입력하세요"
                  value={newItem.memo}
                  onChange={(e) => setNewItem({ ...newItem, memo: e.target.value })}
                  rows={3}
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
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">보관 중인 고기가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                고기를 추가하여 유통기한을 관리하세요
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 고기 추가하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {fridgeItems.map((item, index) => {
              const daysLeft = getDDay(item.expiryDate)
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
                          <CardTitle className="text-lg text-foreground">{item.partName}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.meatType} · {item.weight}g
                          </CardDescription>
                        </div>
                        <Badge className={`${badgeColors[color]} border-0 font-bold`}>
                          D-{daysLeft}
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

                      {item.grade && (
                        <Badge variant="outline" className="text-xs">
                          {item.grade}
                        </Badge>
                      )}

                      {item.memo && (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                          {item.memo}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            수정
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
      {fridgeItems.some((item) => getDDay(item.expiryDate) <= 3) && (
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
