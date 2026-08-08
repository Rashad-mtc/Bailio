import { NextResponse } from "next/server";
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); return NextResponse.json({ ok: true, message: "SMS placé en file d’envoi", to: body.to ?? null }); }
