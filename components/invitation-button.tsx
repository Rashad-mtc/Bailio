"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

function code() { return `BA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }

export function InvitationButton({ logementId = "A-03" }: { logementId?: string }) {
  const [invitation, setInvitation] = useState("");
  const [loading, setLoading] = useState(false);
  async function createInvitation() {
    setLoading(true);
    const value = code();
    try { await setDoc(doc(db, "invitations", value), { code: value, proprietaireId: auth.currentUser?.uid ?? null, logementId, status: "active", createdAt: new Date().toISOString() }); setInvitation(value); } finally { setLoading(false); }
  }
  return <div className="invitation-action">{invitation ? <span className="invitation-code">Code : <strong>{invitation}</strong></span> : <button className="primary-button" disabled={loading} onClick={createInvitation} type="button">{loading ? "Génération..." : "+ Générer une invitation"}</button>}</div>;
}
