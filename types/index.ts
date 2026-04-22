export interface IMember {
  _id: string;
  name: string;
  generation: number;       // 기수
  region: string;           // 지역
  bio: string;              // 소개글
  avatarUrl: string;        // 프로필 이미지 URL
  mapX: number;             // 지도 위치 X (0~100)
  mapY: number;             // 지도 위치 Y (0~100)
  lat: number;              // 실제 위도
  lng: number;              // 실제 경도
  userId: string;           // 연결된 유저 ID
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
