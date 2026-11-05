import { http } from './client.js';

export const requestsApi = {
  list: (params, signal) => http('/requests', { params, signal }),
  create: (registerId, body) => http(`/registers/${registerId}/requests`, { method: 'POST', body }),
  decide: (id, body) => http(`/requests/${id}`, { method: 'PATCH', body }),
};
