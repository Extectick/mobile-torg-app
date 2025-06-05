'use client'

import React from 'react';
import { Title } from './title';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
import { CheckboxCategoryFiltersGroup } from './category-filter-groups';
import { useFilterCategories } from '@/hooks/useFilterCategories';

interface Props {
    className?: string;
}


export const Filters: React.FC<Props> = ({ className }) => {
    const { categories } = useFilterCategories()
    return (
        <div className={className}>
            <Title text='Фильрация' size='sm' className='mb-5 font-bold'/>

            {/* {Верхний чекбокс} */}
            <div className='flex flex-col gap-4'>
                <FilterCheckbox text="Доставим завтра" value="1"/>
                <FilterCheckbox text="Новинки" value="2"/>
            </div>

            {/* {Фильтр цен} */}
            <div className='mt-5 border-y-neutral-100 py-6 pb-7'>
                <p className="font-bold mb-3">Цена от и до:</p>
                <div className="flex gap-3 mb-5">
                    <Input type='number' placeholder='0' min={0} max={90000} defaultValue={0}/>
                    <Input type='number' placeholder='90000' min={100} max={90000} defaultValue={0}/>
                </div>

                <RangeSlider min={10} max={1000} step={1}></RangeSlider>
            </div>
            {/* Список всех категорий товаров */}
            <CheckboxCategoryFiltersGroup
                title = 'Тип продукции'
                className = 'mt-5'
                limit = {5}
                defaultItems = {categories.slice(0,6)}
                items = {categories} 
            />

        </div>
    )
}