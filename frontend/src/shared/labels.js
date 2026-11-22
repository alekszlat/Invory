export const roleLabels = { owner: 'Администратор', participant: 'Участник', guest: 'Гост' };
export const requestLabels = { present: 'Потвърдена наличност', missing: 'Липсващ актив', location: 'Промяна на местоположение', disposal: 'Предложение за бракуване' };
export const requestStatuses = { pending: 'За преглед', approved: 'Одобрена', rejected: 'Отхвърлена' };

// The API stores asset statuses as these Bulgarian words, so they are both the value and the label.
export const assetStatuses = ['Активен', 'За ремонт', 'Бракуван'];

// Badge tones from shared/ui/Badge.jsx.
export const assetStatusTones = { 'Активен': 'success', 'За ремонт': 'warning', 'Бракуван': 'neutral' };
export const requestStatusTones = { pending: 'warning', approved: 'success', rejected: 'danger' };
