'use client'
// src/components/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/contratos', icon: '📄', label: 'Contratos', badge: '312' },
  { href: '/alertas', icon: '🔔', label: 'Alertas', badge: '7', badgeRed: true },
]

const navAreas = [
  { href: '/contratos?area=comercial&sub=lojas', icon: '🏬', label: 'Lojas', badge: '102' },
  { href: '/contratos?area=comercial&sub=quiosques', icon: '🛒', label: 'Quiosques', badge: '46' },
  { href: '/contratos?area=comercial&sub=antenas', icon: '📡', label: 'Antenas', badge: '12' },
  { href: '/contratos?area=comercial&sub=eventos', icon: '🎪', label: 'Eventos', badge: '14' },
]

const navCompras = [
  { href: '/contratos?area=compras_servicos&sub=operacoes', icon: '⚙️', label: 'Operações', badge: '38' },
  { href: '/contratos?area=compras_servicos&sub=tecnologia', icon: '💻', label: 'Tecnologia', badge: '22' },
  { href: '/contratos?area=compras_servicos&sub=marketing', icon: '📣', label: 'Marketing', badge: '19' },
  { href: '/contratos?area=compras_servicos&sub=engenharia', icon: '🏗️', label: 'Engenharia', badge: '18' },
  { href: '/contratos?area=compras_servicos&sub=rh', icon: '👥', label: 'RH', badge: '12' },
]

export default function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function NavItem({ href, icon, label, badge, badgeRed }: any) {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href.split('?')[0]) && !href.includes('?'))
    return (
      <Link href={href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all relative ${active ? 'bg-white/15 text-white font-medium' : 'text-blue-200 hover:bg-white/8 hover:text-white'}`}>
        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#C8923A] rounded-full" />}
        <span className="text-base">{icon}</span>
        <span className="flex-1">{label}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeRed ? 'bg-red-500/80 text-white' : 'bg-white/15 text-blue-100'}`}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  function NavSection({ label, items }: { label: string, items: any[] }) {
    return (
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest px-3 mb-1">{label}</p>
        {items.map(item => <NavItem key={item.href} {...item} />)}
      </div>
    )
  }

  return (
    <aside className="w-56 bg-[#1B3A5C] flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#C8923A] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[#1B3A5C] font-black text-sm">CH</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">ContractHub</p>
            <p className="text-blue-300 text-[10px] mt-0.5">Shopping Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-3">
        <NavSection label="Visão Geral" items={navItems} />
        <hr className="border-white/10 mx-2" />
        <NavSection label="Portfólio Comercial" items={navAreas} />
        <hr className="border-white/10 mx-2" />
        <NavSection label="Compras & Serviços" items={navCompras} />
        <hr className="border-white/10 mx-2" />
        <div>
          <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest px-3 mb-1">Ferramentas</p>
          <NavItem href="/contratos/novo" icon="⬆️" label="Importar Contrato" />
          <NavItem href="/relatorios" icon="📊" label="Relatórios" />
        </div>
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/8 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-[#C8923A] flex items-center justify-center flex-shrink-0">
            <span className="text-[#1B3A5C] font-bold text-xs">
              {userEmail?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userEmail ?? 'Usuário'}</p>
            <p className="text-blue-400 text-[10px]">Administrador</p>
          </div>
          <button onClick={handleLogout} className="text-blue-400 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Sair">
            ↗
          </button>
        </div>
      </div>
    </aside>
  )
}
