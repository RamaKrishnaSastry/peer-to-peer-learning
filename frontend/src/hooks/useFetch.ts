import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export const useFetch = <T,>(
  key: string[],
  url: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get(url);
      return response.data.data;
    },
    enabled: options?.enabled !== false,
  });
};

export const usePost = () => {
  return async <T,>(url: string, data: unknown): Promise<T> => {
    const response = await api.post(url, data);
    return response.data.data;
  };
};

export const usePut = () => {
  return async <T,>(url: string, data: unknown): Promise<T> => {
    const response = await api.put(url, data);
    return response.data.data;
  };
};

export const useDelete = () => {
  return async (url: string): Promise<void> => {
    await api.delete(url);
  };
};
