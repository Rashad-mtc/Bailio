"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type Role = "proprietaire" | "locataire";

function accountEmail(phone: string) { return `${phone.replace(/\D/g, "")}@accounts.bailio.local`; }

export function AuthCard({ expectedRole, initialMode = "login" }: { expectedRole?: Role; initialMode?: "login" | "register" }) {
  const router = useRouter();
  const role = expectedRole ?? "proprietaire";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "");
    const email = accountEmail(phone);
    try {
      if (mode === "register") {
        const invitationCode = String(form.get("invitationCode") ?? "").trim().toUpperCase();
        if (role === "locataire" && !invitationCode) throw new Error("INVITATION_REQUIRED");
        let invitation: Record<string, unknown> | null = null;
        if (role === "locataire") {
          const invitationSnapshot = await getDoc(doc(db, "invitations", invitationCode));
          if (!invitationSnapshot.exists() || invitationSnapshot.data().status !== "active") throw new Error("INVITATION_INVALID");
          invitation = invitationSnapshot.data();
        }
        const credential = await createUserWithEmailAndPassword(auth, email, String(form.get("password") ?? ""));
        await setDoc(doc(db, "users", credential.user.uid), { uid: credential.user.uid, nom: form.get("name"), telephone: phone, email, role, proprietaireId: invitation?.proprietaireId ?? null, logementId: invitation?.logementId ?? null, createdAt: new Date().toISOString() });
        if (invitation) await setDoc(doc(db, "invitations", invitationCode), { ...invitation, status: "used", usedBy: credential.user.uid }, { merge: true });
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, String(form.get("password") ?? ""));
        const profileSnapshot = await getDoc(doc(db, "users", credential.user.uid));
        const actualRole = profileSnapshot.data()?.role;
        if (actualRole !== role) { await signOut(auth); throw new Error(role === "locataire" ? "WRONG_OWNER_SPACE" : "WRONG_TENANT_SPACE"); }
      }
      document.cookie = `bailio-role=${role}; path=/; max-age=2592000; samesite=lax`;
      router.push(role === "locataire" ? "/locataire/dashboard" : "/dashboard");
    } catch (exception) {
      const code = exception instanceof Error ? exception.message : "";
      const messages: Record<string, string> = { INVITATION_REQUIRED: "Le code d’invitation fourni par votre propriétaire est obligatoire.", INVITATION_INVALID: "Ce code d’invitation est invalide ou a déjà été utilisé.", WRONG_OWNER_SPACE: "Ce compte est un compte locataire. Connectez-vous depuis l’espace locataire.", WRONG_TENANT_SPACE: "Ce compte est un compte propriétaire. Connectez-vous depuis l’espace propriétaire." };
      setError(messages[code] ?? "Impossible de finaliser cette opération. Vérifiez vos informations.");
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    const phone = window.prompt("Entrez votre numéro de téléphone");
    if (!phone) return;
    try { await sendPasswordResetEmail(auth, accountEmail(phone)); setNotice("Un lien de réinitialisation a été envoyé si ce compte existe."); } catch { setError("Impossible d’envoyer le lien de réinitialisation."); }
  }

  const isTenant = role === "locataire";
  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-mark">B</span><span>Bail<span className="brand-accent">io</span></span></Link><section className="auth-card"><div className="auth-card-heading"><span className="auth-symbol">{isTenant ? "♙" : "⌂"}</span><p className="eyebrow">ESPACE {isTenant ? "LOCATAIRE" : "PROPRIÉTAIRE"}</p><h1>{mode === "register" ? "Créer votre compte" : "Se connecter"}</h1><p>{isTenant ? "Accédez à vos loyers, factures et services." : "Gérez vos biens et vos locataires simplement."}</p></div><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }} type="button">Se connecter</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }} type="button">Créer un compte</button></div><form className="form-stack" onSubmit={submit}>{mode === "register" && <label>Nom complet<input name="name" type="text" placeholder="Votre nom et prénom" required /></label>}<label>Numéro de téléphone<input name="phone" type="tel" placeholder="+229 01 00 00 00 00" required /></label>{mode === "register" && isTenant && <label>Code d’invitation<input name="invitationCode" placeholder="Ex : BA-7K2P9M" required /></label>}<label>Mot de passe<input name="password" type="password" placeholder="Au moins 6 caractères" minLength={6} required /></label>{mode === "login" && <button className="forgot-password" onClick={resetPassword} type="button">Mot de passe oublié ?</button>}<button className="primary-button wide-button" disabled={loading} type="submit">{loading ? <><span className="button-spinner" />Chargement...</> : mode === "register" ? "Créer mon compte →" : "Se connecter →"}</button></form>{notice && <p className="form-notice">{notice}</p>}{error && <p className="form-error">{error}</p>}<p className="auth-switch">{isTenant ? "Vous êtes propriétaire ? " : "Vous êtes locataire ? "}<Link href={isTenant ? "/proprietaire/connexion" : "/locataire/connexion"}>Accéder à l’autre espace</Link></p></section><p className="auth-footer">Vos données sont protégées par Firebase Authentication.</p></main>;
}
