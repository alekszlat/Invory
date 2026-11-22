import { MailOpen } from 'lucide-react';

import Button from '../../shared/ui/Button.jsx';
import { Alert } from '../../shared/ui/Feedback.jsx';

export default function AcceptInvitation({ token, onAccept, pending, error }) {
  return (
    <div className="card mx-auto max-w-xl p-6 sm:p-8">
      <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
        <MailOpen size={24} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Покана за подрегистър</h1>
      <p className="mt-2 leading-relaxed text-ink-muted">Приемете поканата с профила, с който сте влезли. Ролята и обхватът се определят от връзката.</p>
      {error && <Alert className="mt-4">{error}</Alert>}
      <Button className="mt-6" disabled={pending} onClick={() => onAccept(token)}>{pending ? 'Приемане…' : 'Приеми поканата'}</Button>
    </div>
  );
}
