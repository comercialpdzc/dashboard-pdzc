import { NextResponse } from 'next/server';

const VALID_USER = 'pdzc26';
const VALID_PASSWORD = '1234';

export async function POST(request) {
  try {
    const { user, password } = await request.json();

    if (user !== VALID_USER || password !== VALID_PASSWORD) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set('pdzc_auth', 'ok', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en el login' },
      { status: 500 }
    );
  }
}