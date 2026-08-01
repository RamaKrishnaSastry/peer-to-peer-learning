import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../utils/api';

interface PageResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export const usePaginatedList = <T,>(
  key: string[],
  url: string,
  pageSize = 10,
) => {
  const buildUrl = (offset: number) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}limit=${pageSize}&offset=${offset}`;
  };

  return useInfiniteQuery<PageResponse<T>>({
    queryKey: key,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await api.get(buildUrl(pageParam as number));
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
  });
};
