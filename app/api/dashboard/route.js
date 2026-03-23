export async function GET() {
  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxCPD0gsuElXVyg6YVix0cTFINOzmpsiEEzxuiZnmJVKF9GnKbPQvbOPasPGLtABX6wRg/exec';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok) {
      return Response.json(
        { error: `Apps Script respondió HTTP ${res.status}` },
        { status: 500 }
      );
    }

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return Response.json(
        { error: 'La respuesta del Apps Script no es JSON válido', raw: text },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: `Error llamando al Apps Script: ${String(error.message || error)}` },
      { status: 500 }
    );
  }
}