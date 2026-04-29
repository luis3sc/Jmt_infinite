'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function DashboardNav() {
  const pathname = usePathname()

  const tabs = [
    {
      id: 'summary',
      label: 'Panel de Control',
      href: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      isActive: pathname === '/dashboard'
    },
    {
      id: 'orders',
      label: 'Mis Pedidos',
      href: '/dashboard/orders',
      icon: <ShoppingBag size={18} />,
      isActive: pathname === '/dashboard/orders'
    }
  ]

  return (
    <div className="flex justify-center md:justify-start mb-8 md:mb-10">
      <nav className="flex items-center gap-1 p-1 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 overflow-hidden group whitespace-nowrap",
              tab.isActive 
                ? "text-white" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
          {tab.isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary shadow-lg shadow-primary/20"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          
          <span className={cn("relative z-10 transition-transform duration-300", tab.isActive ? "scale-110" : "group-hover:scale-110")}>
            {tab.icon}
          </span>
          <span className="relative z-10">{tab.label}</span>
          
          {!tab.isActive && (
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </Link>
      ))}
      </nav>
    </div>
  )
}
