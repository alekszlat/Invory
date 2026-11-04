const tones = {
  neutral: 'bg-[#f0f1f4] text-[#62646c] dark:bg-[#2b2d33] dark:text-[#b0b2be]',
  success: 'bg-[#e9f4ec] text-[#24613d] dark:bg-[#253b2d] dark:text-[#a1dcb3]',
  warning: 'bg-[#fff3d6] text-[#805200] dark:bg-[#403624] dark:text-[#f2cf80]',
  danger: 'bg-[#fcecef] text-[#b32830] dark:bg-[#462c32] dark:text-[#ffb1b8]',
};

export default function StatusBadge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-lg border border-transparent px-2.5 py-1 text-xs leading-relaxed font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
