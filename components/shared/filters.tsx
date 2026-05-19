'use client'

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
import { useRouter, useSearchParams } from 'next/navigation';
import { CatalogTreeFilter } from './catalog-tree-filter';
import { CatalogCategoryNode } from './category-folders-view';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';


interface Props {
    className?: string;
    surface?: 'card' | 'plain';
    catalogRoots?: CatalogCategoryNode[];
    activeCategoryId?: number | null;
    activePathIds?: Set<number>;
    allProductsCount?: number;
    isLoading?: boolean;
    onSelectAll?: () => void;
    onSelectCategory?: (categoryId: number) => void;
    showTitle?: boolean;
}

interface PriceProps {
    priceFrom?: number,
    priceTo?: number
}

const PRICE_MIN = 0
const PRICE_MAX = 10000

const readPriceParam = (value: string | null) => {
    if (!value) {
        return undefined
    }

    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : undefined
}

export const Filters: React.FC<Props> = ({
    className,
    surface = 'card',
    catalogRoots = [],
    activeCategoryId = null,
    activePathIds = new Set<number>(),
    allProductsCount = 0,
    isLoading = false,
    onSelectAll,
    onSelectCategory,
    showTitle = true,
}) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const priceFromParam = searchParams.get('priceFrom')
    const priceToParam = searchParams.get('priceTo')
    const [prices, setPrice] = React.useState<PriceProps>(() => ({
        priceFrom: readPriceParam(priceFromParam),
        priceTo: readPriceParam(priceToParam),
    }))

    React.useEffect(() => {
        setPrice({
            priceFrom: readPriceParam(priceFromParam),
            priceTo: readPriceParam(priceToParam),
        })
    }, [priceFromParam, priceToParam])

    const commitPrices = React.useCallback((nextPrices: PriceProps) => {
        const params = new URLSearchParams(searchParams.toString())

        if (nextPrices.priceFrom === undefined || nextPrices.priceFrom <= PRICE_MIN) {
            params.delete('priceFrom')
        } else {
            params.set('priceFrom', String(nextPrices.priceFrom))
        }

        if (nextPrices.priceTo === undefined || nextPrices.priceTo >= PRICE_MAX) {
            params.delete('priceTo')
        } else {
            params.set('priceTo', String(nextPrices.priceTo))
        }

        const query = params.toString()

        if (query !== searchParams.toString()) {
            router.replace(query ? `?${query}` : '/')
        }
    }, [router, searchParams])

    const updatePrice = (name: keyof PriceProps, value: string) => {
        const numberValue = value === '' ? undefined : Number(value)

        setPrice((currentPrices) => ({
            ...currentPrices,
            [name]: Number.isFinite(numberValue) ? numberValue : undefined,
        }))
    }

    const handlePriceInputBlur = () => {
        commitPrices(prices)
    }

    const handlePriceInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
            commitPrices(prices)
        }
    }

    return (
        <div className={cn(
            surface === 'card' && 'rounded-xl border border-black/5 bg-white p-4 shadow-sm',
            surface === 'plain' && 'bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2',
            className,
        )}>
            {showTitle && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                        <FolderOpen className="size-5" />
                    </span>
                    <p className="text-[22px] font-extrabold leading-none">Каталог</p>
                </div>
            )}

            {isLoading ? (
                <CatalogFilterSkeleton />
            ) : onSelectAll && onSelectCategory && (
                <CatalogTreeFilter
                    className="mb-5"
                    roots={catalogRoots}
                    activeCategoryId={activeCategoryId}
                    activePathIds={activePathIds}
                    allProductsCount={allProductsCount}
                    onSelectAll={onSelectAll}
                    onSelectCategory={onSelectCategory}
                />
            )}

            {/* {Верхний чекбокс} */}
            <div className='border-t border-black/5 pt-4 flex flex-col gap-2'>
                <FilterCheckbox text="Доставим завтра" value="2312fsdf13321" className="rounded-md px-1 py-2 hover:bg-black/2.5"/>
                <FilterCheckbox text="Новинки" value="fdsfsd" className="rounded-md px-1 py-2 hover:bg-black/2.5"/>
            </div>

            {/* {Фильтр цен} */}
            <div className='mt-4 border-t border-black/5 pt-4'>
                <p className="font-bold mb-3">Цена от и до:</p>
                <div className="mb-5 grid grid-cols-2 gap-3">
                    <Input 
                        type='number' 
                        placeholder='0' 
                        min={0} 
                        max={10000} 
                        value={prices.priceFrom ?? ''}
                        onChange={(e) => updatePrice('priceFrom', e.target.value)}
                        onBlur={handlePriceInputBlur}
                        onKeyDown={handlePriceInputKeyDown}
                        className="min-w-0"
                    />
                    <Input 
                        type='number' 
                        placeholder='10000' 
                        min={100} 
                        max={10000} 
                        value={prices.priceTo ?? ''}
                        onChange={(e) => updatePrice('priceTo', e.target.value)}
                        onBlur={handlePriceInputBlur}
                        onKeyDown={handlePriceInputKeyDown}
                        className="min-w-0"
                    />
                </div>

                <RangeSlider 
                    min={PRICE_MIN} 
                    max={PRICE_MAX} 
                    step={10} 
                    value={[prices.priceFrom ?? PRICE_MIN, prices.priceTo ?? PRICE_MAX]}
                    onValueChange={([priceFrom, priceTo]) => setPrice({ priceFrom, priceTo})}
                    onValueCommit={([priceFrom, priceTo]) => commitPrices({ priceFrom, priceTo })}
                />
            </div>
        </div>
    )
}

export const CatalogFilterSkeleton = () => (
    <div className="mb-5 flex flex-col gap-2 px-1">
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
)
