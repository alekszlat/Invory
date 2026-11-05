import { http } from './client.js';

const scope = (registerId, subregisterId) => `/registers/${registerId}/subregisters/${subregisterId}`;
export const sharingApi = {
  invited: (params, signal) => http('/invited-scopes', { params, signal }),
  invitations: (registerId, subregisterId, params, signal) => http(`${scope(registerId, subregisterId)}/invitations`, { params, signal }),
  invite: (registerId, subregisterId, body) => http(`${scope(registerId, subregisterId)}/invitations`, { method: 'POST', body }),
  revoke: (id) => http(`/invitations/${id}`, { method: 'DELETE' }),
  accept: token => http(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' }),
  members: (registerId, subregisterId, params, signal) => http(`${scope(registerId, subregisterId)}/memberships`, { params, signal }),
  updateMember: (registerId, subregisterId, userId, body) => http(`${scope(registerId, subregisterId)}/memberships/${userId}`, { method: 'PATCH', body }),
  removeMember: (registerId, subregisterId, userId) => http(`${scope(registerId, subregisterId)}/memberships/${userId}`, { method: 'DELETE' }),
};
