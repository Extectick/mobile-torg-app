'use client'

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Title } from './title';
import { ProductCard } from './product-card';
import { useCategoryStore } from '@/store/category';

interface Props {
    title: string;
    items: any[];
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
        triggerOnce: false // Опционально: срабатывает только один раз
    });
    
    React.useEffect(() => {
        if (inView) {
            setActiveCategoryId(categoryId)
        }
    }, [inView, title, categoryId]);

    return (
        <div className={className} id={title} ref={ref}>
            <Title text={title} size="lg" className="font-extrabold mb-5" />

            <div className={cn('grid grid-cols-3 gap-[50px]', listClassName)}>
                {items.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        imageUrl={product.imageUrl}
                        price={product.items[0].price}                    
                    />
                ))}    
            </div>
        </div>
    );
};