"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationResult, RecaptchaVerifier, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function AuthCard({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("proprietaire");
  const router = useRouter();
  void handlePhoneAuth;
  void confirmCode;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      if (register) {
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", credential.user.uid), { uid: credential.user.uid, nom: form.get("name"), telephone: form.get("phone"), email, role, createdAt: new Date().toISOString() });
        document.cookie = `bailio-role=${role}; path=/; max-age=2592000; samesite=lax`;
        router.push(role === "locataire" ? "/locataire/dashboard" : "/dashboard");
      } else {
        const credential = await signInWithEmailAndPassword(auth, String(form.get("email") ?? ""), String(form.get("password") ?? ""));
        const profile = await getDoc(doc(db, "users", credential.user.uid));
        const accountRole = profile.data()?.role === "locataire" ? "locataire" : "proprietaire";
        document.cookie = `bailio-role=${accountRole}; path=/; max-age=2592000; samesite=lax`;
        router.push(accountRole === "locataire" ? "/locataire/dashboard" : "/dashboard");
      }
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : "Une erreur est survenue.";
      setError(message.replace("Firebase: ", "").replace(/\s*\(auth\/[^)]+\)\.?$/, "."));
    } finally { setLoading(false); }
  }

  async function handlePhoneAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const form = new FormData(event.currentTarget); const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, String(form.get("phone") ?? ""), verifier); setPhone(String(form.get("phone") ?? "")); setConfirmation(result);
    } catch { setError("Impossible d’envoyer le code SMS. Vérifiez le numéro et la configuration Firebase."); } finally { setLoading(false); }
  }

  async function confirmCode(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); try { await confirmation?.confirm(String(new FormData(event.currentTarget).get("code") ?? "")); document.cookie = `bailio-role=${role}; path=/; max-age=2592000; samesite=lax`; router.push(role === "locataire" ? "/locataire/dashboard" : "/dashboard"); } catch { setError("Code de vérification incorrect."); } finally { setLoading(false); } }

  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-mark">L</span><span>Bail<span className="brand-accent">io</span></span></Link><section className="auth-card"><div className="auth-card-heading"><span className="auth-symbol">{register ? "✦" : "↗"}</span><p className="eyebrow">BAILIO</p><h1>{confirmation ? "Vérifiez votre numéro" : register ? "Créez votre compte" : "Bon retour parmi nous"}</h1><p>{confirmation ? `Code envoyé au ${phone}` : register ? "Choisissez votre espace pour commencer." : "Connectez-vous pour accéder à votre espace."}</p></div>{confirmation ? <form className="form-stack" onSubmit={confirmCode}><label>Code reçu par SMS<input name="code" inputMode="numeric" placeholder="123456" required /></label><button className="primary-button wide-button" disabled={loading} type="submit">{loading ? "Vérification..." : "Vérifier le code →"}</button></form> : <><form className="form-stack" onSubmit={handleSubmit}><label>Adresse e-mail<input name="email" type="email" placeholder="vous@exemple.com" required /></label>{register && <><label>Nom complet<input name="name" type="text" placeholder="Votre nom et prénom" required /></label><label>Numéro de téléphone<input name="phone" type="tel" placeholder="+229 01 00 00 00 00" required /></label><fieldset className="role-fieldset"><legend>Je m’inscris en tant que</legend><label className="role-option"><input type="radio" name="role" value="proprietaire" defaultChecked onChange={() => setRole("proprietaire")} /><span><strong>Propriétaire</strong><small>Je gère mes biens, mes locataires et mes paiements.</small></span></label><label className="role-option"><input type="radio" name="role" value="locataire" onChange={() => setRole("locataire")} /><span><strong>Locataire</strong><small>Je paie mon loyer et mes factures SONEB/SBEE.</small></span></label></fieldset></>}<label>Mot de passe<input name="password" type="password" placeholder="Au moins 6 caractères" minLength={6} required /></label><button className="primary-button wide-button" disabled={loading} type="submit">{loading ? "Création..." : register ? "Créer mon compte →" : "Se connecter →"}</button></form><div id="recaptcha-container" /><p className="auth-helper">Connexion par téléphone disponible après activation de Phone Auth dans Firebase.</p></>}{error && <p className="form-error">{error}</p>}<div className="auth-separator"><span>ou</span></div><p className="auth-switch">{register ? "Vous avez déjà un compte ? " : "Vous n’avez pas encore de compte ? "}<Link href={register ? "/login" : "/register"}>{register ? "Se connecter" : "Créer un compte"}</Link></p></section><p className="auth-footer">En continuant, vous acceptez nos conditions d’utilisation.</p></main>;
}
