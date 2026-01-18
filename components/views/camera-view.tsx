"use client"

import { useState } from "react"
import { CameraInterface } from "@/components/camera-interface"
import { ResultReport } from "@/components/result-report"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"

interface CameraViewProps {
  onSaveToFridge: () => void
}

export function CameraView({ onSaveToFridge }: CameraViewProps) {
  const [captured, setCaptured] = useState(false)
  const [captureMode, setCaptureMode] = useState<"vision" | "ocr">("vision")

  const handleCapture = (mode: "vision" | "ocr") => {
    setCaptureMode(mode)
    setCaptured(true)
  }

  const handleReset = () => {
    setCaptured(false)
  }

  return (
    <div className="space-y-4">
      {captured ? (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              다시 촬영
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              재분석
            </Button>
          </div>
          <ResultReport mode={captureMode} onSaveToFridge={onSaveToFridge} />
        </>
      ) : (
        <CameraInterface onCapture={handleCapture} />
      )}
    </div>
  )
}
