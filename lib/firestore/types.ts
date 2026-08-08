export type UserRole = "proprietaire" | "locataire";

export type TenantProfile = {
  uid: string;
  proprietaireId: string;
  nom: string;
  telephone: string;
  logementId: string;
  numeroAbonneSoneb?: string;
  numeroCompteurSbee?: string;
  fcmToken?: string;
};

export type SonebInvoice = { id: string; uid: string; montant: number; statut: "a_payer" | "paiement_en_cours" | "payee"; dateEmission: string; datePaiement?: string };
export type SbeeRecharge = { id: string; uid: string; montant: number; statut: "en_cours" | "confirmee" | "echouee"; dateRecharge?: string; token?: string };
export type Technician = { id: string; proprietaireId: string; nom: string; telephone: string; specialite: string };
