// Fields inherit the label's font through Tailwind's reset, so font-normal stops the typed text from turning bold.
// text-base keeps the text at 16px, below which iPhone Safari zooms in on focus.
const controlClasses = 'min-h-11 min-w-0 rounded-control border border-line-strong bg-surface py-2.5 text-base font-normal text-ink placeholder:text-ink-muted';

export function Field({ label, wide = false, className = '', children }) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-sm font-semibold ${wide ? 'sm:col-span-2' : ''} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input({ leadingIcon = false, className = '', ...props }) {
  return <input className={`${controlClasses} w-full ${leadingIcon ? 'pr-3 pl-10' : 'px-3'} ${className}`} {...props} />;
}

export function Select({ fullWidth = true, className = '', ...props }) {
  return <select className={`${controlClasses} cursor-pointer px-3 ${fullWidth ? 'w-full' : 'w-auto'} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${controlClasses} w-full resize-y px-3 ${className}`} {...props} />;
}
