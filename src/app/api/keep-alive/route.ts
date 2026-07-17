import fetch from "node-fetch";
import { NextRequest, NextResponse } from "next/server";
import { URL, URLSearchParams } from "url";

const KEEP_ALIVE_URL = "https://api-markets.meteologica.com/api/v1/keepalive";

async function requestKeepAlive(token: string) {
  const url = new URL(KEEP_ALIVE_URL);
  url.search = new URLSearchParams({ token }).toString();

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      ok: response.ok,
      data,
    };
  } catch (error) {
    console.error("Keep-alive request failed:", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await requestKeepAlive(token);

  return NextResponse.json(result);
}
