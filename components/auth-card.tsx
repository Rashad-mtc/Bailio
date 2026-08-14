"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import "react-phone-number-input/style.css";
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type Role = "proprietaire" | "locataire";
type Country = { flag: string; name: string; code: CountryCode };
const countries: Country[] = [
  { flag: "🇧🇯", name: "Bénin", code: "BJ" }, { flag: "🇧🇫", name: "Burkina Faso", code: "BF" }, { flag: "🇨🇲", name: "Cameroun", code: "CM" }, { flag: "🇰🇲", name: "Comores", code: "KM" }, { flag: "🇨🇬", name: "Congo-Brazzaville", code: "CG" }, { flag: "🇨🇮", name: "Côte d’Ivoire", code: "CI" }, { flag: "🇩🇯", name: "Djibouti", code: "DJ" }, { flag: "🇬🇦", name: "Gabon", code: "GA" }, { flag: "🇬🇳", name: "Guinée", code: "GN" }, { flag: "🇬🇶", name: "Guinée équatoriale", code: "GQ" }, { flag: "🇲🇬", name: "Madagascar", code: "MG" }, { flag: "🇲🇱", name: "Mali", code: "ML" }, { flag: "🇲🇷", name: "Mauritanie", code: "MR" }, { flag: "🇳🇪", name: "Niger", code: "NE" }, { flag: "🇨🇫", name: "République centrafricaine", code: "CF" }, { flag: "🇨🇩", name: "RD Congo", code: "CD" }, { flag: "🇷🇼", name: "Rwanda", code: "RW" }, { flag: "🇸🇳", name: "Sénégal", code: "SN" }, { flag: "🇹🇩", name: "Tchad", code: "TD" }, { flag: "🇹🇬", name: "Togo", code: "TG" },
];
const allowedCountries = countries.map((country) => country.code);

function accountEmail(phone: string) { return `${phone.replace(/\D/g, "")}@accounts.bailio.local`; }
function makeCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function firebaseError(exception: unknown) {
  if (exception && typeof exception === "object" && "code" in exception && "message" in exception) {
    const error = exception as { code: string; message: string };
    return `Firebase (${error.code}) : ${error.message}`;
  }
  return exception instanceof Error ? exception.message : "Erreur inconnue.";
}

