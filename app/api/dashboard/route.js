import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const APPS_SCRIPT_DASHBOARD_URL =
      process.env.APPS_SCRIPT_DASHBOARD_URL || process.env.APPS_SCRIPT_LEADS_URL;

    if (!APPS_SCRIPT_DASHBOARD_URL) {
      return NextResponse.json(
        { ok: false, error: 'Falta APPS_SCRIPT_DASHBOARD_URL o APPS_SCRIPT_LEADS_URL en variables de entorno' },
        { status: 500 }
      );
    }

    const res = await fetch(APPS_SCRIPT_DASHBOARD_URL, {
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Apps Script respondió HTTP ${res.status}` },
        { status: 500 }
      );
    }

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: 'La respuesta del Apps Script no es JSON válido',
          raw: text.slice(0, 1000),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `Error llamando al Apps Script: ${String(error?.message || error)}`,
      },
      { status: 500 }
    );
  }
}