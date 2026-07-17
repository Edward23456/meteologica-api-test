import fetch from "node-fetch";
import { NextResponse } from "next/server";
import { URL, URLSearchParams } from "url";

const KEEP_ALIVE_URL = "https://api-markets.meteologica.com/api/v1/keepalive";
const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000;

let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

async function requestKeepAlive() {
  const url = new URL(KEEP_ALIVE_URL);
  url.search = new URLSearchParams({
    token: process.env.METEOLOGICA_TOKEN ?? "string",
  }).toString();

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Keep-alive response:", data);

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

if (typeof globalThis !== "undefined" && keepAliveTimer === null) {
  keepAliveTimer = setInterval(() => {
    void requestKeepAlive();
  }, KEEP_ALIVE_INTERVAL_MS);
}

export async function GET() {
  const result = await requestKeepAlive();
  return NextResponse.json(result);
}
