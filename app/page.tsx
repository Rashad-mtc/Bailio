import Link from "next/link";

const stats = [
  { label: "Revenus ce mois", value: "1 245 000 FCFA", detail: "+8,4% vs mois dernier", tone: "green" },
  { label: "Paiements reçus", value: "18 / 24", detail: "75% encaissé", tone: "purple" },
  { label: "En attente", value: "6 locataires", detail: "À relancer cette semaine", tone: "orange" },
];

const payments = [
  { name: "Aïcha Kone", room: "Appartement A-03", amount: "185 000 FCFA", date: "Aujourd’hui", status: "Payé" },
  { name: "Moussa Traore", room: "Studio B-12", amount: "120 000 FCFA", date: "Hier", status: "Payé" },
  { name: "Fatou Diallo", room: "Appartement A-08", amount: "210 000 FCFA", date: "En attente", status: "En attente" },
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">L</span><span>Loyer<span className="brand-accent">Facile</span></span></div>
        <p className="menu-label">MENU PRINCIPAL</p>
        <nav className="nav-list">
          <Link className="nav-item active" href="/"><span>▦</span> Tableau de bord</Link>
          <Link className="nav-item" href="/biens"><span>⌂</span> Mes biens</Link>
          <Link className="nav-item" href="/locataires"><span>♙</span> Locataires</Link>
          <Link className="nav-item" href="/paiements"><span>₣</span> Paiements</Link>
        </nav>
        <p className="menu-label">OUTILS</p>
        <nav className="nav-list">
          <Link className="nav-item" href="/signaler"><span>⚑</span> Incidents</Link>
          <Link className="nav-item" href="/parametres"><span>⚙</span> Paramètres</Link>
        </nav>
        <div className="sidebar-help"><strong>Besoin d’aide ?</strong><span>Notre équipe est disponible.</span><a href="mailto:aide@loyerfacile.app">Contacter le support →</a></div>
        <div className="profile"><div className="avatar">KM</div><div><strong>Kouassi Marcel</strong><span>Propriétaire</span></div><span className="dots">•••</span></div>
      </aside>
      <section className="content">
        <header className="topbar"><div><p className="eyebrow">SAMEDI 08 AOÛT 2026</p><h1>Bonjour, Marcel <span>👋</span></h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♢<i /></button><button className="primary-button" type="button">+ Ajouter un bien</button></div></header>
        <div className="welcome-banner"><div><p className="banner-kicker">VOTRE GESTION LOCATIVE</p><h2>Tout est sous contrôle.</h2><p>Suivez vos loyers et vos locataires en un coup d’œil.</p></div><div className="banner-art">⌂</div></div>
        <div className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><div className={`stat-icon ${stat.tone}`}>◈</div><p>{stat.label}</p><strong>{stat.value}</strong><span className={stat.tone === "green" ? "positive" : "muted"}>{stat.detail}</span></article>)}</div>
        <div className="section-heading"><div><h2>Activité récente</h2><p>Les derniers mouvements sur votre compte</p></div><Link href="/paiements">Voir tout →</Link></div>
        <div className="table-card"><div className="table-head"><span>LOCATAIRE</span><span>LOGEMENT</span><span>MONTANT</span><span>DATE</span><span>STATUT</span></div>{payments.map((payment) => <div className="payment-row" key={payment.name}><div className="tenant"><div className="small-avatar">{payment.name.split(" ").map((part) => part[0]).join("")}</div><strong>{payment.name}</strong></div><span>{payment.room}</span><strong>{payment.amount}</strong><span>{payment.date}</span><span className={payment.status === "Payé" ? "status paid" : "status pending"}>{payment.status}</span></div>)}</div>
      </section>
    </main>
  );
}
