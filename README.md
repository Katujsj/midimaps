# 🎹 미디올로지 전국 동아리 지도

전국에 흩어진 미디올로지 동아리원들의 위치를 한눈에 볼 수 있는 인터랙티브 지도 서비스입니다.

## 기능
- 🗺️ **전국 지도** — CartoDB 다크 테마 지도에 동아리원 마커 표시
- 👤 **회원가입 / 로그인** — 이메일+비밀번호 기반 (JWT, httpOnly 쿠키)
- 📍 **위치 등록/수정** — 지도 클릭으로 내 위치 직접 지정
- 💬 **의견 게시판** — 간단한 메시지 남기기
- 🔒 **본인만 수정** — 자신의 프로필만 편집/삭제 가능

## 기술 스택
| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| DB | MongoDB Atlas M0 (무료) + Mongoose |
| 인증 | JWT (jose) + bcryptjs |
| 지도 | Leaflet + react-leaflet |
| 스타일 | Tailwind CSS + CSS Variables |
| 배포 | Vercel (무료) |

---

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone <your-repo-url>
cd midiology-map
npm install
```

### 2. MongoDB Atlas 설정
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속 → 무료 계정 생성
2. **Create a cluster** → M0 (Free) 선택
3. Database Access → 유저 생성 (username / password 메모)
4. Network Access → `0.0.0.0/0` 추가 (Vercel에서 접근 허용)
5. Clusters → **Connect** → **Drivers** → 연결 문자열 복사

### 3. 환경변수 설정
```bash
cp .env.local.example .env.local
```
`.env.local` 파일 편집:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/midiology?retryWrites=true&w=majority
JWT_SECRET=랜덤한-긴-문자열-여기에-입력
```

> **JWT_SECRET 생성 팁:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. 로컬 실행
```bash
npm run dev
# → http://localhost:3000
```

---

## ☁️ Vercel 배포

### 방법 A — GitHub 연동 (권장)
1. 프로젝트를 GitHub에 push
2. [Vercel](https://vercel.com) → **Import Project** → GitHub 레포 선택
3. **Environment Variables** 탭에서 아래 두 값 입력:
   - `MONGODB_URI` — Atlas 연결 문자열
   - `JWT_SECRET` — 랜덤 시크릿 키
4. **Deploy** 클릭 → 완료 🎉

### 방법 B — Vercel CLI
```bash
npm i -g vercel
vercel
# 프롬프트 따라 진행 후 env 설정
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel --prod
```

---

## 📁 프로젝트 구조
```
midiology-map/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 + AuthProvider
│   ├── page.tsx            # 메인 지도 페이지
│   ├── globals.css         # 글로벌 스타일
│   ├── login/page.tsx      # 로그인/회원가입
│   └── api/
│       ├── auth/{register,login,me}/
│       ├── members/        # 전체 조회, 등록
│       ├── members/[id]/   # 수정, 삭제
│       └── comments/       # 의견 CRUD
├── components/
│   ├── Navbar.tsx
│   ├── MapView.tsx         # Leaflet 지도
│   ├── LocationPicker.tsx  # 위치 선택 지도
│   ├── MemberCard.tsx
│   ├── ProfileForm.tsx
│   └── CommentBoard.tsx
├── lib/
│   ├── mongodb.ts          # DB 연결
│   └── auth.ts             # JWT 유틸
├── models/
│   ├── User.ts
│   ├── Member.ts
│   └── Comment.ts
└── types/index.ts
```

---

## 💡 추후 개선 아이디어
- 카카오 소셜 로그인 연동
- 프로필 이미지 업로드 (Cloudinary 무료)
- 기수별 필터링
- 지역 클러스터링 (많아지면)
- 모바일 반응형 개선
