import Link from 'next/link';
import { getSession, isConfigured } from '@/lib/supabase/server';
import SetupNotice from '@/components/SetupNotice';
import WriteForm from './WriteForm';

export const metadata = { title: 'Write a discovery' };
export const dynamic = 'force-dynamic';

export default async function WritePage() {
  if (!isConfigured()) return <SetupNotice />;

  const { user, profile } = await getSession();

  if (!user) {
    return (
      <div className="panel mx-auto max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold">Sign in to post</h1>
        <p className="mt-2 text-sm text-slate-400">
          crwnblog is open to everyone — you just need an account so posts have an author.
        </p>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-indigo-500 px-6 py-2.5 font-semibold">
          Sign in / Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-3xl font-black">New discovery</h1>
      <p className="mb-7 text-sm text-slate-500">Posting as {profile?.username}</p>
      <WriteForm isAdmin={profile?.role === 'admin'} />
    </div>
  );
}
