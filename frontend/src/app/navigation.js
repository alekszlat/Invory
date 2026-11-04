import { ClipboardList, FolderTree, History, Inbox, LayoutGrid } from 'lucide-react';

//This is how you write comments in Javascript. You can use them to explain your code, leave notes for yourself or others, or temporarily disable code during development.
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

export function readRoute() {
  const [section, registerId, subregisterId] = window.location.hash.slice(1).split('/');
  return { section: navigation.some(page => page.id === section) ? section : 'register', registerId, subregisterId };
}
