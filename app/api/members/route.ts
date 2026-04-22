import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import Member from '@/models/Member';

// GET /api/members - 전체 멤버 조회
export async function GET() {
  try {
    await connectDB();
    const members = await Member.find({}).sort({ generation: 1 });
    return NextResponse.json({ members });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST /api/members - 내 위치 등록
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { name, generation, region, bio, avatarUrl, lat, lng } = await req.json();

    if (!name || !generation || !region || lat == null || lng == null) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
    }

    await connectDB();

    // 이미 등록된 멤버인지 확인
    const existing = await Member.findOne({ userId: user.id });
    if (existing) {
      return NextResponse.json({ error: '이미 등록된 멤버입니다. 수정 기능을 사용해주세요.' }, { status: 409 });
    }

    const member = await Member.create({
      name, generation, region,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      lat, lng,
      userId: user.id,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
