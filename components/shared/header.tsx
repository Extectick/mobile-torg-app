'use client'

import { cn } from '@/lib/utils'
import { Container } from './container'
import React, { Suspense } from 'react'
import { Button } from '../ui'
import { ShoppingCart, User } from 'lucide-react'
import { SearchInput } from './search-input'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCartTotals, useCart } from '@/store/cart'

interface Props {
    className?: string
}

const navItems = [
    { href: '/', label: 'Каталог' },
    { href: '/about', label: 'О компании' },
    { href: '/vacancies', label: 'Вакансии' },
    { href: '/contacts', label: 'Контакты' },
]

interface HeaderNavProps extends React.HTMLAttributes<HTMLElement> {
    compact?: boolean
}

const HeaderNav: React.FC<HeaderNavProps> = ({ compact = false, className, ...props }) => {
    const pathname = usePathname()

    return (
        <nav className={cn('min-w-0', className)} {...props}>
            <div className={cn(
                'flex gap-2 overflow-x-auto',
                compact ? 'py-1' : 'py-[var(--header-nav-y)]',
            )}>
                {navItems.map((item) => {
                    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'shrink-0 rounded-lg text-sm font-bold transition-all duration-300 ease-out',
                                compact ? 'px-3 py-1.5' : 'px-4 py-2',
                                'hover:bg-secondary hover:text-primary',
                                active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

export const Header: React.FC<Props> = ({ className }) => {
    const [isCompact, setIsCompact] = React.useState(false)
    const [searchFocused, setSearchFocused] = React.useState(false)
    const [headerHeight, setHeaderHeight] = React.useState(0)
    const headerRef = React.useRef<HTMLElement | null>(null)
    const cartItems = useCart((state) => state.items)
    const cartHydrated = useCart((state) => state.hydrated)
    const { totalAmount } = React.useMemo(() => getCartTotals(cartItems), [cartItems])
    const cartAmountLabel = cartHydrated ? totalAmount : 0

    React.useEffect(() => {
        let ticking = false

        const compactEnterOffset = 96
        const compactExitOffset = 24

        const updateCompactState = () => {
            setIsCompact((currentValue) => {
                const scrollY = window.scrollY

                if (currentValue) {
                    return scrollY > compactExitOffset
                }

                return scrollY >= compactEnterOffset
            })
        }

        const handleScroll = () => {
            if (ticking) {
                return
            }

            ticking = true
            requestAnimationFrame(() => {
                updateCompactState()
                ticking = false
            })
        }

        updateCompactState()
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    React.useLayoutEffect(() => {
        const headerElement = headerRef.current

        if (!headerElement) {
            return
        }

        const updateHeaderHeight = () => {
            const nextHeight = Math.ceil(headerElement.getBoundingClientRect().height)

            document.documentElement.style.setProperty('--app-header-height', `${nextHeight}px`)
            setHeaderHeight((currentHeight) => Math.max(currentHeight, nextHeight))
        }

        updateHeaderHeight()

        const resizeObserver = new ResizeObserver(updateHeaderHeight)
        resizeObserver.observe(headerElement)
        window.addEventListener('resize', updateHeaderHeight)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener('resize', updateHeaderHeight)
            document.documentElement.style.removeProperty('--app-header-height')
        }
    }, [])

    return (
        <>
            <header
                ref={headerRef}
                className={cn(
                    'fixed inset-x-0 top-0 z-50 border-b bg-white/95 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out',
                    searchFocused && 'z-[80]',
                    isCompact ? 'shadow-lg shadow-black/5 backdrop-blur' : 'shadow-none',
                    searchFocused && 'border-transparent',
                    className,
                )}
            >
                <Container className={cn(
                    'relative flex w-full flex-wrap items-center justify-between px-4 transition-[gap,padding] duration-300 ease-out sm:px-6 lg:px-6 xl:px-8 2xl:px-10',
                    isCompact ? 'gap-x-2 gap-y-2 py-2 lg:flex-nowrap' : 'gap-x-3 gap-y-3 py-4 sm:gap-x-4 md:flex-nowrap lg:py-[var(--header-main-y)]',
                )}>
                    <Link
                        href="/"
                        className={cn(
                            'group flex min-w-0 flex-1 cursor-pointer items-center transition-[gap] duration-300 ease-out sm:flex-none',
                            isCompact ? 'gap-2' : 'gap-2.5 sm:gap-4',
                        )}
                    >
                        <img
                            src="/logo-lp.svg"
                            alt="Logo"
                            width={50}
                            height={50}
                            className={cn(
                                'shrink-0 transition-transform duration-300 ease-out group-hover:scale-110',
                                isCompact ? 'size-9' : 'size-14 sm:size-[58px]',
                            )}
                        />
                        <div className="min-w-0">
                            <h1
                                style={{ color: '#9ac42c' }}
                                className={cn(
                                    'whitespace-nowrap font-black uppercase leading-none transition-[font-size,color] duration-300 ease-out group-hover:text-[#7da324]',
                                    isCompact
                                        ? 'text-[clamp(0.92rem,3.7vw,1.12rem)] sm:text-lg'
                                        : 'text-[clamp(1.18rem,4.9vw,1.55rem)] sm:text-[1.65rem]',
                                )}
                            >
                                Лидер Продукт
                            </h1>
                            <p
                                style={{ color: '#EE960A' }}
                                className={cn(
                                    'mt-0.5 whitespace-nowrap leading-none transition-[font-size,color] duration-300 ease-out group-hover:text-[#d18209]',
                                    isCompact
                                        ? 'text-[clamp(0.68rem,2.6vw,0.82rem)] xl:text-xs'
                                        : 'text-[clamp(0.84rem,3.45vw,1.05rem)] sm:text-base',
                                )}
                            >
                                быстрая доставка продуктов
                            </p>
                        </div>
                    </Link>

                    <HeaderNav compact className={cn(
                        'order-4 w-full overflow-hidden transition-[max-height,max-width,opacity] duration-300 ease-out lg:order-0 lg:w-auto lg:flex-none',
                        isCompact ? 'pointer-events-none max-h-0 opacity-0 lg:pointer-events-auto lg:max-h-12 lg:max-w-[min(34vw,28rem)] lg:opacity-100 2xl:max-w-[32rem]' : 'pointer-events-none max-h-0 opacity-0 lg:max-w-0',
                    )} aria-hidden={!isCompact} />

                    <div className={cn(
                        'relative z-[60] order-3 hidden w-full flex-none transition-[margin] duration-300 ease-out lg:order-0 lg:block lg:flex-1',
                        isCompact ? 'lg:mx-3 xl:mx-5 2xl:mx-8' : 'md:mx-6 xl:mx-8 2xl:mx-12',
                    )}>
                        <Suspense fallback={<div className={cn('rounded-2xl bg-gray-100', isCompact ? 'h-10 lg:h-11' : 'h-11')} />}>
                            <SearchInput
                                className={cn(isCompact && 'h-10 lg:h-11')}
                                onFocusChange={setSearchFocused}
                            />
                        </Suspense>
                    </div>

                    <div className={cn(
                        'ml-auto flex shrink-0 items-center gap-2 transition-[gap] duration-300 ease-out sm:gap-3',
                        isCompact && 'sm:gap-2',
                    )}>
                        <Button
                            variant="outline"
                            className={cn(
                                'size-10 gap-1.5 p-0 transition-[height,width,padding] duration-300 ease-out min-[360px]:w-auto min-[360px]:px-3 sm:h-11 sm:px-4 lg:h-11',
                                isCompact && 'size-9 min-[360px]:w-auto min-[360px]:px-3 lg:h-11',
                            )}
                            aria-label="Войти"
                        >
                            <User size={16} />
                            <span className="hidden min-[360px]:inline">Войти</span>
                        </Button>

                        <Button className={cn(
                            'hidden h-11 items-center gap-2 whitespace-nowrap px-4 font-extrabold transition-[height,padding] duration-300 ease-out lg:flex',
                            isCompact && 'h-11 px-4',
                        )}>
                            <ShoppingCart className="size-4" />
                            <b>{cartAmountLabel} ₽</b>
                        </Button>
                    </div>
                </Container>

                <div
                    className={cn(
                        'relative overflow-hidden border-t bg-white/90 transition-[max-height,opacity,border-color] duration-300 ease-out',
                        isCompact ? 'max-h-0 border-transparent opacity-0' : 'max-h-16 opacity-100',
                        searchFocused && 'border-transparent',
                    )}
                    aria-hidden={isCompact}
                >
                    <Container className="px-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10">
                        <HeaderNav className={cn(isCompact && 'pointer-events-none')} />
                    </Container>
                </div>
            </header>
            <div aria-hidden style={{ height: headerHeight || undefined }} />
        </>
    )
}
