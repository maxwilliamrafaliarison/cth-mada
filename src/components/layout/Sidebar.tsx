'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Users, Package, ClipboardList, Pill,
  ArrowLeftRight, ScanBarcode, FileText, Bell, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { nom: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { nom: 'Patients', href: '/dashboard/patients', icon: Users },
  { nom: 'Stock', href: '/dashboard/stock', icon: Package },
  { nom: 'Prescriptions', href: '/dashboard/prescriptions', icon: ClipboardList },
  { nom: 'Dispensation', href: '/dashboard/dispensation', icon: Pill },
  { nom: 'Transferts', href: '/dashboard/transferts', icon: ArrowLeftRight },
  { nom: 'Scanner', href: '/dashboard/scanner', icon: ScanBarcode },
  { nom: 'Rapports', href: '/dashboard/rapports', icon: FileText },
  { nom: 'Alertes', href: '/dashboard/alertes', icon: Bell },
  { nom: 'Administration', href: '/dashboard/admin', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`glass-sidebar fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
          <Image src="/images/logo-cth.png" alt="Logo CTH Madagascar" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-base leading-tight">CTH Mada</h1>
            <p className="text-blue-200/70 text-[0.65rem] leading-tight">Centre de Traitement de l&apos;Hémophilie</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                      : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                  }`}
                  title={collapsed ? item.nom : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-red-400 rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-300' : 'group-hover:text-blue-200'}`} />
                  {!collapsed && <span>{item.nom}</span>}
                  {item.nom === 'Alertes' && !collapsed && (
                    <span className="ml-auto bg-red-500 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center pulse-alert">
                      4
                    </span>
                  )}
                  {item.nom === 'Alertes' && collapsed && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center pulse-alert">
                      4
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 border-t border-white/10 text-blue-200/50 hover:text-white hover:bg-white/5 transition-colors"
        aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
