import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import Comment from '@/models/Comment';
import Member from '@/models/Member';

// GET /api/song-comments
export async function GET() {
  try {
    await connectDB();

    const comments = await Comment.find({ type: 'song' })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ comments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST /api/song-comments
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: '500자 이내로 입력해주세요.' }, { status: 400 });
    }

    await connectDB();

    const KST = 9 * 60 * 60 * 1000;
    const nowKST = new Date(Date.now() + KST);
    const y = nowKST.getUTCFullYear(), mo = nowKST.getUTCMonth(), d = nowKST.getUTCDate();
    const start = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0) - KST);
    const end   = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999) - KST);

    const alreadyPosted = await Comment.findOne({
      authorId: user.id,
      type: 'song',
      createdAt: { $gte: start, $lte: end },
    });

    if (alreadyPosted) {
      return NextResponse.json(
        { error: '추천곡은 하루에 한 곡만 올릴 수 있어요😣' },
        { status: 400 }
      );
    }

    const member = await Member.findOne({ userId: user.id });

    const comment = await Comment.create({
      content: content.trim(),
      authorName: user.name,
      authorId: user.id,
      authorAvatarUrl: member?.avatarUrl || '',
      type: 'song',
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}