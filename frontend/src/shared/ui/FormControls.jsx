const controlClasses = 'min-h-11 min-w-0 rounded-xl border border-[#858792] bg-white py-2.5 text-base text-[#1d1d1f] placeholder:text-[#62646c] dark:border-[#777a88] dark:bg-[#232429] dark:text-[#f1f1f4] dark:placeholder:text-[#b0b2be]';

export function Input({ leadingIcon = false, className = '', ...props }) {
  return <input className={`${controlClasses} w-full ${leadingIcon ? 'pl-10 pr-3' : 'px-3'} ${className}`} {...props} />;
}

export function Select({ fullWidth = true, className = '', ...props }) {
  return <select className={`${controlClasses} cursor-pointer px-3 ${fullWidth ? 'w-full' : 'w-auto'} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${controlClasses} w-full resize-y px-3 ${className}`} {...props} />;
}
