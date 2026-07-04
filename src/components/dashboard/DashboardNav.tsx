'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function DashboardNav() {
  const pathname = usePathname()

  const tabs = [
    {
      id: 'summary',
      label: 'Panel de Control',
      href: '/dashboard',
      icon: <LayoutDashboard size={16} />,
      isActive: pathname === '/dashboard'
    },
    {
      id: 'orders',
      label: 'Mis Campañas',
      href: '/dashboard/orders',
      icon: <ShoppingBag size={16} />,
      isActive: pathname === '/dashboard/orders' || pathname.startsWith('/dashboard/orders/')
    },
    {
      id: 'quotes',
      label: 'Mis Cotizaciones',
      href: '/dashboard/quotes',
      icon: <FileText size={16} />,
      isActive: pathname === '/dashboard/quotes'
    }
  ]

  return (
    <div className="w-full mb-8 md:mb-10">
      <nav className="flex border-b border-border/80 gap-6 md:gap-8 w-full relative z-10 overflow-x-auto no-scrollbar pb-px">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "pb-2.5 text-xs font-black uppercase tracking-wider relative transition-all duration-300 whitespace-nowrap flex items-center gap-2 cursor-pointer select-none",
              tab.isActive
                ? "text-primary font-black"
                : "text-muted-foreground hover:text-foreground font-bold"
            )}
          >
            <span className={cn("transition-colors duration-300", tab.isActive ? "text-primary" : "text-muted-foreground")}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>

            {tab.isActive && (
              <motion.div
                layoutId="activeDashboardTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
