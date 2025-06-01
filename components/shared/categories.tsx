import { cn } from '@/lib/utils';
import React from 'react';

interface Props {
    className?: string;
}

//const cats = ['Мясо','Молочные продукты','Сыры', 'Бакалея', 'Морепродукты', 'Овощи', 'Полуфабрикаты', 'Ягоды', 'Грибы']
const cats = ['Все','Мясо','Молочные продукты','Сыры', 'Бакалея', 'Морепродукты', 'Овощи']
const activeIndex = 0;

export const Categories: React.FC<Props> = ({ className}) => {
    const setStyle = {
        "background": "#f7f6f6",
        "box-shadow": "0 2px 4px rgba(0, 0, 0, 0.05)",
    }
    
    return (
        <div style={setStyle} className={cn('inline-flex gap-1 bg-yellow-50 p-1 rounded-2xl', className)}> 
            {cats.map((cat, index) => (
                <a className={cn(
                    'flex items-center font-bold h-11 rounded-2xl px-5',
                    activeIndex === index && 'bg-white shadow-md shadow-gray-300 text-primary'
                )}
                key={index}>
                    <button>
                        {cat}
                    </button>
                </a>
            ))}
        </div>
    )
}