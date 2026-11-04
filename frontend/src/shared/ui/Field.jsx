export default function Field({ label, children, wide = false }) {
  return <label className={`grid min-w-0 gap-2 text-sm font-medium ${wide ? 'sm:col-span-2' : ''}`}><span>{label}</span>{children}</label>;
}
