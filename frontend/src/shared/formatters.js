export const dateTime = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });

// acquiredOn is a date without a time, and new Date() reads it as UTC midnight.
// Formatting in UTC keeps time zones west of UTC from showing the previous day.
export const calendarDate = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeZone: 'UTC' });

export const quantity = new Intl.NumberFormat('bg-BG');

// Bulgarian uses one form for exactly one and another for every other count, including zero.
const counted = (one, other) => count => `${count} ${count === 1 ? one : other}`;
export const assetCount = counted('актив', 'актива');
export const subregisterCount = counted('подрегистър', 'подрегистъра');
export const memberCount = counted('поканен', 'поканени');
export const registerCount = counted('регистър', 'регистъра');
