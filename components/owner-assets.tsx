"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type Asset = { id: string; nom: string; ville?: string; quartier?: string; logementsPrevus?: number };
export function OwnerAssets() { const [assets, setAssets] = useState<Asset[]>([]); const [units, setUnits] = useState(0); useEffect(() => { async function load() { const uid = auth.currentUser?.uid; if (!uid) return; const snapshot = await getDocs(query(collection(db, "biens"), where("proprietaireId", "==", uid))); setAssets(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Asset, "id">) }))); const unitSnapshot = await getDocs(query(collection(db, "logements"), where("proprietaireId", "==", uid))); setUnits(unitSnapshot.size); } void load(); }, []); if (!assets.length) return <section className="empty-owner panel"><span className="empty-icon">⌂</span><h2>Votre tableau de bord est prêt</h2><p>Ajoutez votre premier bien pour voir apparaître vos revenus et logements ici.</p></section>; return <section className="panel asset-summary"><div className="panel-heading"><div><h2>Mes biens</h2><p>{units} logement(s) enregistré(s)</p></div></div><div className="asset-list">{assets.map((asset) => <div className="asset-row" key={asset.id}><span className="asset-icon">⌂</span><div><strong>{asset.nom}</strong><small>{asset.ville} · {asset.quartier}</small></div><b>{asset.logementsPrevus ?? 0} prévus</b></div>)}</div></section>; }
