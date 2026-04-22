import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import Member from '@/models/Member';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    await connectDB();
    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: '멤버를 찾을 수 없습니다.' }, { status: 404 });

    if (member.userId.toString() !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { name, generation, region, bio, avatarUrl, lat, lng } = await req.json();
    Object.assign(member, { name, generation, region, bio, avatarUrl, lat, lng });
    await member.save();

    return NextResponse.json({ member });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    await connectDB();
    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: '멤버를 찾을 수 없습니다.' }, { status: 404 });

    if (member.userId.toString() !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    await member.deleteOne();
    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
