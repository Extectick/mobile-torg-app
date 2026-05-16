import Link from 'next/link';
import React from 'react';
import { Title } from './title';
import { Button } from '../ui';
import { Plus } from 'lucide-react';

interface Props {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    description?: string | null;
    className?: string;
}

export const ProductCard: React.FC<React.PropsWithChildren<Props>> = ({ id, name, price, imageUrl, description, className}) => {
    
    return (
        <div className={className}>
            <Link href={`/product/${id}`} className="group block h-full rounded-lg">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.02] group-hover:shadow-md">
                    <img className='h-auto w-full object-contain' src={imageUrl} alt={name} />
                </div>     
                
                <Title text={name} size='sm' className='mb-1 mt-3 line-clamp-2 font-bold'/>

                <p className='line-clamp-2 min-h-10 text-sm text-gray-400'>
                    {description || 'Описание продукции скоро появится'}
                </p>

                <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <span className='text-[20px] leading-none'>
                        от <b>{price} Р</b>    
                    </span>   

                    <Button variant="secondary" className='w-full text-base font-bold sm:w-auto'>
                        <Plus size={20} className='mr-1' />
                        <span>Добавить</span>
                    </Button>
                </div>
            </Link>
        </div>
    )
}
