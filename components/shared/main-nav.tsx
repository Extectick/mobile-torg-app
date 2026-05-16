'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { cn } from '@/lib/utils'
import { Container } from './container'

const navItems = [
  { href: '/', label: 'Каталог' },
  { href: '/about', label: 'О компании' },
  { href: '/vacancies', label: 'Вакансии' },
  { href: '/contacts', label: 'Контакты' },
]

export const MainNav: React.FC = () => {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white/90 backdrop-blur">
      <Container className="px-4 sm:px-6 lg:px-0">
        <div className="flex gap-2 overflow-x-auto py-3">
          {navItems.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition',
                  'hover:bg-secondary hover:text-primary',
                  active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </Container>
    </nav>
  )
}
