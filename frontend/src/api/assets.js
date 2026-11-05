import { http } from './client.js';

export const assetsApi = {
  list: (registerId, params, signal) => http(`/registers/${registerId}/assets`, { params, signal }),
  get: (registerId, id, params, signal) => http(`/registers/${registerId}/assets/${id}`, { params, signal }),
  create: (registerId, body) => http(`/registers/${registerId}/assets`, { method: 'POST', body }),
  update: (registerId, id, body) => http(`/registers/${registerId}/assets/${id}`, { method: 'PATCH', body }),
  archive: (registerId, id) => http(`/registers/${registerId}/assets/${id}`, { method: 'DELETE' }),
};
