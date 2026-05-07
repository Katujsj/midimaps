import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import Comment from '@/models/Comment';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const { emoji } = await req.json();

    if (!['❤️', '👍', '😂', ''].includes(emoji)) {
      return NextResponse.json({ error: '잘못된 감정표현입니다.' }, { status: 400 });
    }

    await connectDB();

    const comment = await Comment.findById(id);

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (String(comment.authorId) === String(user.id)) {
      return NextResponse.json(
        { error: '내 추천곡에는\n감정표현을 남길 수 없어요' },
        { status: 400 }
      );
    }

    if (!comment.reactions) {
      comment.reactions = new Map();
    }

    if (emoji === '') {
      comment.reactions.delete(String(user.id));
    } else {
      comment.reactions.set(String(user.id), emoji);
    }

    await comment.save();

    return NextResponse.json({ comment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}