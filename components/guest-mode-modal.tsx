"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGuestSession, getGuestNickname, setGuestNickname } from "@/lib/api"

interface GuestModeModalProps {
  onComplete: (nickname: string) => void
}

export function GuestModeModal({ onComplete }: GuestModeModalProps) {
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user has already set a nickname
    const existingNickname = getGuestNickname()
    if (!existingNickname) {
      // Show modal after a brief delay for better UX
      setTimeout(() => setOpen(true), 500)
    } else {
      onComplete(existingNickname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요")
      return
    }

    if (nickname.length < 2) {
      setError("닉네임은 2자 이상이어야 합니다")
      return
    }

    if (nickname.length > 10) {
      setError("닉네임은 10자 이하여야 합니다")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create guest session
      await createGuestSession(nickname.trim())
      
      // Save nickname locally
      setGuestNickname(nickname.trim())
      
      // Close modal and notify parent
      setOpen(false)
      onComplete(nickname.trim())
    } catch (err) {
      console.error("Failed to create guest session:", err)
      setError("세션 생성에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !loading && setOpen(newOpen)}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <Sparkles className="w-5 h-5" />
            Meat-A-Eye에 오신 것을 환영합니다!
          </DialogTitle>
          <DialogDescription>
            시작하기 전에 닉네임을 설정해주세요
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6 mt-4"
        >
          {/* Welcome Card */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">비회원으로 시작하기</h3>
                <p className="text-sm text-muted-foreground">간편하게 서비스를 이용하세요</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                AI 고기 부위 판별 및 이력번호 인식
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                냉장고 보관 관리 및 유통기한 알림
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                AI 레시피 추천 서비스
              </li>
            </ul>
          </div>

          {/* Nickname Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-base">
                닉네임 *
              </Label>
              <Input
                id="nickname"
                placeholder="육류박사"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className="text-base h-12"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                2~10자 이내로 입력해주세요
              </p>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    설정 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    시작하기
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Privacy Notice */}
          <p className="text-xs text-center text-muted-foreground">
            입력하신 정보는 브라우저에만 저장되며,
            <br />
            언제든지 변경하실 수 있습니다.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

