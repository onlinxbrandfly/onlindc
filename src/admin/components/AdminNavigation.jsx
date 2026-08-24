import React, { useState } from "react";
import { BarChart3, BookOpen, Building2, ClipboardList, FileText, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";

const primary = [
  { id: "overview", label: "Home", desktopLabel: "Dashboard", icon: LayoutDashboard },
  { id: "crm", label: "Leads", desktopLabel: "Leads & CRM", icon: Users },
  { id: "submissions", label: "Reports", desktopLabel: "Submissions", icon: FileText }
];

const secondary = [
  { id: "team", label: "Sales Team", icon: Users },
  { id: "builder", label: "Form Builder", icon: ClipboardList },
  { id: "knowledge", label: "Knowledge Centre", icon: BookOpen },
  { id: "industries", label: "Industries", icon: Building2 }
];

export const ADMIN_TITLES = {
  overview: "Home", crm: "Leads", submissions: "Reports",
  team: "Sales Team", builder: "Form Builder", knowledge: "Knowledge Centre", industries: "Industries"
};

function NavButton({ item, active, onClick, mobile }) {
  const Icon = item.icon;
  return <button className={`${active ? "active" : ""} ${mobile ? "mobileNavButton" : ""}`} onClick={onClick} type="button">
    <Icon size={mobile ? 21 : 19} strokeWidth={2.2} />
    <span>{mobile ? item.label : item.desktopLabel || item.label}</span>
  </button>;
}

export default function AdminNavigation({ tab, onTabChange, onLogout, currentAgent }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const canManage = ["admin", "manager"].includes(currentAgent?.role);
  const visiblePrimary = canManage ? primary : primary.filter((item) => ["overview", "crm"].includes(item.id));
  const visibleSecondary = canManage ? secondary : [];
  const isMoreActive = visibleSecondary.some((item) => item.id === tab);
  function select(id) { onTabChange(id); setMoreOpen(false); }

  return <>
    <aside className="adminSidebar">
      <div className="adminBrand"><span>O</span><div><b>Onlin.in</b><small>Sales workspace</small></div></div>
      <nav>
        <small>Workspace</small>
        {visiblePrimary.map((item) => <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => select(item.id)} />)}
        <small>Manage</small>
        {visibleSecondary.map((item) => <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => select(item.id)} />)}
      </nav>
      <button className="adminLogout" type="button" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
    </aside>

    <header className="adminMobileHeader">
      <div className="adminBrand"><span>O</span><div><b>{ADMIN_TITLES[tab]}</b><small>Onlin.in</small></div></div>
      <button type="button" aria-label="Open menu" onClick={() => setMoreOpen(true)}><Menu size={24} /></button>
    </header>

    <nav className="adminBottomNav" aria-label="Admin navigation">
      {visiblePrimary.map((item) => <NavButton mobile key={item.id} item={item} active={tab === item.id} onClick={() => select(item.id)} />)}
      {canManage && <button className={`mobileNavButton ${isMoreActive ? "active" : ""}`} type="button" onClick={() => setMoreOpen(true)}><Menu size={21} /><span>More</span></button>}
    </nav>

    {moreOpen && <div className="appSheetBackdrop" onClick={() => setMoreOpen(false)}>
      <section className="appSheet adminMoreSheet" onClick={(event) => event.stopPropagation()}>
        <div className="appSheetHandle" />
        <header><div><h2>More</h2><p>Manage your diagnostic content</p></div><button type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)}><X size={22} /></button></header>
        <div className="moreMenuGrid">
          {visibleSecondary.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => select(item.id)}><span><Icon size={22} /></span><b>{item.label}</b></button>; })}
          <button type="button" onClick={onLogout}><span><LogOut size={22} /></span><b>Logout</b></button>
        </div>
      </section>
    </div>}
  </>;
}
