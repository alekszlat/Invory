import { http } from './client.js';

export const historyApi = {
  list: (registerId, params, signal) => http(`/registers/${registerId}/history`, { params, signal }),
};
