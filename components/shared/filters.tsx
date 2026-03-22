'use client'

import React from 'react';
import qs from 'qs'
import { Title } from './title';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
import { CheckboxCategoryFiltersGroup } from './category-filter-groups';
import { useFilterCategories } from '@/hooks/useFilterCategories';
import { useRouter } from 'next/navigation';


interface Props {
    className?: string;
}

interface PriceProps {
    priceFrom?: number,
    priceTo?: number
}

export const Filters: React.FC<Props> = ({ className }) => {
    const router = useRouter()
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
            categories: Array.from(selectedCategories)
        }

        const query = qs.stringify(filters, {
            arrayFormat: 'comma'
        })
        
        router.push(`?${query}`)
    }, [prices, selectedCategories, router])

    return (
        <div className={className}>
            <Title text='Фильрация' size='sm' className='mb-5 font-bold'/>

            {/* {Верхний чекбокс} */}
            <div className='flex flex-col gap-4'>
                <FilterCheckbox text="Доставим завтра" value="2312fsdf13321"/>
                <FilterCheckbox text="Новинки" value="fdsfsd"/>
            </div>

            {/* {Фильтр цен} */}
            <div className='mt-5 border-y-neutral-100 py-6 pb-7'>
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
                //loading = {loading}
                selectedIds={selectedCategories}
                onClickCheckBox={onAddId}
                
            />

        </div>
    )
}