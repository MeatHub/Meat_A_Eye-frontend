"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Upload, X, Loader2, Eye, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { analyzeImage } from "@/lib/api"
import { preprocessImage, captureFromVideo, validateImageFile, createImagePreview } from "@/lib/imagePreprocessing"
import type { MeatAnalysisResult } from "@/constants/mockData"

interface AnalysisViewProps {
  onSaveToFridge: () => void
}

export function AnalysisView({ onSaveToFridge }: AnalysisViewProps) {
  const [mode, setMode] = useState<"vision" | "ocr">("vision")
  const [inputMethod, setInputMethod] = useState<"file" | "camera" | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<MeatAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      // Preprocess image before sending
      const blob = await fetch(selectedImage).then((r) => r.blob())
      const file = new File([blob], "image.jpg", { type: "image/jpeg" })
      const preprocessed = await preprocessImage(file)

      console.log(
        `Image preprocessed: ${preprocessed.originalSize} → ${preprocessed.compressedSize} bytes`
      )

      // Send to AI server
      const analysisResult = await analyzeImage(preprocessed.dataUrl, mode)
      setResult(analysisResult)
    } catch (err) {
      console.error("Analysis error:", err)
      setError("분석에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
    setInputMethod(null)
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
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
                    className="space-y-3"
                  >
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

                    <Button
                      onClick={onSaveToFridge}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      냉장고에 저장하기
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
