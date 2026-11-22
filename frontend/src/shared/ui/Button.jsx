const baseClasses = 'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-control border px-4 py-2.5 text-center text-sm leading-snug font-semibold wrap-anywhere disabled:cursor-wait disabled:opacity-60 motion-safe:transition-colors';

const variants = {
  primary: 'border-transparent bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border-line-strong bg-surface text-ink hover:bg-surface-muted',
  danger: 'border-danger/50 bg-surface text-danger hover:bg-danger-soft',
  // The sidebar is walnut in both themes, where the walnut primary button would disappear.
  sidebar: 'border-transparent bg-brass text-sidebar hover:bg-sidebar-ink',
};

export default function Button({ variant = 'primary', type = 'button', className = '', ...props }) {
  return <button type={type} className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />;
}

// A link that leads somewhere but sits among buttons, so it takes the button look.
export function ActionLink({ variant = 'secondary', className = '', ...props }) {
  return <a className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />;
}
