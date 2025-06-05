'use client'

import React from 'react';
import { FilterCheckbox, FilterCheckboxProps } from './filtercheck-box';
import { Input } from '../ui';
import { Skeleton } from '../ui/skeleton';
import { useFilterCategories } from '@/hooks/useFilterCategories';

type Item = FilterCheckboxProps;

interface Props {
    title: string,
    items: Item[],
    defaultItems: Item[],
    limit: number,
    serchInputPlaceholder?: string,
    onChange?: (values: string[]) => void,
    defaultValue?: string[],
    className?: string,
}

export const CheckboxCategoryFiltersGroup: React.FC<Props> = (
    {
        title,
        items,
        defaultItems,
        limit,
        serchInputPlaceholder = 'Поиск...',
        className,
        onChange,
        defaultValue,
    }
) => {
    const { loading } = useFilterCategories();
    const [showAll, setShowAll] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const [isAnimating, setIsAnimating] = React.useState(false);
    const listRef = React.useRef<HTMLDivElement>(null);
    const [checkedValues, setCheckedValues] = React.useState<string[]>(defaultValue || []);

    const filteredItems = items.filter((item) => 
        item.text.toLowerCase().includes(searchValue.toLocaleLowerCase())
    );
    
    const displayedItems = showAll 
        ? filteredItems 
        : defaultItems.slice(0, limit);

    const onChangeSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    const handleCheckboxChange = (value: string, checked: boolean) => {
        const newValues = checked 
            ? [...checkedValues, value]
            : checkedValues.filter(v => v !== value);
        
        setCheckedValues(newValues);
        onChange?.(newValues);
    };

    const toggleShowAll = () => {
        if (showAll) {
            if (listRef.current) {
                listRef.current.style.maxHeight = `${listRef.current.scrollHeight}px`;
                setTimeout(() => {
                    if (listRef.current) {
                        listRef.current.style.maxHeight = '0px';
                    }
                }, 10);
            }
            setTimeout(() => setShowAll(false), 300);
        } else {
            setShowAll(true);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    React.useEffect(() => {
        if (showAll && listRef.current) {
            listRef.current.style.maxHeight = `${listRef.current.scrollHeight}px`;
            setTimeout(() => {
                if (listRef.current) {
                    listRef.current.style.maxHeight = 'none';
                }
            }, 300);
        }
    }, [showAll, displayedItems]);

    if(loading) {
        return (
            <div className={`${className}`}>
            <p className="font-bold mb-3">{title}</p>

            <div className={className}>

                    {...Array(limit)
                        .fill(0)
                        .map((_, index) => <Skeleton key={index} className='bg-gray-200 h-6 mb-3 rounded-[6px]'/>)
                    }

                    <Skeleton className='w-29 bg-gray-200 h-6 mb-3 rounded-[6px]'/>
            </div>
            </div>
        )
    }

    return (
        <div className={`${className}`}>
            <p className="font-bold mb-3">{title}</p>

            <div className="mb-5">
                    <Input 
                        onChange={onChangeSearchInput} 
                        placeholder={serchInputPlaceholder} 
                        className='bg-gray-50 border-none'
                    />
            </div>

            <div 
                ref={listRef}
                className="flex flex-col gap-2 max-h-96 pr-2 overflow-auto scrollbar"
            >
                {displayedItems.map((item) => (
                    <FilterCheckbox
                        onCheckedChange={(checked) => handleCheckboxChange(item.value, checked)}
                        checked={checkedValues.includes(item.value)}
                        key={String(item.value)}
                        value={item.value}
                        text={item.text}
                        endAdornment={item.endAdornment}
                        // className={`hover:bg-secondary/20 px-3 py-2 rounded-md transition-colors border border-transparent hover:border-border ${item.className || ''}`}
                    />
                ))}

                {items.length > limit &&(
                <div className={showAll ? 'border-t border-t-neutral-100' : ''}>
                    <button onClick={() => setShowAll(!showAll)} className='text-primary mt-3'>
                        {showAll ? '- Скрыть' : '+ Показать все'}
                    </button>
                </div>
                )}
            </div>
        </div>
    );
};
