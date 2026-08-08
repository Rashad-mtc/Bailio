import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  return NextResponse.json({ ok: true, requestId: `TECH-${Date.now()}`, category: form.get("category"), status: "received", message: "Votre demande a été transmise au gestionnaire." }, { status: 201 });
}
