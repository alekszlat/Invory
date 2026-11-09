import { http } from './client.js';

export const subregistersApi = {
  create: (registerId, body) => http(`/registers/${registerId}/subregisters`, { method: 'POST', body }),
  update: (registerId, id, body) => http(`/registers/${registerId}/subregisters/${id}`, { method: 'PATCH', body }),
};
