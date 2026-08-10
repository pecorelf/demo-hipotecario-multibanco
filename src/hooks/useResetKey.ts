import { useEffect, useState } from 'react';
import { getResetKey, onReset } from '@/lib/demoMode';

export function useResetKey(): number {
  const [key, setKey] = useState<number>(() => getResetKey());

  useEffect(() => {
    const unsub = onReset((k) => setKey(k));
    return () => {
      unsub();
    };
  }, []);

  return key;
}
