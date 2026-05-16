

import { Api } from "@/services/api-client"
import { useSet } from "react-use"
import React from "react"

interface FilterCheckboxItem {
    text: string
    value: string
}

interface ReturnProps {
    categories: FilterCheckboxItem[],
    loading: boolean,
    selectedCategories: Set<string>
    onAddId: (ids: string | string[]) => void
}

export const useFilterCategories = (): ReturnProps => {
    const [categories, setCategories] = React.useState<FilterCheckboxItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedCategories, { toggle, add, remove }] = useSet(new Set<string>([]))

    const handleIds = (ids: string | string[]) => {
        if (Array.isArray(ids)) {
            // For arrays, we need to determine which are new vs existing
            const currentIds = Array.from(selectedCategories);
            const toAdd = ids.filter(id => !currentIds.includes(id));
            const toRemove = currentIds.filter(id => !ids.includes(id));
            
            toAdd.forEach(id => add(id));
            toRemove.forEach(id => remove(id));
        } else {
            // For single strings, maintain original toggle behavior
            toggle(ids);
        }
    };

    React.useEffect(() => {
        async function fetchCategories() {
            try {

                const categories = await Api.categories.getAll()
                setCategories(categories.map(category => ({
                    text: category.name,
                    value: category.id.toString()
                }))) 
                
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])
    return { categories, loading, selectedCategories, onAddId: handleIds }
}
