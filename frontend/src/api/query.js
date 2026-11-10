import { QueryClient, useQuery } from '@tanstack/react-query';

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 }, mutations: { retry: false } } });

// Every key starts with ['user', userId]. Cached data from one account can then never be shown to another,
// and App.jsx can mark all of one user's data as out of date with a single invalidateQueries call.
export function useApiQuery(userId, resource, params, queryFn, enabled = true) {
  return useQuery({ queryKey: ['user', userId, resource, params], queryFn: ({ signal }) => queryFn(signal), enabled: Boolean(userId) && enabled });
}

export async function clearPrivateCache() {
  // Cancel first, because a request that is still running would write the previous user's data back after clear().
  await queryClient.cancelQueries();
  queryClient.clear();
}
