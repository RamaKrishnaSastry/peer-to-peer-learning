import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export const useFetch = <T,>(
  key: string[],
  url: string | undefined,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      if (!url) throw new Error('No URL provided');
      const response = await api.get(url);
      return response.data.data;
    },
    enabled: options?.enabled !== false && !!url,
    refetchInterval: options?.refetchInterval,
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
