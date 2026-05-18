'use client'

import { cn } from '@/lib/utils';
import { Container } from './container';
import React, { Suspense } from 'react';
import { Button } from '../ui';
import { ArrowRight, ShoppingCart, User } from 'lucide-react';
import { SearchInput } from './search-input';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCartTotals, useCart } from '@/store/cart';

interface Props {
    className?: string;
}

const navItems = [
    { href: '/', label: 'Каталог' },
    { href: '/about', label: 'О компании' },
    { href: '/vacancies', label: 'Вакансии' },
    { href: '/contacts', label: 'Контакты' },
]

interface HeaderNavProps extends React.HTMLAttributes<HTMLElement> {
    compact?: boolean;
}

const HeaderNav: React.FC<HeaderNavProps> = ({ compact = false, className, ...props }) => {
    const pathname = usePathname()

    return (
        <nav className={cn('min-w-0', className)} {...props}>
            <div className={cn(
                'flex gap-2 overflow-x-auto',
                compact ? 'py-1' : 'py-3',
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
    const { totalAmount, totalCount } = React.useMemo(() => getCartTotals(cartItems), [cartItems])
    const cartCountLabel = cartHydrated ? totalCount : 0
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
                    'relative flex w-full flex-wrap items-center justify-between transition-[gap,padding] duration-300 ease-out',
                    isCompact ? 'gap-3 py-2 lg:flex-nowrap' : 'gap-4 py-4 md:flex-nowrap md:py-8',
                )}>
                    {/* Левая часть - теперь кликабельная */}
                    <Link
                        href="/"
                        className={cn(
                            'group flex min-w-0 shrink-0 cursor-pointer items-center transition-[gap] duration-300 ease-out',
                            isCompact ? 'gap-2' : 'gap-3 sm:gap-4',
                        )}
                    >
                        <img
                            src="/logo-lp.svg"
                            alt="Logo"
                            width={50}
                            height={50}
                            className={cn(
                                'shrink-0 transition-transform duration-300 ease-out group-hover:scale-110',
                                isCompact ? 'size-9' : 'size-[50px]',
                            )}
                        />
                        <div className='min-w-0 shrink-0'>
                            <h1
                                style={{color: "#9ac42c"}}
                                className={cn(
                                    'whitespace-nowrap font-black uppercase transition-[font-size,color] duration-300 ease-out group-hover:text-[#7da324]',
                                    isCompact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl',
                                )}
                            >
                                Лидер Продукт
                            </h1>
                            <p
                                style={{color: "#EE960A"}}
                                className={cn(
                                    'overflow-hidden whitespace-nowrap leading-3 transition-[max-height,opacity,font-size,color] duration-300 ease-out group-hover:text-[#d18209]',
                                    isCompact ? 'max-h-0 text-xs opacity-0 xl:max-h-4 xl:opacity-100' : 'max-h-4 text-sm opacity-100',
                                )}
                            >
                                быстрая доставка продуктов
                            </p>
                        </div>
                    </Link>

                    <HeaderNav compact className={cn(
                        'order-4 w-full overflow-hidden transition-[max-height,max-width,opacity] duration-300 ease-out lg:order-0 lg:w-auto lg:flex-none',
                        isCompact ? 'max-h-12 opacity-100 lg:max-w-[430px]' : 'pointer-events-none max-h-0 opacity-0 lg:max-w-0',
                    )} aria-hidden={!isCompact} />

                    {/* Центральная часть */}
                    <div className={cn(
                        'relative z-[60] order-3 w-full flex-none transition-[margin] duration-300 ease-out md:order-0 md:flex-1',
                        isCompact ? 'lg:mx-4' : 'md:mx-10',
                    )}>
                        <Suspense fallback={<div className="h-11 rounded-2xl bg-gray-100" />}>
                            <SearchInput onFocusChange={setSearchFocused}/>
                        </Suspense>
                    </div>

                    {/* Правая часть */}
                    <div className={cn(
                        'ml-auto flex shrink-0 items-center gap-2 transition-[gap] duration-300 ease-out sm:gap-3',
                        isCompact && 'sm:gap-2',
                    )}>
                        <Button variant="outline" className={cn(
                            'flex items-center gap-1 whitespace-nowrap transition-[height,padding] duration-300 ease-out',
                            isCompact && 'h-9 px-3',
                        )}>
                            <User size={16}/>
                            Войти
                        </Button>

                        <Button className={cn(
                            'group relative flex items-center whitespace-nowrap transition-[height,padding] duration-300 ease-out',
                            isCompact && 'h-9 px-3',
                        )}>
                            <b>{cartAmountLabel} ₽</b>
                            <span className='h-full w-px bg-white/30 mx-3'/>
                            <div className="flex items-center gap-1 transition duration-300 group-hover:opacity-0">
                                <ShoppingCart size={16} strokeWidth={2}/>
                                <b>{cartCountLabel}</b>
                            </div>
                            <ArrowRight size={20} className='absolute right-5 transition duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'/>
                        </Button>
                    </div>

                </Container>

                <div
                    className={cn(
                        'relative overflow-hidden border-t bg-white/90 transition-[max-height,opacity,border-color] duration-300 ease-out',
                        isCompact ? 'max-h-0 border-transparent opacity-0' : 'max-h-20 opacity-100',
                        searchFocused && 'border-transparent',
                    )}
                    aria-hidden={isCompact}
                >
                    <Container className="px-4 sm:px-6 lg:px-0">
                        <HeaderNav className={cn(isCompact && 'pointer-events-none')} />
                    </Container>
                </div>
            </header>
            <div aria-hidden style={{ height: headerHeight || undefined }} />
        </>
    )
}
