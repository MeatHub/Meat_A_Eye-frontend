"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Upload, X, Loader2, Eye, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { analyzeImage, addFridgeItem, getFridgeItems } from "@/lib/api"
import { getMeatInfoByPartName } from "@/lib/api-meat"
import { preprocessImage, captureFromVideo, validateImageFile, createImagePreview } from "@/lib/imagePreprocessing"
import { toast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/shared/BackButton"
import type { MeatAnalysisResult } from "@/constants/mockData"
import type { AIAnalyzeResponse, MeatInfoByPartNameResponse } from "@/types/api"

interface AnalysisViewProps {
  onSaveToFridge: () => void
  onBack?: () => void
}

export function AnalysisView({ onSaveToFridge, onBack }: AnalysisViewProps) {
  const [mode, setMode] = useState<"vision" | "ocr">("vision")
  const [inputMethod, setInputMethod] = useState<"file" | "camera" | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<MeatAnalysisResult | null>(null)
  const [analysisResponse, setAnalysisResponse] = useState<AIAnalyzeResponse | null>(null)
  const [meatInfo, setMeatInfo] = useState<MeatInfoByPartNameResponse | null>(null)
  const [loadingMeatInfo, setLoadingMeatInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setInputMethod("camera")
      setError(null)
    } catch (err) {
      console.error("Camera access error:", err)
      setError("카메라 접근 권한이 필요합니다.")
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const dataUrl = captureFromVideo(videoRef.current)
        setSelectedImage(dataUrl)
        stopCamera()
        setInputMethod("file")
      } catch (err) {
        console.error("Capture error:", err)
        setError("사진 촬영에 실패했습니다.")
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "올바른 이미지 파일이 아닙니다.")
      return
    }

    try {
      const preview = await createImagePreview(file)
      setSelectedImage(preview)
      setInputMethod("file")
      setError(null)
    } catch (err) {
      console.error("File preview error:", err)
      setError("이미지를 불러오는데 실패했습니다.")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "올바른 이미지 파일이 아닙니다.")
      return
    }

    try {
      const preview = await createImagePreview(file)
      setSelectedImage(preview)
      setInputMethod("file")
      setError(null)
    } catch (err) {
      console.error("Drop error:", err)
      setError("이미지를 불러오는데 실패했습니다.")
    }
  }

  const analyzeCurrentImage = async () => {
    if (!selectedImage) return

    setAnalyzing(true)
    setError(null)

    try {
      // Convert dataUrl to File
      const blob = await fetch(selectedImage).then((r) => r.blob())
      const file = new File([blob], "image.jpg", { type: "image/jpeg" })
      
      // Preprocess image before sending
      const preprocessed = await preprocessImage(file)

      console.log(
        `Image preprocessed: ${preprocessed.originalSize} → ${preprocessed.compressedSize} bytes`
      )

      // Convert preprocessed dataUrl back to File for multipart upload
      const preprocessedBlob = await fetch(preprocessed.dataUrl).then((r) => r.blob())
      const preprocessedFile = new File([preprocessedBlob], "image.jpg", { type: "image/jpeg" })

      // Send to backend API with multipart form data
      const analysisResult = await analyzeImage(preprocessedFile, mode, false) // Don't auto-add to fridge
      setAnalysisResponse(analysisResult)
      
      // Convert to MeatAnalysisResult format for display
      const displayResult: MeatAnalysisResult = {
        id: Date.now().toString(),
        partName: analysisResult.partName || "알 수 없음",
        confidence: analysisResult.confidence || 0,
        timestamp: new Date(),
        origin: analysisResult.raw?.origin,
        grade: analysisResult.raw?.grade,
        traceabilityNumber: analysisResult.historyNo || undefined,
      }
      
      setResult(displayResult)
      
      // 분석 응답에 영양정보와 가격정보가 포함되어 있으면 사용
      if (analysisResult.nutrition || analysisResult.price) {
        setMeatInfo({
          partName: analysisResult.partName || "",
          calories: analysisResult.nutrition?.calories || null,
          protein: analysisResult.nutrition?.protein || null,
          fat: analysisResult.nutrition?.fat || null,
          carbohydrate: analysisResult.nutrition?.carbohydrate || null,
          currentPrice: analysisResult.price?.currentPrice || 0,
          priceUnit: analysisResult.price?.priceUnit || "100g",
          priceTrend: analysisResult.price?.priceTrend || "flat",
          priceDate: analysisResult.price?.priceDate || null,
          priceSource: analysisResult.price?.priceSource || "fallback",
          storageGuide: null,
        })
      } else if (analysisResult.partName) {
        // 응답에 없으면 별도로 조회
        await loadMeatInfo(analysisResult.partName)
      }
    } catch (err: any) {
      console.error("Analysis error:", err)
      setError(err.message || "분석에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setAnalyzing(false)
    }
  }

  const loadMeatInfo = async (partName: string) => {
    setLoadingMeatInfo(true)
    try {
      const info = await getMeatInfoByPartName(partName)
      setMeatInfo(info)
    } catch (error: any) {
      console.error("Failed to load meat info:", error)
      // 영양정보 로드 실패는 치명적이지 않으므로 에러 표시하지 않음
    } finally {
      setLoadingMeatInfo(false)
    }
  }

  const handleSaveToFridge = async () => {
    if (!analysisResponse || !analysisResponse.partName) {
      toast({
        title: "저장 실패",
        description: "분석 결과가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // auto_add_fridge = true로 다시 분석하여 자동 저장
      const blob = await fetch(selectedImage!).then(r => r.blob())
      const file = new File([blob], "image.jpg", { type: "image/jpeg" })
      
      await analyzeImage(file, mode, true) // auto_add_fridge = true
      
      toast({
        title: "저장 완료! 🎉",
        description: `${analysisResponse.partName}이(가) 냉장고에 저장되었습니다.`,
      })
      
      onSaveToFridge()
    } catch (error: any) {
      console.error("Failed to save to fridge:", error)
      toast({
        title: "저장 실패",
        description: error.message || "냉장고에 저장하는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setSelectedImage(null)
    setResult(null)
    setAnalysisResponse(null)
    setError(null)
    setInputMethod(null)
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        {onBack && <BackButton onClick={onBack} />}
        <h2 className="text-2xl font-bold text-foreground">고기 분석</h2>
      </div>

      {/* Mode Toggle */}
      <Card className="bg-card border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className={`w-5 h-5 ${mode === "vision" ? "text-primary" : "text-muted-foreground"}`} />
                <Label htmlFor="mode-switch" className="text-sm font-medium">
                  {mode === "vision" ? "부위 판별 모드" : "이력번호 인식 모드"}
                </Label>
              </div>
              <Switch
                id="mode-switch"
                checked={mode === "ocr"}
                onCheckedChange={(checked) => setMode(checked ? "ocr" : "vision")}
                className="data-[state=checked]:bg-primary"
              />
              <FileText className={`w-5 h-5 ${mode === "ocr" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI {mode === "vision" ? "Vision" : "OCR"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!selectedImage && inputMethod !== "camera" ? (
          // Input Selection
          <motion.div
            key="input-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Drag & Drop Zone */}
            <Card
              className="bg-card border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="py-12">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                  <h3 className="text-lg font-semibold mb-2">이미지를 드래그하거나 클릭하세요</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    JPG, PNG 파일 (최대 10MB)
                  </p>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    파일 선택
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Camera Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={startCamera}
                className="w-full h-20 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold gap-3"
              >
                <Camera className="w-6 h-6" />
                웹캠으로 촬영하기
              </Button>
            </motion.div>
          </motion.div>
        ) : inputMethod === "camera" && !selectedImage ? (
          // Camera View
          <motion.div
            key="camera-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-card border-primary/20 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ minHeight: "400px" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex gap-2 justify-center">
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={capturePhoto}
                          size="lg"
                          className="bg-white text-primary hover:bg-white/90 rounded-full w-16 h-16"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      </motion.div>
                      <Button
                        onClick={reset}
                        variant="secondary"
                        size="lg"
                        className="rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : selectedImage ? (
          // Image Preview & Analysis
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary">
                    {result ? "분석 결과" : "이미지 확인"}
                  </CardTitle>
                  <Button onClick={reset} variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Display */}
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-auto rounded-lg"
                  />
                  {result?.gradCAM && (
                    <img
                      src={result.gradCAM}
                      alt="Grad-CAM"
                      className="absolute inset-0 w-full h-full rounded-lg opacity-50 mix-blend-multiply"
                    />
                  )}
                </div>

                {/* Analysis Result */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* 분석 결과 */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="text-xl font-bold text-primary mb-2">{result.partName}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          신뢰도: {(result.confidence * 100).toFixed(1)}%
                        </Badge>
                        {result.origin && <Badge variant="secondary">{result.origin}</Badge>}
                        {result.grade && (
                          <Badge className="bg-primary text-primary-foreground">{result.grade}</Badge>
                        )}
                      </div>
                    </div>

                    {/* 영양정보 및 가격정보 */}
                    {meatInfo ? (
                      <div className="grid grid-cols-2 gap-3">
                        {/* 영양정보 */}
                        <Card className="bg-card border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">영양정보 (100g당)</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            {meatInfo.calories !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">칼로리</span>
                                <span className="font-medium">{meatInfo.calories}kcal</span>
                              </div>
                            )}
                            {meatInfo.protein !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">단백질</span>
                                <span className="font-medium">{meatInfo.protein.toFixed(1)}g</span>
                              </div>
                            )}
                            {meatInfo.fat !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">지방</span>
                                <span className="font-medium">{meatInfo.fat.toFixed(1)}g</span>
                              </div>
                            )}
                            {meatInfo.carbohydrate !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">탄수화물</span>
                                <span className="font-medium">{meatInfo.carbohydrate.toFixed(1)}g</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 가격정보 */}
                        <Card className="bg-card border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">시세 정보</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm">
                            {meatInfo.currentPrice > 0 ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">현재 가격</span>
                                  <span className="font-medium">{meatInfo.currentPrice.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">단위</span>
                                  <span className="font-medium">{meatInfo.priceUnit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">추세</span>
                                  <Badge
                                    variant={
                                      meatInfo.priceTrend === "up"
                                        ? "default"
                                        : meatInfo.priceTrend === "down"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {meatInfo.priceTrend === "up" ? "↑ 상승" : meatInfo.priceTrend === "down" ? "↓ 하락" : "→ 보합"}
                                  </Badge>
                                </div>
                                {meatInfo.priceDate && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    기준일: {meatInfo.priceDate}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground">가격 정보 없음</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : null}

                    {/* 저장 버튼 */}
                    <Button
                      onClick={handleSaveToFridge}
                      disabled={saving}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          저장 중...
                        </>
                      ) : (
                        "냉장고에 저장하기"
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Analyze Button */}
                {!result && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={analyzeCurrentImage}
                      disabled={analyzing}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          AI 분석 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          AI 분석 시작
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}
