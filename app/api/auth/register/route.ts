import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), password: hashed, name });

    const token = await signToken({ id: user._id.toString(), email: user.email, name: user.name });

    const res = NextResponse.json({ message: '회원가입 성공', user: { id: user._id, email: user.email, name: user.name } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
