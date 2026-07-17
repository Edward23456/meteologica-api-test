import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { error: "Missing required query params: year, month" },
      { status: 400 },
    );
  }

  const url = new URL(
    `https://api-markets.meteologica.com/api/v1/contents/${id}/historical_data/${year}/${month}`,
  );
  url.search = new URLSearchParams({ token }).toString();

  const upstreamResponse = await fetch(url);

  if (!upstreamResponse.ok) {
    let errorPayload: unknown;
    try {
      errorPayload = await upstreamResponse.json();
    } catch {
      errorPayload = {
        error: `Failed to fetch historical data: ${upstreamResponse.status}`,
      };
    }
    return NextResponse.json(errorPayload, { status: upstreamResponse.status });
  }

  if (!upstreamResponse.body) {
    return NextResponse.json(
      { error: "Empty response from upstream" },
      { status: 502 },
    );
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="historical_data_${id}_${year}_${month}.zip"`,
    },
  });
}
