import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Msg {
  id: string;
  sender_type: 'supplier' | 'internal' | 'bot';
  sender_name: string | null;
  body: string;
  created_at: string;
}

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Messagerie du portail fournisseur (un fil par fournisseur). Passe par l'edge
 * function `supplier-messages` (accès par token, sans authentification). Le
 * chatbot répond au factuel et transmet à l'équipe sinon.
 */
const SupplierPortalMessages = ({ token }: { token: string }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async (initial = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-messages', {
        body: { token, action: 'list' },
      });
      if (error) throw error;
      setMessages((data?.messages || []) as Msg[]);
      setError(null);
    } catch {
      if (initial) setError("La messagerie n'est pas encore disponible.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), 15000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput('');
    try {
      const { data, error } = await supabase.functions.invoke('supplier-messages', {
        body: { token, action: 'send', body },
      });
      if (error) throw error;
      setMessages((data?.messages || []) as Msg[]);
    } catch {
      setError("Envoi impossible. Réessayez dans un instant.");
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MessageSquare className="h-4 w-4 text-brand" />
        <span className="font-medium text-sm">Messagerie</span>
        <span className="text-xs text-muted-foreground">— l'assistant répond, l'équipe prend le relais si besoin</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : error && messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Une question sur un bon de commande, une facture ou un paiement ? Écrivez-nous ci-dessous.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_type === 'supplier';
            const isBot = m.sender_type === 'bot';
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                  mine ? 'bg-brand text-brand-foreground rounded-br-sm'
                       : isBot ? 'bg-brand-subtle text-ink rounded-bl-sm'
                               : 'bg-muted text-ink rounded-bl-sm')}>
                  {!mine && (
                    <div className="flex items-center gap-1 text-[11px] font-medium mb-0.5 opacity-80">
                      {isBot && <Bot className="h-3 w-3" />}
                      {m.sender_name || (isBot ? 'Assistant' : 'Équipe')}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={cn('text-[10px] mt-1', mine ? 'text-brand-foreground/70' : 'text-muted-foreground')}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Votre message…"
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierPortalMessages;
