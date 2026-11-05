import { http } from './client.js';

export const subregistersApi = {
  list: (registerId, params, signal) => http(`/registers/${registerId}/subregisters`, { params, signal }),
  get: (registerId, id, signal) => http(`/registers/${registerId}/subregisters/${id}`, { signal }),
  create: (registerId, body) => http(`/registers/${registerId}/subregisters`, { method: 'POST', body }),
  update: (registerId, id, body) => http(`/registers/${registerId}/subregisters/${id}`, { method: 'PATCH', body }),
};
