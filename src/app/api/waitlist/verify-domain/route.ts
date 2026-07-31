import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    verified: false,
    message: "Verification will be available in a future update",
  });
}
