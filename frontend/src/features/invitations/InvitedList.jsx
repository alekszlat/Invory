import PageHeader from '../../shared/ui/PageHeader.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { ArrowRight } from 'lucide-react';
import { roleLabels } from '../../shared/labels.js';

export default function InvitedList({ invitations }) {
  return (
    <>
      <PageHeader title="Поканени регистри" description="Тук се показват подрегистрите, до които вашият профил има споделен достъп." />
      {invitations.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {invitations.map(scope => (
            <li key={scope.id} className="min-w-0 rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-5 sm:p-6 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none">
              <p className="text-sm text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{scope.registerName}</p>
              <h2 className="mt-1 text-lg font-semibold wrap-anywhere">{scope.name}</h2>
              <p className="mt-2 text-sm">{roleLabels[scope.role]} · Активи: {scope.assetIds.length}</p>
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#005ac1] dark:text-[#9bcaff] hover:underline" href={`#invited/${scope.registerId}/${scope.id}`}>
                Отвори подрегистъра <ArrowRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : <EmptyState compact>За този профил още няма споделени регистри.</EmptyState>}
    </>
  );
}
