'use client'

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
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
