import { ClipboardList, FolderTree, History, Inbox, LayoutGrid } from 'lucide-react';

export const navigation = [
  { id: 'register', label: 'Работни регистри', icon: LayoutGrid },
  { id: 'subregisters', label: 'Подрегистри', icon: FolderTree },
  { id: 'invited', label: 'Поканени регистри', icon: Inbox },
  { id: 'requests', label: 'Заявки', icon: ClipboardList },
  { id: 'history', label: 'История', icon: History },
];
export const registerHref = id => `#register/${id}`;

export function navigateTo(hash) {
  window.location.hash = hash;
}

// The hash has the form #section/registerId/subregisterId. For #accept/<token>, the second part is the invitation token.
// An unknown section opens the register list, which is also the page for an empty hash.
export function readRoute() {
  const [section, registerId, subregisterId] = window.location.hash.slice(1).split('/');
  return { section: section === 'accept' || navigation.some(page => page.id === section) ? section : 'register', registerId, subregisterId };
}
