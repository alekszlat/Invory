export default function PageHeader({ title, description, kicker, children }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {kicker && <p className="mb-2 text-xs leading-relaxed font-semibold tracking-wide text-[#005ac1] dark:text-[#9bcaff]">{kicker}</p>}
        <h1 className="text-3xl leading-tight font-semibold tracking-tight wrap-anywhere sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#62646c] dark:text-[#b0b2be] wrap-anywhere">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
