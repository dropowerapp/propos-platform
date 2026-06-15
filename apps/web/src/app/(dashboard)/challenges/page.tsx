import { redirect } from 'next/navigation';

// Challenges merged into Accounts (Evaluation tab) — one entity, one page.
export default function ChallengesRedirect() {
  redirect('/accounts');
}
