import { QueryClient, useQuery } from '@tanstack/react-query';

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 }, mutations: { retry: false } } });

export function useApiQuery(userId, resource, params, queryFn, enabled = true) {
  return useQuery({ queryKey: ['user', userId, resource, params], queryFn: ({ signal }) => queryFn(signal), enabled: Boolean(userId) && enabled });
}

export async function clearPrivateCache() {
  await queryClient.cancelQueries();
  queryClient.clear();
}
