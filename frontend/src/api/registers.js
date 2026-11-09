import { http } from './client.js';

export const registersApi = {
  list: (params, signal) => http('/registers', { params, signal }),
  create: body => http('/registers', { method: 'POST', body }),
  update: (id, body) => http(`/registers/${id}`, { method: 'PATCH', body }),
};
