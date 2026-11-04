import { ArrowRight, Box } from 'lucide-react';

export default function RegisterCard({ register, href }) {
  const count = register.assets.length;

  return (
    <li className="flex min-w-0 flex-col rounded-2xl border border-[#dcdde3] dark:border-[#3b3d46] bg-white dark:bg-[#232429] p-6 shadow-[0_2px_8px_rgb(24_32_48/0.03)] dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#005ac1]/15 dark:border-[#9bcaff]/15 bg-[#e8f0fc] dark:bg-[#233a55] text-[#005ac1] dark:text-[#9bcaff]"><Box size={21} strokeWidth={1.6} aria-hidden="true" /></span>
        <span className="text-xs font-medium text-[#62646c] dark:text-[#b0b2be]">{count} {count === 1 ? 'актив' : 'актива'}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight wrap-anywhere">{register.name}</h3>
      {register.description && <p className="mt-2 text-sm leading-relaxed text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{register.description}</p>}
      <a href={href} aria-label={`Отвори регистър ${register.name}`} className="mt-auto flex min-h-11 items-center justify-between gap-3 pt-6 text-sm font-semibold text-[#005ac1] dark:text-[#9bcaff] hover:underline">
        Отвори регистъра
        <ArrowRight size={17} aria-hidden="true" />
      </a>
    </li>
  );
}
