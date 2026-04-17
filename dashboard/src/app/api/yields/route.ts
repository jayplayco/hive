import { NextResponse } from "next/server";
import { aggregateYields } from "@/services/yieldProvider";

export const revalidate = 300; // 5-minute ISR cache

export async function GET() {
  try {
    const result = await aggregateYields();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        yields: [],
        lastUpdated: new Date().toISOString(),
        errors: [`Aggregation failed: ${String(error)}`],
      },
      { status: 500 }
    );
  }
}
