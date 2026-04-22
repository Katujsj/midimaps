import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import Comment from '@/models/Comment';

// GET /api/comments
export async function GET() {
  try {
    await connectDB();
    const comments = await Comment.find({}).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ comments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: '500자 이내로 입력해주세요.' }, { status: 400 });
    }

    await connectDB();
    const comment = await Comment.create({
      content: content.trim(),
      authorName: user.name,
      authorId: user.id,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
