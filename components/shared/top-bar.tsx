import { cn } from '@/lib/utils';
import React from 'react';
import { Container } from './container';
import { Categories } from './categories';
import { SortPopup } from './sort-popup';

interface Props {
    className?: string;
    categories: Array<{
        id: number;
        name: string;
    }>;
}


export const TopBar: React.FC<Props> = ({ className, categories }) => {
    
    return (
        <div className={cn('sticky top-0 bg-gray-50 py-5 shadow-lg shadow-black/5 z-10', className)}>
            <Container className='flex flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-6 xl:px-8 2xl:px-10'>
                <Categories items={categories} className="max-w-full overflow-x-auto" />
                <SortPopup/>
            </Container>
        </div>
    )
}
