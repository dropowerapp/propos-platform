import { redirect } from 'next/navigation';

// Journal merged into Trades (Journal tab + per-trade journal in trade detail).
export default function JournalRedirect() {
  redirect('/trades');
}
