import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import React from 'react';

interface Props {
    className?: string;
}


export const SortPopup: React.FC<Props> = ({ className }) => {
    const setStyle = {
        "background": "#f7f6f6",
        "boxShadow": "0 2px 4px rgba(0, 0, 0, 0.1)",
    }

    return (
        <div style={setStyle} className={cn('inline-flex items-center gap-1 px-5 h-[52px] rounded-2xl cursor-pointer', 
                className)}>
            <ArrowUpDown size={16}/>
            <b>Сортировка: </b>
            <b className="text-primary">популярное</b>

        </div>
    )
}