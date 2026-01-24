# Meat-A-Eye Frontend

AI를 활용한 고기 부위 판별(Vision) 및 이력번호 추출(OCR), 냉장고 보관 관리, 그리고 LLM 기반 레시피 추천 서비스

## 🎨 디자인 테마

- **Ivory (#FAF9F6)**: 메인 배경 및 카드 배경
- **Burgundy (#800000)**: 포인트 컬러, 버튼, 헤더 테두리
- **레이아웃**: 데스크탑 3열 / 모바일 1열의 Bento Grid 스타일 대시보드

## 🚀 기술 스택

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (아이콘)
- **Recharts** (데이터 시각화)
- **Framer Motion** (애니메이션)

## 📁 프로젝트 구조

```
Meat_A_Eye-frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/         # 메인 대시보드 페이지
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── views/            # 주요 뷰 컴포넌트
│   │   │   ├── dashboard-view.tsx    # Bento Grid 대시보드
│   │   │   ├── analysis-view.tsx     # AI 분석 (Vision/OCR)
│   │   │   ├── fridge-view.tsx       # 냉장고 관리
│   │   │   └── recipe-view.tsx       # 레시피 탐색
│   │   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── guest-mode-modal.tsx      # 비회원 진입 모달
│   │   └── llm-recipe-modal.tsx      # AI 레시피 추천 모달
│   ├── lib/
│   │   ├── api.ts                    # API 래퍼 (Mock 인터셉터 포함)
│   │   ├── imagePreprocessing.ts     # 이미지 전처리 유틸리티
│   │   └── utils.ts
│   └── constants/
│       └── mockData.ts               # Mock 데이터
├── public/
├── .env.local.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 설치 및 실행

### 1. 의존성 설치

```bash
cd Meat_A_Eye-frontend
pnpm install
# 또는
npm install
```

### 2. 환경 변수 설정

`.env.local.example` 파일을 `.env.local`로 복사하고 필요한 값을 입력하세요:

```env
# API URLs
NEXT_PUBLIC_AI_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Mock Data Mode (백엔드 개발 완료 전까지 true 유지)
NEXT_PUBLIC_USE_MOCK_DATA=true

# LLM API Keys (레시피 생성용)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
# 또는
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 개발 서버 실행

```bash
pnpm dev
# 또는
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

## ✨ 주요 기능

### 1. 대시보드 (Bento Grid)

- **카드 A (대형)**: 최근 분석한 고기 결과 및 요약
- **카드 B (중형)**: 현재 냉장고 보관 현황 (유통기한 임박순 정렬)
- **카드 C (중형)**: 고기 시세 추이 차트 (Recharts)
- **카드 D (소형)**: 오늘의 고기 상식 또는 영양성분 요약
- 반응형: 데스크탑 3열 → 모바일 1열

### 2. AI 분석 (Analysis/Camera)

#### 멀티 입력 시스템

- **드래그 앤 드롭**: 이미지 파일 업로드
- **파일 선택**: 클릭하여 파일 선택
- **웹캠 촬영**: 실시간 카메라 촬영

#### AI 모드 토글

- **부위 판별 모드 (Vision)**: 고기 부위 인식
- **이력번호 인식 모드 (OCR)**: 이력번호 추출

#### 이미지 전처리

- 1024px 이하로 자동 리사이징
- JPEG 압축 (품질: 90%)
- Canvas API 활용

#### 결과 시각화

- 부위명, 신뢰도 점수 표시
- Grad-CAM 열지도 오버레이
- 냉장고 저장 기능

### 3. 냉장고 관리

#### 상태 기반 리스트

- 유통기한 임박순 정렬
- D-Day 자동 계산

#### D-Day 로직

- **D-1 이하**: 빨간색 테두리 + 배경
- **D-3 이하**: 노란색 테두리 + 배경
- **D-4 이상**: 초록색 테두리 + 배경

#### 수동 입력 모달

- 고기 종류, 부위명, 중량
- 유통기한, 등급, 메모
- 수정/삭제 기능

### 4. LLM 레시피 추천 (Magic Wand)

- 상단 헤더의 마법봉 아이콘 클릭
- 냉장고의 고기 데이터 기반으로 레시피 3가지 자동 생성
- LLM API (OpenAI/Gemini) 활용
- 버건디 컬러의 로딩 애니메이션
- 자세한 조리법 및 재료 표시

### 5. 게스트 모드

- 첫 접속 시 닉네임 설정 모달
- LocalStorage에 닉네임 및 임시 토큰 저장
- 세션 유지 기능

### 6. 애니메이션 (Framer Motion)

- 버튼 호버/클릭 시 스케일 애니메이션
- 페이지 전환 애니메이션
- 카드 Fade-in 애니메이션
- 탭 전환 시 레이아웃 애니메이션

## 🎯 Mock Data 모드

백엔드 개발 전까지 Mock Data로 동작합니다:

- `NEXT_PUBLIC_USE_MOCK_DATA=true`로 설정
- API 호출 실패 시 자동으로 Mock 데이터 반환
- `src/constants/mockData.ts`에 모든 Mock 데이터 정의

## 📱 반응형 디자인

- **Desktop**: 3열 Bento Grid, 사이드바 표시
- **Tablet**: 2열 Grid, 사이드바 숨김
- **Mobile**: 1열 Grid, 하단 네비게이션

## 🔐 보안

- JWT 토큰 자동 헤더 삽입
- LocalStorage에 민감 정보 저장 (클라이언트 사이드만)
- 이미지 전처리로 파일 크기 제한

## 🚧 향후 개발

1. 백엔드 API 연동
2. 실제 AI 서버 연동
3. 회원 가입/로그인 기능
4. 푸시 알림 (유통기한 임박)
5. PWA 지원
6. 다크 모드

## 📝 라이센스

Meat-A-Eye Project © 2026

---

**개발자**: Meat-A-Eye Team
**버전**: 1.0.0
**최종 업데이트**: 2026-01-24
