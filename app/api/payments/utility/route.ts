import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const provider = String(form.get("provider") ?? "");
  if (!["soneb", "sbee"].includes(provider)) return NextResponse.json({ error: "Fournisseur non pris en charge" }, { status: 400 });
  return NextResponse.json({ ok: true, status: "pending", provider, message: "Demande de paiement créée. Le fournisseur de paiement doit confirmer la transaction." }, { status: 202 });
}
