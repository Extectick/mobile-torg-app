'use client'

import React from 'react';
import qs from 'qs'
import { FolderOpen } from 'lucide-react';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
import { CheckboxCategoryFiltersGroup } from './category-filter-groups';
import { useFilterCategories } from '@/hooks/useFilterCategories';
import { useRouter, useSearchParams } from 'next/navigation';
import { CatalogTreeFilter } from './catalog-tree-filter';
import { CatalogCategoryNode } from './category-folders-view';
import { CatalogProduct } from './products-grid';


interface Props {
    className?: string;
    catalogRoots?: CatalogCategoryNode[];
    activeCategoryId?: number | null;
    activePathIds?: Set<number>;
    allProductsCount?: number;
    getBranchProducts?: (category: CatalogCategoryNode) => CatalogProduct[];
    onSelectAll?: () => void;
    onSelectCategory?: (categoryId: number) => void;
}

interface PriceProps {
    priceFrom?: number,
    priceTo?: number
}

export const Filters: React.FC<Props> = ({
    className,
    catalogRoots = [],
    activeCategoryId = null,
    activePathIds = new Set<number>(),
    allProductsCount = 0,
    getBranchProducts,
    onSelectAll,
    onSelectCategory,
}) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { categories, loading, onAddId, selectedCategories } = useFilterCategories()
    const [prices, setPrice] = React.useState<PriceProps>({})
    const updatePrice = (name: keyof PriceProps, value: number) => {
        setPrice({
            ...prices,
            [name]: value
        })
    }

    
    React.useEffect(() => {
        // Все фильтры
        const filters = {
            ...prices,
            query: searchParams.get('query') || undefined,
            category: searchParams.get('category') || undefined,
            categories: Array.from(selectedCategories)
        }

        const query = qs.stringify(filters, {
            arrayFormat: 'comma'
        })

        const currentQuery = searchParams.toString()

        if (query !== currentQuery) {
            router.replace(query ? `?${query}` : '/')
        }
    }, [prices, selectedCategories, router, searchParams])

    return (
        <div className={`rounded-xl border border-black/5 bg-white p-4 shadow-sm ${className || ''}`}>
            <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <FolderOpen className="size-5" />
                </span>
                <p className="text-[22px] font-extrabold leading-none">Каталог</p>
            </div>

            {getBranchProducts && onSelectAll && onSelectCategory && (
                <CatalogTreeFilter
                    className="mb-5"
                    roots={catalogRoots}
                    activeCategoryId={activeCategoryId}
                    activePathIds={activePathIds}
                    allProductsCount={allProductsCount}
                    getBranchProducts={getBranchProducts}
                    onSelectAll={onSelectAll}
                    onSelectCategory={onSelectCategory}
                />
            )}

            {/* {Верхний чекбокс} */}
            <div className='border-t border-black/5 pt-4 flex flex-col gap-2'>
                <FilterCheckbox text="Доставим завтра" value="2312fsdf13321" className="rounded-md px-1 py-2 hover:bg-black/[0.025]"/>
                <FilterCheckbox text="Новинки" value="fdsfsd" className="rounded-md px-1 py-2 hover:bg-black/[0.025]"/>
            </div>

            {/* {Фильтр цен} */}
            <div className='mt-4 border-t border-black/5 pt-4'>
                <p className="font-bold mb-3">Цена от и до:</p>
                <div className="flex gap-3 mb-5">
                    <Input 
                        type='number' 
                        placeholder='0' 
                        min={0} 
                        max={10000} 
                        value={String(prices.priceFrom)}
                        onChange={(e) => updatePrice('priceFrom', Number(e.target.value))}
                    />
                    <Input 
                        type='number' 
                        placeholder='10000' 
                        min={100} 
                        max={10000} 
                        value={String(prices.priceTo)}
                        onChange={(e) => updatePrice('priceTo', Number(e.target.value))}
                    />
                </div>

                <RangeSlider 
                    min={0} 
                    max={10000} 
                    step={10} 
                    value={[prices.priceFrom || 0, prices.priceTo || 10000]}
                    onValueChange={([priceFrom, priceTo]) => setPrice({ priceFrom, priceTo})}
                />
                
            </div>
            {/* Список всех категорий товаров */}
            <CheckboxCategoryFiltersGroup
                title = 'Тип продукции'
                className = 'mt-5'
                limit = {5}
                defaultItems = {categories.slice(0,6)}
                items = {categories}
                loading = {loading}
                selectedIds={selectedCategories}
                onClickCheckBox={onAddId}
                
            />

        </div>
    )
}
