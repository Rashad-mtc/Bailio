"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RoleChoice({ role, icon, title, detail, tone }: { role: "proprietaire" | "locataire"; icon: string; title: string; detail: string; tone: "owner" | "tenant" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  function open() { setLoading(true); router.push(`/${role}/connexion`); }
  return <button className={`choice-card ${tone}-choice`} onClick={open} type="button"><span className="choice-icon">{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><b>{loading ? <span className="choice-spinner" /> : "→"}</b></button>;
}
