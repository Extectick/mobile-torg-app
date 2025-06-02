import { cn } from '@/lib/utils';
import React from 'react';
import { Container } from './container';
import { Categories } from './categories';
import { SortPopup } from './sort-popup';
import { Title } from './title';
import { FilterCheckbox } from './filtercheck-box';
import { Input } from '../ui';
import { RangeSlider } from './range-slider';
import { CheckboxFiltersGroup } from './checkbox-filter-groups';

interface Props {
    className?: string;
}


export const Filters: React.FC<Props> = ({ className }) => {
    
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
            
            <CheckboxFiltersGroup
                title='Тип продукции'
                className='mt-5'
                limit={6}
                defaultItems={[
                    {
                        text: 'Молоко',
                        value: '1'
                    },
                    {
                        text: 'Сыр',
                        value: '2'
                    },
                    {
                        text: 'Горошек',
                        value: '3'
                    },
                    {
                        text: 'Семга',
                        value: '4'
                    },
                    {
                        text: 'Бекон',
                        value: '5'
                    },
                    {
                        text: 'Картофель',
                        value: '6'
                    },
                                        {
                        text: 'Угорь',
                        value: '7'
                    },
                                        {
                        text: 'Бекон',
                        value: '8'
                    },
                    {
                        text: 'Картофель',
                        value: '9'
                    },
                                        {
                        text: 'Угорь',
                        value: '10'
                    },
                                        {
                        text: 'Бекон',
                        value: '11'
                    },
                    {
                        text: 'Картофель',
                        value: '12'
                    },
                                        {
                        text: 'Угорь',
                        value: '13'
                    },
                ]}
                items={[
                    {
                        text: 'Молоко',
                        value: '1'
                    },
                    {
                        text: 'Сыр',
                        value: '2'
                    },
                    {
                        text: 'Горошек',
                        value: '3'
                    },
                    {
                        text: 'Семга',
                        value: '4'
                    },
                    {
                        text: 'Бекон',
                        value: '5'
                    },
                    {
                        text: 'Картофель',
                        value: '6'
                    },
                                        {
                        text: 'Угорь',
                        value: '7'
                    },
                                        {
                        text: 'Бекон',
                        value: '8'
                    },
                    {
                        text: 'Картофель',
                        value: '9'
                    },
                                        {
                        text: 'Угорь',
                        value: '10'
                    },
                                        {
                        text: 'Бекон',
                        value: '11'
                    },
                    {
                        text: 'Картофель',
                        value: '12'
                    },
                                        {
                        text: 'Угорь',
                        value: '13'
                    },
                ]} 
            />

        </div>
    )
}