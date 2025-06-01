import { cn } from '@/lib/utils';
import React from 'react';
import { Container } from './container';
import { Categories } from './categories';
import { SortPopup } from './sort-popup';
import { Title } from './title';
import { FilterCheckbox } from './filtercheck-box';

interface Props {
    className?: string;
}


export const Filters: React.FC<Props> = ({ className }) => {
    
    return (
        <div className={className}>
            <Title text='Фильрация' size='sm' className='mb-5 font-bold'/>

            <div className='flex flex-col gap-4'>
                <FilterCheckbox text="Можно собирать" value="1"/>
                <FilterCheckbox text="Новинки" value="2"/>
            </div>


        </div>
    )
}