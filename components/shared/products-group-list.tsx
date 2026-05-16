'use client'

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Title } from './title';
import { useCategoryStore } from '@/store/category';
import { ProductsGrid, CatalogProduct } from './products-grid';

interface Props {
    title: string;
    items: CatalogProduct[];
    listClassName?: string;
    categoryId: number;
    className?: string;
}

export const ProductsGroupList: React.FC<Props> = ({
    title,
    items,
    listClassName,
    categoryId,
    className
}) => {
    const setActiveCategoryId = useCategoryStore((state) => state.setActiveId)

    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: false
    });
    
    React.useEffect(() => {
        if (inView) {
            setActiveCategoryId(categoryId)
        }
    }, [inView, title, categoryId, setActiveCategoryId]);

    return (
        <div className={className} id={title} ref={ref}>
            <Title text={title} size="lg" className="font-extrabold mb-5" />

            <ProductsGrid items={items} className={cn(listClassName)} />
        </div>
    );
};
