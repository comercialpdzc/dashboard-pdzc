import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const APPS_SCRIPT_LEADS_URL = process.env.APPS_SCRIPT_LEADS_URL;

    if (!APPS_SCRIPT_LEADS_URL) {
      return NextResponse.json(
        { ok: false, error: 'Falta APPS_SCRIPT_LEADS_URL en variables de entorno' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const res = await fetch(APPS_SCRIPT_LEADS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: 'La respuesta del Apps Script no es JSON válido',
          raw: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}