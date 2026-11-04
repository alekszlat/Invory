import { profiles } from '../registryStore.js';

export const dateTime = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
export const profileName = id => profiles.find(profile => profile.id === id)?.name ?? 'Профил';
