import { cn } from '@/lib/utils';
import { Container } from './container';
import React from 'react';
import Image from 'next/image';
import { Button } from '../ui';
import { ArrowRight, ShoppingCart, User } from 'lucide-react';
import { SearchInput } from './search-input';
import Link from 'next/link';

interface Props {
    className?: string;
}

export const Header: React.FC<Props> = ({ className }) => {
    return (
        <header className={cn('border border-b', className)}>
            <Container className='flex items-center justify-between py-8 w-full'>
                {/* Левая часть - теперь кликабельная */}
                <Link 
                    href="/" 
                    className='flex items-center gap-4 flex-shrink-0 group cursor-pointer'
                >
                    <Image 
                        src="/logo.jpg" 
                        alt="Logo" 
                        width={35} 
                        height={35} 
                        className='flex-shrink-0 transition-transform duration-200 group-hover:scale-110'
                    />
                    <div className='flex-shrink-0'>
                        <h1 style={{color: "#9ac42c"}} className="text-2xl uppercase font-black whitespace-nowrap transition-colors duration-200 group-hover:text-[#7da324]">
                            Лидер Продукт
                        </h1>
                        <p style={{color: "#EE960A"}} className="text-sm leading-3 whitespace-nowrap transition-colors duration-200 group-hover:text-[#d18209]">
                            быстрая доставка продуктов
                        </p>
                    </div>
                </Link>

                {/* Центральная часть */}
                <div className='mx-10 flex-1'>
                    <SearchInput/>
                </div>

                {/* Правая часть */}
                <div className='flex items-center gap-3 flex-shrink-0'>
                    <Button variant="outline" className='flex items-center gap-1 whitespace-nowrap'>
                        <User size={16}/>
                        Войти
                    </Button>

                    <Button className='group relative flex items-center whitespace-nowrap'>
                        <b>520 Р</b>
                        <span className='h-full w-[1px] bg-white/30 mx-3'/>
                        <div className="flex items-center gap-1 transition duration-300 group-hover:opacity-0">
                            <ShoppingCart size={16} strokeWidth={2}/>
                            <b>3</b>
                        </div>
                        <ArrowRight size={20} className='absolute right-5 transition duration-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'/>
                    </Button>
                </div>
            </Container>
        </header>
    )
}