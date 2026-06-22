import { useEffect, useState } from 'preact/hooks';

export type VisibleCount = 2 | 4 | 6;

export function getVisibleCount(): VisibleCount {
  if (window.matchMedia('(max-width: 600px)').matches) return 2;
  if (window.matchMedia('(max-width: 1024px)').matches) return 4;
  return 6;
}

export function useVisibleCount(): VisibleCount {
  const [count, setCount] = useState<VisibleCount>(() => getVisibleCount());
  useEffect(() => {
    const update = () => setCount(getVisibleCount());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return count;
}
