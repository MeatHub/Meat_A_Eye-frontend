"use client"

import { useState } from "react"
import { Camera, ScanLine, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CameraInterfaceProps {
  onCapture: (mode: "vision" | "ocr") => void
}

export function CameraInterface({ onCapture }: CameraInterfaceProps) {
  const [mode, setMode] = useState<"vision" | "ocr">("vision")

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="bg-secondary rounded-xl p-1 flex">
        <button
          onClick={() => setMode("vision")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            mode === "vision"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          생고기 부위 찾기
          <span className="block text-[10px] opacity-80 mt-0.5">Vision AI</span>
        </button>
        <button
          onClick={() => setMode("ocr")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
            mode === "ocr"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          포장육 이력 조회
          <span className="block text-[10px] opacity-80 mt-0.5">OCR 스캔</span>
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative aspect-[4/3] bg-foreground/5 rounded-2xl overflow-hidden border-2 border-dashed border-border">
        {/* Simulated camera background */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-foreground/10" />
        
        {/* Viewfinder Guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          {mode === "vision" ? (
            // Circle guide for meat cut recognition
            <div className="relative">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-primary/60 border-dashed animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-primary/40" />
              </div>
              {/* Corner markers */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          ) : (
            // Rectangle guide for barcode/number scanning
            <div className="relative">
              <div className="w-64 h-20 md:w-80 md:h-24 rounded-xl border-4 border-primary/60 border-dashed animate-pulse flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary/40" />
              </div>
              {/* Scan line animation */}
              <div className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            </div>
          )}
        </div>

        {/* Mode indicator */}
        <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium">
          {mode === "vision" ? "부위 인식 모드" : "이력 조회 모드"}
        </div>
      </div>

      {/* Capture Button */}
      <Button
        onClick={() => onCapture(mode)}
        size="lg"
        className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl"
      >
        <Camera className="w-6 h-6 mr-2" />
        촬영하기
      </Button>

      {/* Guidance Text */}
      <div className="bg-secondary rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === "vision" 
            ? "고기의 단면이 잘 보이도록 촬영해주세요. 마블링과 색상이 선명할수록 정확도가 높아집니다."
            : "포장육의 이력번호 또는 바코드가 가이드 안에 들어오도록 촬영해주세요."
          }
        </p>
      </div>
    </div>
  )
}
