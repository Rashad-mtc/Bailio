import Link from "next/link";

type PortalShellProps = { children: React.ReactNode; role?: "proprietaire" | "locataire" };

export function PortalShell({ children, role = "proprietaire" }: PortalShellProps) {
  const ownerLinks = [["▦", "Tableau de bord", "/dashboard"], ["⌂", "Mes biens", "/biens"], ["♙", "Locataires", "/locataires"], ["₣", "Paiements", "/paiements"], ["⚑", "Incidents", "/incidents"]];
  const tenantLinks = [["▣", "Mon loyer", "/mon-loyer"], ["◉", "Facture SONEB", "/services/soneb"], ["⚡", "Recharge SBEE", "/services/sbee"], ["♧", "Technicien", "/technicien"], ["◷", "Historique", "/paiements"]];
  const links = role === "locataire" ? tenantLinks : ownerLinks;

  return <main className="shell"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">L</span><span>Loyer<span className="brand-accent">Facile</span></span></Link><p className="menu-label">{role === "locataire" ? "MON ESPACE" : "MENU PRINCIPAL"}</p><nav className="nav-list">{links.map(([icon, label, href]) => <Link className="nav-item" href={href} key={href}><span>{icon}</span>{label}</Link>)}</nav><p className="menu-label">OUTILS</p><nav className="nav-list"><Link className="nav-item" href="/notifications"><span>♢</span> Notifications</Link><Link className="nav-item" href="/parametres"><span>⚙</span> Paramètres</Link></nav><div className="sidebar-help"><strong>Besoin d’aide ?</strong><span>Notre équipe est disponible.</span><a href="mailto:aide@loyerfacile.app">Contacter le support →</a></div><div className="profile"><div className="avatar">{role === "locataire" ? "AD" : "KM"}</div><div><strong>{role === "locataire" ? "Aïcha Diallo" : "Kouassi Marcel"}</strong><span>{role === "locataire" ? "Locataire" : "Propriétaire"}</span></div><span className="dots">•••</span></div></aside><section className="content">{children}</section></main>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</header>;
}
