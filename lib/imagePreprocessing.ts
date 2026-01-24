// Image Preprocessing Utility for AI Analysis

export interface PreprocessedImage {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

/**
 * Preprocesses an image before sending to AI server
 * - Resizes to max 1024px on longest side
 * - Compresses to reduce file size
 * - Converts to base64 data URL
 */
export async function preprocessImage(
  file: File,
  maxSize: number = 1024,
  quality: number = 0.9
): Promise<PreprocessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed data URL
        const dataUrl = canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                dataUrl: reader.result as string,
                width,
                height,
                originalSize: file.size,
                compressedSize: blob.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Captures image from video stream (webcam)
 */
export function captureFromVideo(
  videoElement: HTMLVideoElement,
  maxSize: number = 1024
): string {
  const canvas = document.createElement("canvas");
  
  let width = videoElement.videoWidth;
  let height = videoElement.videoHeight;

  // Resize if needed
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(videoElement, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "이미지 파일만 업로드 가능합니다." };
  }

  // Check file size (max 10MB)
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxFileSize) {
    return { valid: false, error: "파일 크기는 10MB 이하여야 합니다." };
  }

  return { valid: true };
}

/**
 * Creates a preview URL for an image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

