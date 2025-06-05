import { Category, Product } from "@prisma/client"
import { axiosInstance } from "./instance"
import { AxiosRequestConfig } from "axios";
import axios from "axios"; // Импортируем axios для isCancel
import { ApiPoutes } from "./constants";

interface SearchParams {
  query: string;
  limit?: number;
}

export const getAll = async(  query: string, 
  config?: AxiosRequestConfig & { limit?: number }
): Promise<Category[]> => {
    try {
    const response = await axiosInstance.get<Category[]>(ApiPoutes.CATEGORIES, {
      params: { 
        query,
        limit: config?.limit 
      },
      signal: config?.signal
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) { // Используем axios.isCancel вместо axiosInstance.isCancel
      console.log('Request canceled:', error.message);
      return [];
    }
    console.error('Search error:', error);
    throw error;
  }
}
