import { useEffect, useRef, useState } from 'react';

export interface UseTypewriterOptions {
  charsPerSecond?: number;
  minStep?: number;
}

export function useTypewriter(
  target: string,
  options: UseTypewriterOptions = {},
): { displayed: string; isRevealing: boolean } {
  const { charsPerSecond = 75, minStep = 1 } = options;
  const [displayed, setDisplayed] = useState('');
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    if (target.length === 0) {
      setDisplayed('');
      return;
    }
    if (!target.startsWith(displayed)) {
      setDisplayed('');
    }
  }, [target, displayed]);

  useEffect(() => {
    if (displayed.length >= target.length) return;
    const delay = 1000 / Math.max(1, charsPerSecond);

    const timer = setTimeout(() => {
      const current = targetRef.current;
      if (!current.startsWith(displayed)) {
        setDisplayed('');
        return;
      }
      const nextLen = Math.min(displayed.length + minStep, current.length);
      setDisplayed(current.slice(0, nextLen));
    }, delay);

    return () => clearTimeout(timer);
  }, [displayed, target, charsPerSecond, minStep]);

  return {
    displayed,
    isRevealing: displayed.length < target.length,
  };
}
