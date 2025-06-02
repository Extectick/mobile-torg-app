'use client'

import { cn } from '@/lib/utils';
import { useCategoryStore } from '@/store/category';
import React from 'react';
import { Button } from '../ui';

interface Props {
    className?: string;
}

//const cats = ['Мясо','Молочные продукты','Сыры', 'Бакалея', 'Морепродукты', 'Овощи', 'Полуфабрикаты', 'Ягоды', 'Грибы']
const cats = [
  { "id": 1, "name": "Все" },
  { "id": 2, "name": "Мясо" },
  { "id": 3, "name": "Молочные продукты" },
  { "id": 4, "name": "Сыры" },
  { "id": 5, "name": "Бакалея" },
  { "id": 6, "name": "Морепродукты" },
  { "id": 7, "name": "Овощи" }
]

export const Categories: React.FC<Props> = ({ className}) => {
    const categoryActiveId = useCategoryStore((state) => state.activeId)
    const setStyle = {
        "background": "#f7f6f6",
        "box-shadow": "0 2px 4px rgba(0, 0, 0, 0.05)",
    }

    return (
        <div style={setStyle} className={cn('inline-flex gap-1 bg-yellow-50 p-1 rounded-2xl', className)}> 
            {cats.map(({name, id}, index) => (

                <Button
                    variant="secondary"
                    key={index}
                    className={cn(
                        'flex items-center font-bold h-11 rounded-2xl px-5 cursor-pointer',
                        'transition-all duration-200 ease-in-out',
                        'hover:scale-[1.02] hover:shadow-lg',
                        'active:scale-95',
                        categoryActiveId === id && 'bg-white shadow-md shadow-gray-400 text-primary'
                    )}
                    onClick={() => {
                        const element = document.getElementById(name);
                        if (element) {
                            const offset = 130; // Желаемый отступ сверху (в пикселях)
                            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                            window.scrollTo({
                                top: elementPosition - offset,
                                behavior: 'smooth'
                            });
                        }
                    }}
                >
                    {name}
                </Button>
            ))}
        </div>
    )
}