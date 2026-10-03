'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug || typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const storageKey = `crwn_viewed_${slug}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      // sessionStorage may be blocked in strict privacy modes
    }

    const supabase = createClient();
    supabase.rpc('increment_views', { p_slug: slug }).then(() => {
      // fire-and-forget
    });
  }, [slug]);

  return null;
}
