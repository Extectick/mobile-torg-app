

import { Api } from "@/services/api-client"
import { Category } from "@prisma/client"
import { useSet } from "react-use"
import React from "react"

interface FilterCheckboxItem {
    text: string
    value: string
}

interface ReturnProps {
    categories: FilterCheckboxItem[],
    loading: boolean
}

export const useFilterCategories = (): ReturnProps => {
    const [categories, setCategories] = React.useState<FilterCheckboxItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [set, { toggle }] = useSet(new Set<string>([]))

    React.useEffect(() => {
        async function fetchCategories() {
            try {
                const categories = await Api.categories.getAll("")
                setCategories(categories.map(category => ({
                    text: category.name,
                    value: category.id.toString()
                }))) // Обновляем состояние
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return { categories, loading } // Возвращаем объект с items
}
