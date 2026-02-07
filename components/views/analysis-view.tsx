"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Eye,
  FileText,
  Sparkles,
  AlertCircle,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  analyzeImage,
  getFridgeItems,
  getTraceabilityByNumber,
  getTraceabilityBundleList,
  isBundleNumber,
  addFridgeItemFromTraceability,
  getAuthToken,
  getIsGuest,
} from "@/lib/api";
import { getMeatInfoByPartName } from "@/lib/api-meat";
import {
  preprocessImage,
  captureFromVideo,
  validateImageFile,
  createImagePreview,
} from "@/lib/imagePreprocessing";
import { toast } from "@/components/ui/use-toast";
import { BackButton } from "@/components/shared/BackButton";
import type { MeatAnalysisResult } from "@/constants/mockData";
import type {
  AIAnalyzeResponse,
  MeatInfoByPartNameResponse,
  TraceabilityInfo,
} from "@/src/types/api";

interface AnalysisViewProps {
  onSaveToFridge: () => void;
  onBack?: () => void;
}

/** 실제 사이트와 동일 4개 섹션: 기본정보, 원산지정보, 수입이력정보, 냉동전환정보 */
function TraceabilityDetailSections({
  info,
  onSaveToFridge,
  saving,
}: {
  info: TraceabilityInfo | null;
  onSaveToFridge?: (() => void) | null;
  saving?: boolean;
}) {
  if (!info) return null;
  const formatRange = (
    from: string | null | undefined,
    to: string | null | undefined
  ) => {
    if (from && to) return `${from} ~ ${to}`;
    return from || to || "";
  };
  const hasBasic = info.historyNo || info.blNo || info.partName;
  const hasOrigin = info.origin;
  const hasHistory =
    info.exporter ||
    info.slaughterDateFrom ||
    info.slaughterDateTo ||
    info.processingDateFrom ||
    info.processingDateTo ||
    info.importer ||
    info.importDate ||
    info.partCode ||
    info.companyName;
  const hasRefrig =
    info.refrigCnvrsAt ||
    info.refrigDistbPdBeginDe ||
    info.refrigDistbPdEndDe ||
    info.recommendedExpiry ||
    info.limitFromDt ||
    info.limitToDt;

  return (
    <div className="space-y-4">
      {/* 1. 기본정보 */}
      {hasBasic && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            기본정보
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            품목명은 수입신고시점의 품목정보입니다.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {info.historyNo && (
              <>
                <span className="text-muted-foreground">이력번호</span>
                <span className="font-mono text-xs">{info.historyNo}</span>
              </>
            )}
            {info.blNo && (
              <>
                <span className="text-muted-foreground">선하증권번호</span>
                <span className="font-mono text-xs">{info.blNo}</span>
              </>
            )}
            {info.partName && (
              <>
                <span className="text-muted-foreground">수입축산물 품목</span>
                <span className="col-span-2">{info.partName}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. 원산지정보 */}
      {hasOrigin && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            원산지정보
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">원산지(국가)</span>
            <span>{info.origin}</span>
          </div>
        </div>
      )}

      {/* 3. 수입이력정보 */}
      {hasHistory && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            수입이력정보
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {info.exporter && (
              <>
                <span className="text-muted-foreground">수출국 도축장</span>
                <span>{info.exporter}</span>
              </>
            )}
            {(info.slaughterDateFrom || info.slaughterDateTo) && (
              <>
                <span className="text-muted-foreground">수출국 도축일자</span>
                <span>
                  {formatRange(info.slaughterDateFrom, info.slaughterDateTo) ||
                    info.slaughterDate}
                </span>
              </>
            )}
            {info.companyName && (
              <>
                <span className="text-muted-foreground">수출국 가공장</span>
                <span>{info.companyName}</span>
              </>
            )}
            {(info.processingDateFrom || info.processingDateTo) && (
              <>
                <span className="text-muted-foreground">수출국 가공일자</span>
                <span>
                  {formatRange(info.processingDateFrom, info.processingDateTo)}
                </span>
              </>
            )}
            {info.exporter && (
              <>
                <span className="text-muted-foreground">수출업체</span>
                <span>{info.exporter}</span>
              </>
            )}
            {info.importer && (
              <>
                <span className="text-muted-foreground">수입업체</span>
                <span>{info.importer}</span>
              </>
            )}
            {info.importDate && (
              <>
                <span className="text-muted-foreground">수입연월일</span>
                <span>{info.importDate}</span>
              </>
            )}
            {info.partCode && (
              <>
                <span className="text-muted-foreground">부위(코드)</span>
                <span className="col-span-2">{info.partCode}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. 유통기한·냉동전환정보 */}
      {hasRefrig && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            유통기한·냉동전환정보
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            냉동전환 정보는 식약처 식품안전정보포털 연계 자료입니다.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {(info.recommendedExpiry || info.limitFromDt || info.limitToDt) && (
              <>
                <span className="text-muted-foreground">유통기한(권장)</span>
                <span>
                  {info.recommendedExpiry ||
                    formatRange(info.limitFromDt, info.limitToDt)}
                </span>
              </>
            )}
            {info.refrigCnvrsAt && (
              <>
                <span className="text-muted-foreground">냉동전환 여부</span>
                <span>{info.refrigCnvrsAt === "Y" ? "예" : "아니오"}</span>
              </>
            )}
            {(info.refrigDistbPdBeginDe || info.refrigDistbPdEndDe) && (
              <>
                <span className="text-muted-foreground">냉장소비기한</span>
                <span>
                  {formatRange(
                    info.refrigDistbPdBeginDe,
                    info.refrigDistbPdEndDe
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {onSaveToFridge && !getIsGuest() && getAuthToken() && (
        <Button
          onClick={onSaveToFridge}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            "냉장고에 저장"
          )}
        </Button>
      )}
      {onSaveToFridge && (getIsGuest() || !getAuthToken()) && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            냉장고 저장 기능은 로그인 후 이용할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export function AnalysisView({ onSaveToFridge, onBack }: AnalysisViewProps) {
  const [mode, setMode] = useState<"vision" | "ocr">("vision");
  const [inputMethod, setInputMethod] = useState<"file" | "camera" | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MeatAnalysisResult | null>(null);
  const [analysisResponse, setAnalysisResponse] =
    useState<AIAnalyzeResponse | null>(null);
  const [meatInfo, setMeatInfo] = useState<MeatInfoByPartNameResponse | null>(
    null
  );
  const [loadingMeatInfo, setLoadingMeatInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // 이력번호/묶음번호 직접 조회
  const [traceInput, setTraceInput] = useState("");
  const [manualTraceability, setManualTraceability] =
    useState<TraceabilityInfo | null>(null);
  const [manualTraceabilityList, setManualTraceabilityList] = useState<
    TraceabilityInfo[] | null
  >(null);
  const [selectedTraceDetail, setSelectedTraceDetail] =
    useState<TraceabilityInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [manualTraceLoading, setManualTraceLoading] = useState(false);
  const [manualTraceError, setManualTraceError] = useState<string | null>(null);
  const [savingFromTraceability, setSavingFromTraceability] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  // 모바일 기기 감지
  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
  };

  // Android 기기 감지
  const isAndroidDevice = () => {
    if (typeof window === "undefined") return false;
    return /android/i.test(navigator.userAgent.toLowerCase());
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    // 모바일 기기에서는 네이티브 카메라 앱 사용 (더 안정적)
    if (isMobileDevice()) {
      // 모바일에서는 네이티브 카메라 입력 사용
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      }
      return;
    }

    // 데스크톱에서는 getUserMedia 사용
    // mediaDevices 지원 여부 확인 (Safari 포함)
    const hasMediaDevices =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasLegacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia;

    if (!hasMediaDevices && !hasLegacyGetUserMedia) {
      const userAgent = navigator.userAgent.toLowerCase();
      let browserName = "브라우저";
      if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
        browserName = "Safari";
      } else if (userAgent.includes("chrome")) {
        browserName = "Chrome";
      } else if (userAgent.includes("firefox")) {
        browserName = "Firefox";
      } else if (userAgent.includes("edge")) {
        browserName = "Edge";
      }

      setError(
        `이 ${browserName} 버전은 카메라를 지원하지 않습니다. 최신 버전으로 업데이트하거나 Chrome, Edge, Firefox를 사용해주세요.`
      );
      return;
    }

    try {
      // 데스크톱에서는 기본 카메라 사용 (facingMode 제거)
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let stream: MediaStream;
      try {
        // 최신 API 우선 시도
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          // 레거시 API (Safari 등)
          const legacyGetUserMedia =
            (navigator as any).getUserMedia ||
            (navigator as any).webkitGetUserMedia ||
            (navigator as any).mozGetUserMedia;
          if (legacyGetUserMedia) {
            stream = await new Promise<MediaStream>((resolve, reject) => {
              legacyGetUserMedia.call(navigator, constraints, resolve, reject);
            });
          } else {
            throw new Error("getUserMedia not supported");
          }
        }
      } catch (constraintError: any) {
        // 제약 조건 실패 시 기본 카메라로 재시도
        console.warn(
          "고해상도 카메라 접근 실패, 기본 설정으로 재시도:",
          constraintError
        );
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } else {
            const legacyGetUserMedia =
              (navigator as any).getUserMedia ||
              (navigator as any).webkitGetUserMedia ||
              (navigator as any).mozGetUserMedia;
            if (legacyGetUserMedia) {
              stream = await new Promise<MediaStream>((resolve, reject) => {
                legacyGetUserMedia.call(
                  navigator,
                  { video: true },
                  resolve,
                  reject
                );
              });
            } else {
              throw new Error("getUserMedia not supported");
            }
          }
        } catch (fallbackError: any) {
          throw constraintError; // 원래 에러를 다시 던짐
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // 비디오가 로드될 때까지 대기
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not found"));
            return;
          }

          const video = videoRef.current;
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("Video element error"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);

          // 이미 로드된 경우
          if (video.readyState >= 2) {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          }
        });
      }

      setInputMethod("camera");
      setError(null);
    } catch (err: any) {
      console.error("Camera access error:", err);

      // 에러 타입별 구체적인 메시지
      let errorMessage = "카메라를 시작할 수 없습니다.";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "사용 가능한 카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage =
          "카메라가 다른 애플리케이션에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.";
      } else if (
        err.name === "OverconstrainedError" ||
        err.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage =
          "요청한 카메라 설정을 지원하지 않습니다. 기본 설정으로 다시 시도해주세요.";
      } else if (err.message === "Video load timeout") {
        errorMessage =
          "카메라 스트림을 로드하는데 시간이 오래 걸립니다. 다시 시도해주세요.";
      } else {
        errorMessage = `카메라 오류: ${
          err.message || err.name || "알 수 없는 오류"
        }`;
      }

      setError(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const dataUrl = captureFromVideo(videoRef.current);
        setSelectedImage(dataUrl);
        stopCamera();
        setInputMethod("file");
      } catch (err) {
        console.error("Capture error:", err);
        setError("사진 촬영에 실패했습니다.");
      }
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "올바른 이미지 파일이 아닙니다.");
      return;
    }

    try {
      const preview = await createImagePreview(file);
      setSelectedImage(preview);
      setInputMethod("file");
      setError(null);
    } catch (err) {
      console.error("File preview error:", err);
      setError("이미지를 불러오는데 실패했습니다.");
    }

    // 입력 필드 리셋 (같은 파일을 다시 선택할 수 있도록)
    if (event.target) {
      event.target.value = "";
    }
  };

  // 모바일 네이티브 카메라 핸들러
  const handleMobileCameraSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "올바른 이미지 파일이 아닙니다.");
      return;
    }

    try {
      const preview = await createImagePreview(file);
      setSelectedImage(preview);
      setInputMethod("file");
      setError(null);
    } catch (err) {
      console.error("Mobile camera error:", err);
      setError("사진을 불러오는데 실패했습니다.");
    }

    // 입력 필드 리셋
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "올바른 이미지 파일이 아닙니다.");
      return;
    }

    try {
      const preview = await createImagePreview(file);
      setSelectedImage(preview);
      setInputMethod("file");
      setError(null);
    } catch (err) {
      console.error("Drop error:", err);
      setError("이미지를 불러오는데 실패했습니다.");
    }
  };

  const analyzeCurrentImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Convert dataUrl to File
      const blob = await fetch(selectedImage).then((r) => r.blob());
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      // Preprocess image before sending
      const preprocessed = await preprocessImage(file);

      console.log(
        `Image preprocessed: ${preprocessed.originalSize} → ${preprocessed.compressedSize} bytes`
      );

      // Convert preprocessed dataUrl back to File for multipart upload
      const preprocessedBlob = await fetch(preprocessed.dataUrl).then((r) =>
        r.blob()
      );
      const preprocessedFile = new File([preprocessedBlob], "image.jpg", {
        type: "image/jpeg",
      });

      // Send to backend API with multipart form data (FormData로 전송)
      console.log(
        `[API REQUEST] POST /api/analyze - mode: ${mode}, file size: ${preprocessedFile.size} bytes, resolution: ${preprocessed.width}x${preprocessed.height}`
      );
      const analysisResult = await analyzeImage(preprocessedFile, mode, false); // Don't auto-add to fridge
      console.log(`[API RESPONSE SUCCESS] 분석 결과:`, analysisResult);
      setAnalysisResponse(analysisResult);

      // Convert to MeatAnalysisResult format for display
      const displayResult: MeatAnalysisResult = {
        id: Date.now().toString(),
        partName: analysisResult.partName || "알 수 없음",
        confidence: analysisResult.confidence || 0,
        gradCAM: analysisResult.heatmap_image || null,
        timestamp: new Date(),
        origin: analysisResult.raw?.origin,
        grade: analysisResult.raw?.grade,
        traceabilityNumber: analysisResult.historyNo || undefined,
      };

      setResult(displayResult);

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
          gradePrices: analysisResult.price?.gradePrices || [],
          nutritionSource: analysisResult.nutrition?.source || "fallback",
          storageGuide: null,
        });
      } else if (analysisResult.partName) {
        // 응답에 없으면 별도로 조회
        await loadMeatInfo(analysisResult.partName);
      }
    } catch (err: any) {
      console.error(
        "[API RESPONSE ERROR]: ",
        err.response?.data || err.message
      );
      const errorMsg = err.message || "분석에 실패했습니다. 다시 시도해주세요.";
      setError(errorMsg);
      // window.alert 제거 - UI 통합 알림만 사용
    } finally {
      setAnalyzing(false);
    }
  };

  const loadMeatInfo = async (partName: string) => {
    setLoadingMeatInfo(true);
    try {
      const info = await getMeatInfoByPartName(partName);
      setMeatInfo(info);
    } catch (error: any) {
      console.error("Failed to load meat info:", error);
      // 영양정보 로드 실패는 치명적이지 않으므로 에러 표시하지 않음
    } finally {
      setLoadingMeatInfo(false);
    }
  };

  const handleTraceabilityLookup = async () => {
    const num = traceInput.trim();
    if (!num) {
      toast({
        title: "입력 필요",
        description: "이력번호 또는 묶음번호를 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }

    // L로 시작하는 묶음번호는 확실히 국산 (예: L12601205379002)
    const isDomesticBundle = /^L\d+$/.test(num);

    // 수입 묶음번호 체크 (A + 20자리 이상) - 확실히 수입
    const isImportBundle = isBundleNumber(num);

    // L로 시작하는 묶음번호는 국산으로 바로 처리
    if (isDomesticBundle) {
      const mtraceUrl = `https://www.mtrace.go.kr/search.do?mtraceNo=${encodeURIComponent(
        num
      )}`;
      window.open(mtraceUrl, "_blank");
      toast({
        title: "웹사이트 열림",
        description:
          "국산육 이력 정보는 M-Trace 공식 웹사이트에서 확인할 수 있습니다.",
      });
      return;
    }

    // 수입 묶음번호는 바로 처리
    if (isImportBundle) {
      setManualTraceError(null);
      setManualTraceability(null);
      setManualTraceabilityList(null);
      setSelectedTraceDetail(null);
      setManualTraceLoading(true);
      try {
        const list = await getTraceabilityBundleList(num);
        setManualTraceabilityList(list);
        toast({
          title: "조회 완료",
          description: `묶음 이력 ${list.length}건을 불러왔습니다. 항목을 클릭하면 상세 정보를 볼 수 있습니다.`,
        });
      } catch (err: any) {
        const msg =
          err.response?.data?.detail ||
          err.message ||
          "묶음번호 조회에 실패했습니다.";
        setManualTraceError(msg);
        toast({
          title: "조회 실패",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setManualTraceLoading(false);
      }
      return;
    }

    // 12자리 숫자 이력번호: 백엔드 API로 먼저 확인 (수입육도 12자리일 수 있음)
    // 백엔드가 성공하면 수입으로 처리, 실패하면 국산으로 처리
    const is12DigitNumber = /^\d{12}$/.test(num);

    setManualTraceError(null);
    setManualTraceability(null);
    setManualTraceabilityList(null);
    setSelectedTraceDetail(null);
    setManualTraceLoading(true);

    try {
      // 백엔드 API로 먼저 조회 시도 (백엔드가 자동으로 국산/수입 구분)
      const info = await getTraceabilityByNumber(num);
      // 성공하면 수입으로 처리 (백엔드가 수입 정보를 반환함)
      setManualTraceability(info);
      toast({ title: "조회 완료", description: "이력 정보를 불러왔습니다." });
    } catch (err: any) {
      // 백엔드가 실패하면 12자리 숫자인 경우 국산으로 판단하고 M-Trace로 리다이렉트
      // 백엔드가 12자리 숫자를 국산으로 판단해서 Domestic API를 호출하고,
      // 실패하면 Import로 재시도하고, Import도 실패하면 503을 반환함
      // 502는 HTML 오류 (국산 API 실패)이지만 백엔드가 Import로 재시도하므로,
      // 최종적으로 503이 반환되면 국산으로 판단
      const errorStatus = err.response?.status;
      const errorDetail = err.response?.data?.detail || err.message || "";

      // 12자리 숫자이고, 백엔드가 "이력제 API 연결 실패" 메시지를 반환하면 (Import도 실패한 경우) 국산으로 판단
      // 또는 502/503 에러인 경우도 국산으로 판단 (백엔드가 Import 재시도 후 실패)
      if (
        is12DigitNumber &&
        (errorStatus === 503 ||
          (errorStatus === 502 && errorDetail.includes("HTML")) ||
          errorDetail.includes("이력제 API 연결 실패"))
      ) {
        const mtraceUrl = `https://www.mtrace.go.kr/search.do?mtraceNo=${encodeURIComponent(
          num
        )}`;
        window.open(mtraceUrl, "_blank");
        toast({
          title: "웹사이트 열림",
          description:
            "국산육 이력 정보는 M-Trace 공식 웹사이트에서 확인할 수 있습니다.",
        });
      } else {
        const msg = errorDetail || "이력번호 조회에 실패했습니다.";
        setManualTraceError(msg);
        toast({
          title: "조회 실패",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setManualTraceLoading(false);
    }
  };

  const handleSaveTraceabilityToFridge = async (
    traceInfo: TraceabilityInfo | null
  ) => {
    if (!traceInfo) return;
    
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 저장은 로그인 후 이용할 수 있습니다. 게스트 모드에서는 냉장고 기능을 사용할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    let expiry = traceInfo.recommendedExpiry || traceInfo.limitToDt;
    if (!expiry) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      expiry = d.toISOString().slice(0, 10);
    } else {
      expiry = String(expiry).slice(0, 10);
    }
    setSavingFromTraceability(true);
    try {
      await addFridgeItemFromTraceability({
        partName: traceInfo.partName || undefined,
        storageDate: today,
        expiryDate: expiry,
        traceNumber: traceInfo.historyNo || undefined,
        slaughterDate: traceInfo.slaughterDate
          ? String(traceInfo.slaughterDate).slice(0, 10)
          : undefined,
        origin: traceInfo.origin || undefined,
        companyName: traceInfo.companyName || undefined,
      });
      toast({
        title: "저장 완료",
        description: "냉장고에 추가되었습니다.",
        duration: 3000,
      });
      // onSaveToFridge는 중복 toast를 호출하므로 제거
      // onSaveToFridge?.();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "냉장고 저장에 실패했습니다.";
      toast({
        title: "저장 실패",
        description: msg,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSavingFromTraceability(false);
    }
  };

  const handleTraceItemClick = async (historyNo: string | null | undefined) => {
    if (!historyNo?.trim()) return;
    setDetailLoading(true);
    setSelectedTraceDetail(null);
    try {
      // 수입 묶음번호 목록에서 클릭한 이력번호는 수입으로 강제 처리
      const detail = await getTraceabilityByNumber(historyNo.trim(), "import");
      setSelectedTraceDetail(detail);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "상세 조회에 실패했습니다.";
      toast({
        title: "상세 조회 실패",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveToFridge = async () => {
    // 게스트 모드 체크
    if (getIsGuest() || !getAuthToken()) {
      toast({
        title: "로그인 필요",
        description: "냉장고 저장은 로그인 후 이용할 수 있습니다. 게스트 모드에서는 냉장고 기능을 사용할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!analysisResponse || !analysisResponse.partName) {
      toast({
        title: "저장 실패",
        description: "분석 결과가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // auto_add_fridge = true로 다시 분석하여 자동 저장
      const blob = await fetch(selectedImage!).then((r) => r.blob());
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });

      await analyzeImage(file, mode, true); // auto_add_fridge = true

      const successMsg = `${analysisResponse.partName}이(가) 냉장고에 저장되었습니다.`;
      toast({
        title: "저장 완료",
        description: successMsg,
        duration: 3000,
      });

      // onSaveToFridge는 중복 toast를 호출하므로 제거하거나 조건부로 호출
      // onSaveToFridge();
    } catch (error: any) {
      const errorMsg = error.message || "냉장고에 저장하는데 실패했습니다.";
      console.error("[API RESPONSE ERROR]: ", error.response?.data || errorMsg);
      toast({
        title: "저장 실패",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setAnalysisResponse(null);
    setError(null);
    setInputMethod(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                <Eye
                  className={`w-5 h-5 ${
                    mode === "vision" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <Label htmlFor="mode-switch" className="text-sm font-medium">
                  {mode === "vision" ? "부위 판별 모드" : "이력번호 인식 모드"}
                </Label>
              </div>
              <Switch
                id="mode-switch"
                checked={mode === "ocr"}
                onCheckedChange={(checked) =>
                  setMode(checked ? "ocr" : "vision")
                }
                className="data-[state=checked]:bg-primary"
              />
              <FileText
                className={`w-5 h-5 ${
                  mode === "ocr" ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI {mode === "vision" ? "Vision" : "OCR"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 이력번호 / 묶음번호 직접 조회 */}
      <Card className="bg-card border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            이력번호 / 묶음번호로 조회
          </CardTitle>
          <CardDescription>
            국내 12자리 이력번호(002188519524) 또는 묶음번호(L12601205379002)는
            M-Trace 웹사이트로 이동하며, 수입 묶음번호(A+숫자)는 사이트에서
            조회됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="예: 002188519524 또는 L12601205379002 (국산), A41535850069100026012505 (수입)"
              value={traceInput}
              onChange={(e) => {
                setTraceInput(e.target.value);
                setManualTraceError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleTraceabilityLookup()}
              className="flex-1"
            />
            <Button
              onClick={handleTraceabilityLookup}
              disabled={manualTraceLoading}
              variant="secondary"
              className="shrink-0"
            >
              {manualTraceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "조회"
              )}
            </Button>
          </div>
          {manualTraceError && (
            <p className="text-sm text-destructive">{manualTraceError}</p>
          )}
          {/* 묶음 조회: 이력 목록 (클릭 시 상세) */}
          {manualTraceabilityList && manualTraceabilityList.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-primary">
                묶음 이력 목록 ({manualTraceabilityList.length}건) — 클릭 시
                상세
              </h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {manualTraceabilityList.map((item, idx) => (
                  <li key={item.historyNo ?? idx}>
                    <button
                      type="button"
                      onClick={() => handleTraceItemClick(item.historyNo)}
                      disabled={detailLoading}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.historyNo || "(이력번호 없음)"}
                      </span>
                      {(item.origin || item.partName || item.slaughterDate) && (
                        <span className="ml-2 text-sm">
                          {[item.origin, item.partName, item.slaughterDate]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {detailLoading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  상세 정보 조회 중...
                </p>
              )}
              {selectedTraceDetail && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <h4 className="text-sm font-semibold text-primary">
                    선택 이력 상세 (냉장고 연동용)
                  </h4>
                  <TraceabilityDetailSections
                    info={selectedTraceDetail}
                    onSaveToFridge={() =>
                      handleSaveTraceabilityToFridge(selectedTraceDetail)
                    }
                    saving={savingFromTraceability}
                  />
                </div>
              )}
            </div>
          )}
          {/* 단건 조회: 이력 정보 4개 섹션 + 냉장고 저장 */}
          {manualTraceability && !manualTraceabilityList?.length && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <h4 className="text-sm font-semibold text-primary">
                이력 정보 (냉장고 연동용)
              </h4>
              <TraceabilityDetailSections
                info={manualTraceability}
                onSaveToFridge={() =>
                  handleSaveTraceabilityToFridge(manualTraceability)
                }
                saving={savingFromTraceability}
              />
            </div>
          )}
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
                  <h3 className="text-lg font-semibold mb-2">
                    이미지를 드래그하거나 클릭하세요
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    JPG, PNG 파일 (최대 10MB)
                  </p>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
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
                {isMobileDevice() ? "카메라로 촬영하기" : "웹캠으로 촬영하기"}
              </Button>
              {/* 모바일 네이티브 카메라 입력 (숨김) */}
              <input
                ref={mobileCameraInputRef}
                type="file"
                accept="image/*"
                capture={isAndroidDevice() ? "environment" : undefined}
                onChange={handleMobileCameraSelect}
                className="hidden"
              />
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
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        console.log("Video stream ready:", {
                          width: videoRef.current.videoWidth,
                          height: videoRef.current.videoHeight,
                        });
                      }
                    }}
                    onError={(e) => {
                      console.error("Video element error:", e);
                      setError("비디오 스트림을 재생할 수 없습니다.");
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex gap-2 justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
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
                {/* 분석 완료 알림 - 가운데 출력 */}
                {result && !analyzing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/30 p-6 mb-6"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div className="text-center flex-1">
                        <h3 className="text-xl font-bold text-primary mb-1">
                          분석이 완료되었습니다!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {result.partName} 부위가 성공적으로 분석되었습니다.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Analysis Result - 반응형 레이아웃 */}
                {result ? (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* 왼쪽: 이미지 (작게) */}
                    <div className="flex-shrink-0 lg:w-80 xl:w-96">
                      <div className="space-y-3 sticky top-4">
                        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 shadow-sm">
                          <img
                            src={selectedImage}
                            alt="Selected"
                            className="w-full h-auto object-contain max-h-[400px] lg:max-h-[500px]"
                          />
                          {result?.gradCAM && (
                            <img
                              src={result.gradCAM}
                              alt="Grad-CAM 히트맵"
                              className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply pointer-events-none"
                            />
                          )}
                        </div>
                        {/* 히트맵 단독 표시 */}
                        {result?.gradCAM && (
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              모델이 집중한 영역 (Grad-CAM)
                            </p>
                            <img
                              src={result.gradCAM}
                              alt="Grad-CAM 히트맵"
                              className="w-full rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 오른쪽: 분석 정보 */}
                    <div className="flex-1 min-w-0 space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* 신뢰도 20% 미만 경고 */}
                        {result.confidence < 0.2 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800"
                          >
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-red-900 mb-1">
                                  인식 신뢰도가 낮습니다
                                </h4>
                                <p className="text-sm text-red-700">
                                  사진을 더 명확하게 찍어주세요. 조명이 충분하고
                                  고기 부위가 명확하게 보이도록 해주세요.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* 분석 결과 */}
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <h3 className="text-xl font-bold text-primary mb-2">
                            {result.partName}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              신뢰도: {(result.confidence * 100).toFixed(1)}%
                            </Badge>
                            {result.origin && (
                              <Badge variant="secondary">{result.origin}</Badge>
                            )}
                            {result.grade && (
                              <Badge className="bg-primary text-primary-foreground">
                                {result.grade}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* OCR/분석 결과 이력 정보 */}
                        {/* OCR/분석 결과 이력 정보 — 실제 사이트와 동일 4개 섹션 */}
                        {analysisResponse?.traceability && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                            <h4 className="text-sm font-semibold text-primary">
                              이력 정보 (냉장고 연동용)
                            </h4>
                            <TraceabilityDetailSections
                              info={analysisResponse.traceability}
                            />
                          </div>
                        )}

                        {/* 영양정보 및 가격정보 */}
                        {meatInfo ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* 영양정보 */}
                            <Card className="bg-card border-primary/20">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                  영양정보 (100g당)
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-1 text-sm">
                                {/* Fallback 데이터 안내 */}
                                {meatInfo.nutritionSource &&
                                  (meatInfo.nutritionSource === "fallback" ||
                                    meatInfo.nutritionSource === "timeout" ||
                                    meatInfo.nutritionSource === "error") && (
                                    <div className="mb-2 p-3 rounded-lg bg-yellow-50/80 border border-yellow-200/50 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                                      <p className="text-xs text-yellow-800 leading-relaxed">
                                        실시간 데이터 호출 실패 (사유:{" "}
                                        {meatInfo.nutritionSource === "fallback"
                                          ? "API 응답 없음"
                                          : meatInfo.nutritionSource ===
                                            "timeout"
                                          ? "타임아웃"
                                          : "연결 오류"}
                                        ), 기본 데이터 사용 중
                                      </p>
                                    </div>
                                  )}
                                {meatInfo.calories !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      칼로리
                                    </span>
                                    <span className="font-medium">
                                      {meatInfo.calories}kcal
                                    </span>
                                  </div>
                                )}
                                {meatInfo.protein !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      단백질
                                    </span>
                                    <span className="font-medium">
                                      {meatInfo.protein.toFixed(1)}g
                                    </span>
                                  </div>
                                )}
                                {meatInfo.fat !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      지방
                                    </span>
                                    <span className="font-medium">
                                      {meatInfo.fat.toFixed(1)}g
                                    </span>
                                  </div>
                                )}
                                {meatInfo.carbohydrate !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      탄수화물
                                    </span>
                                    <span className="font-medium">
                                      {meatInfo.carbohydrate.toFixed(1)}g
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* 가격정보 */}
                            <Card className="bg-card border-primary/20">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                  시세 정보
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-1 text-sm">
                                {/* Fallback 데이터 안내 */}
                                {meatInfo.priceSource === "fallback" && (
                                  <div className="mb-2 p-3 rounded-lg bg-yellow-50/80 border border-yellow-200/50 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-yellow-800 leading-relaxed">
                                      실시간 데이터 호출 실패 (사유: API 응답
                                      없음), 기본 데이터 사용 중
                                    </p>
                                  </div>
                                )}
                                {meatInfo.currentPrice > 0 ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        현재 가격
                                      </span>
                                      <span className="font-medium">
                                        {meatInfo.currentPrice.toLocaleString()}
                                        원
                                      </span>
                                    </div>
                                    {meatInfo.gradePrices &&
                                      meatInfo.gradePrices.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <div className="text-xs text-muted-foreground">
                                            등급별 가격
                                          </div>
                                          {meatInfo.gradePrices.map((gp) => (
                                            <div
                                              key={`${gp.grade}-${gp.price}`}
                                              className="flex flex-col text-xs"
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                  {gp.grade}
                                                </span>
                                                <span className="flex items-center gap-2 font-medium">
                                                  {gp.price.toLocaleString()}원
                                                  <Badge
                                                    variant={
                                                      gp.trend === "up"
                                                        ? "default"
                                                        : gp.trend === "down"
                                                        ? "secondary"
                                                        : "outline"
                                                    }
                                                    className="text-[10px]"
                                                  >
                                                    {gp.trend === "up"
                                                      ? "↑"
                                                      : gp.trend === "down"
                                                      ? "↓"
                                                      : "→"}
                                                  </Badge>
                                                </span>
                                              </div>
                                              {gp.priceDate && (
                                                <div className="flex justify-end text-[10px] text-muted-foreground">
                                                  {gp.priceDate}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        단위
                                      </span>
                                      <span className="font-medium">
                                        {meatInfo.priceUnit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        추세
                                      </span>
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
                                        {meatInfo.priceTrend === "up"
                                          ? "↑ 상승"
                                          : meatInfo.priceTrend === "down"
                                          ? "↓ 하락"
                                          : "→ 보합"}
                                      </Badge>
                                    </div>
                                    {meatInfo.priceDate && (
                                      <div className="text-xs text-muted-foreground mt-2">
                                        기준일: {meatInfo.priceDate}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                    <div className="w-16 h-16 mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                                      <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      가격 정보 제공 불가
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      이 부위에 대한 가격정보를 제공하지
                                      않습니다.
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        ) : null}

                        {/* 저장 버튼 - 게스트 모드일 때 숨김 */}
                        {!getIsGuest() && getAuthToken() && (
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
                        )}
                        {getIsGuest() && (
                          <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                            <p className="text-sm text-muted-foreground">
                              냉장고 저장 기능은 로그인 후 이용할 수 있습니다.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  /* 이미지 선택 후 분석 전 - 이미지와 분석 버튼 */
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-auto object-contain max-h-[500px] mx-auto"
                      />
                    </div>
                    {/* Analyze Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
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
                  </div>
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
  );
}
