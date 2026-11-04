const baseClasses = 'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-center text-sm leading-snug font-semibold wrap-anywhere disabled:cursor-wait disabled:opacity-60 motion-safe:transition-[background-color,border-color] motion-safe:duration-140 motion-safe:ease-[ease]';

const variants = {
  primary: 'border-transparent bg-[#005ac1] text-white hover:bg-[#004b9f] dark:bg-[#9bcaff] dark:text-[#232429] dark:hover:bg-[#b8daff]',
  secondary: 'border-[#858792] bg-white text-[#1d1d1f] hover:bg-[#f0f1f4] dark:border-[#777a88] dark:bg-[#232429] dark:text-[#f1f1f4] dark:hover:bg-[#2b2d33]',
};

export default function Button({ variant = 'primary', type = 'button', className = '', ...props }) {
  return <button type={type} className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />;
}

export function ActionLink({ variant = 'secondary', className = '', ...props }) {
  return <a className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />;
}