export function AuthCard({ expectedRole, initialMode = "login" }: { expectedRole: Role; initialMode?: "login" | "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [phone, setPhone] = useState<string | undefined>(); const [googleUser, setGoogleUser] = useState<{ uid: string; email: string | null } | null>(null);
  const phoneIsValid = Boolean(phone && isValidPhoneNumber(phone));

  async function createVerification(uid: string) { const code = makeCode(); await setDoc(doc(db, "codesVerification", uid), { uid, code, statut: "en_attente", createdAt: Date.now(), expiresAt: Date.now() + 600000 }); return code; }
  async function finish(uid: string, role: Role, status: string) { document.cookie = `bailio-role=${role}; path=/; max-age=2592000; samesite=lax`; document.cookie = `bailio-status=${status}; path=/; max-age=2592000; samesite=lax`; if (status !== "actif") router.push(`/verification?uid=${uid}`); else router.push(role === "locataire" ? "/locataire/dashboard" : "/dashboard"); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setNotice("");
    if (!phone || !phoneIsValid) { setError("Saisissez un numéro valide pour le pays sélectionné."); setLoading(false); return; }
    const form = new FormData(event.currentTarget); const email = accountEmail(phone);
    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, String(form.get("password") ?? ""));
        await setDoc(doc(db, "users", credential.user.uid), { uid: credential.user.uid, nom: form.get("name"), telephone: phone, email, role: expectedRole, statut: "en_attente", createdAt: new Date().toISOString() });
        const code = await createVerification(credential.user.uid); setNotice(`Code de vérification envoyé. Code de test local : ${code}`); router.push(`/verification?uid=${credential.user.uid}`);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, String(form.get("password") ?? "")); const profile = await getDoc(doc(db, "users", credential.user.uid)); const data = profile.data();
        if (data?.role !== expectedRole) { await signOut(auth); throw new Error(expectedRole === "locataire" ? "WRONG_OWNER_SPACE" : "WRONG_TENANT_SPACE"); }
        await finish(credential.user.uid, expectedRole, data?.statut ?? "en_attente");
      }
    } catch (exception) { const code = exception && typeof exception === "object" && "code" in exception ? String((exception as { code: string }).code) : exception instanceof Error ? exception.message : ""; const messages: Record<string, string> = { WRONG_OWNER_SPACE: "Ce compte est un compte locataire. Utilisez l’espace locataire.", WRONG_TENANT_SPACE: "Ce compte est un compte propriétaire. Utilisez l’espace propriétaire.", "auth/email-already-in-use": "Un compte existe déjà avec ce numéro." }; setError(messages[code] ?? firebaseError(exception)); } finally { setLoading(false); }
  }

  async function googleSignIn() { setLoading(true); setError(""); try { const result = await signInWithPopup(auth, new GoogleAuthProvider()); const profile = await getDoc(doc(db, "users", result.user.uid)); const data = profile.data(); if (data?.role && data.role !== expectedRole) throw new Error(expectedRole === "locataire" ? "WRONG_OWNER_SPACE" : "WRONG_TENANT_SPACE"); if (!data?.telephone || !data?.role) { setGoogleUser({ uid: result.user.uid, email: result.user.email }); return; } await finish(result.user.uid, expectedRole, data.statut ?? "en_attente"); } catch (exception) { const code = exception && typeof exception === "object" && "code" in exception ? String((exception as { code: string }).code) : exception instanceof Error ? exception.message : ""; const known: Record<string, string> = { "auth/unauthorized-domain": "Ce domaine n’est pas autorisé par Firebase. Ajoutez bailio-livid.vercel.app et localhost dans Authentication > Settings > Authorized domains.", "auth/popup-blocked": "La fenêtre Google a été bloquée par le navigateur. Autorisez les fenêtres pop-up puis réessayez.", "auth/popup-closed-by-user": "La fenêtre Google a été fermée avant la fin de la connexion.", "auth/operation-not-allowed": "La connexion Google n’est pas activée dans Firebase Authentication > Sign-in method.", WRONG_OWNER_SPACE: "Ce compte est un compte locataire. Utilisez l’espace locataire.", WRONG_TENANT_SPACE: "Ce compte est un compte propriétaire. Utilisez l’espace propriétaire." }; setError(known[code] ?? `${firebaseError(exception)} Vérifiez que le fournisseur Google et le domaine de cette application sont autorisés dans Firebase.`); } finally { setLoading(false); } }
  async function completeGoogle(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); if (!phone || !phoneIsValid) { setError("Saisissez un numéro valide pour le pays sélectionné."); setLoading(false); return; } try { const form = new FormData(event.currentTarget); await setDoc(doc(db, "users", googleUser!.uid), { uid: googleUser!.uid, email: googleUser!.email, telephone: phone, nom: form.get("name"), role: expectedRole, statut: "en_attente", createdAt: new Date().toISOString() }); const code = await createVerification(googleUser!.uid); setNotice(`Code de test local : ${code}`); router.push(`/verification?uid=${googleUser!.uid}`); } catch (exception) { setError(firebaseError(exception)); } finally { setLoading(false); } }
  async function resetPassword() { const rawPhone = window.prompt("Entrez votre numéro de téléphone au format international (+229...)"); if (!rawPhone || !isValidPhoneNumber(rawPhone)) { setError("Saisissez un numéro international valide pour réinitialiser le mot de passe."); return; } try { await sendPasswordResetEmail(auth, accountEmail(rawPhone)); setNotice("Un lien de réinitialisation a été envoyé si le compte existe."); } catch (exception) { setError(firebaseError(exception)); } }

  const title = expectedRole === "locataire" ? "Espace locataire" : "Espace propriétaire";
  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-mark">B</span><span>Bail<span className="brand-accent">io</span></span></Link><section className="auth-card"><div className="auth-card-heading"><span className="auth-symbol">{expectedRole === "locataire" ? "♙" : "⌂"}</span><p className="eyebrow">{title.toUpperCase()}</p><h1>{googleUser ? "Complétez votre profil" : mode === "register" ? "Créer votre compte" : "Se connecter"}</h1><p>{googleUser ? "Votre numéro et votre nom sont nécessaires." : "Un accès simple et sécurisé à votre espace."}</p></div>{googleUser ? <form className="form-stack" onSubmit={completeGoogle}><label>Nom complet<input name="name" required placeholder="Votre nom et prénom" /></label><PhoneFields value={phone} onChange={setPhone} showError={Boolean(phone)} /><button className="primary-button wide-button" disabled={loading || !phoneIsValid} type="submit">Enregistrer mon profil →</button></form> : <><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">Se connecter</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">Créer un compte</button></div><form className="form-stack" onSubmit={submit}>{mode === "register" && <label>Nom complet<input name="name" required placeholder="Votre nom et prénom" /></label>}<PhoneFields value={phone} onChange={setPhone} showError={mode === "register" && Boolean(phone)} />{mode === "register" && <p className="auth-helper">Un code à 6 chiffres vous sera demandé après l’inscription.</p>}<label>Mot de passe<input name="password" type="password" minLength={6} required placeholder="Minimum 6 caractères" /></label>{mode === "login" && <button className="forgot-password" onClick={resetPassword} type="button">Mot de passe oublié ?</button>}<button className="primary-button wide-button" disabled={loading || (mode === "register" && !phoneIsValid)} type="submit">{loading ? <><span className="button-spinner" />Chargement...</> : mode === "register" ? "Créer mon compte →" : "Se connecter →"}</button></form><button className="google-button" disabled={loading} onClick={googleSignIn} type="button"><span>G</span>S’inscrire avec Google</button></>}{notice && <p className="form-notice">{notice}</p>}{error && <p className="form-error">{error}</p>}{!googleUser && <p className="auth-switch">{expectedRole === "locataire" ? "Vous êtes propriétaire ? " : "Vous êtes locataire ? "}<Link href={expectedRole === "locataire" ? "/proprietaire/connexion" : "/locataire/connexion"}>Autre espace</Link></p>}</section><p className="auth-footer">Vos données sont protégées par Firebase Authentication.</p></main>;
}

function PhoneFields({ value, onChange, showError }: { value: string | undefined; onChange: (value: string | undefined) => void; showError: boolean }) { return <div className="phone-fields"><PhoneInput international defaultCountry="BJ" countries={allowedCountries} value={value} onChange={onChange} placeholder="Numéro de téléphone" aria-label="Numéro de téléphone" /><p className="phone-error">{showError && !isValidPhoneNumber(value || "") ? "Le numéro ne correspond pas au format du pays sélectionné." : ""}</p></div>; }
