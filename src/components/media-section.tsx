import { useEffect, useState } from 'preact/hooks';
import { useVisibleCount } from '../hooks/use-visible-count';
import { MediaItem } from '../lib/types';
import { MediaCard } from './media-card';

export function MediaSection({ title, items }: { title: string; items: MediaItem[] }) {
  const visibleCount = useVisibleCount();
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(items.length / visibleCount) - 1);

  useEffect(() => {
    setPage((current) => Math.min(current, maxPage));
  }, [maxPage, visibleCount]);

  const start = page * visibleCount;
  const visibleItems = items.slice(start, start + visibleCount);

  return (
    <section class="media-section" aria-label={title}>
      <div class="section-head">
        <h2>{title}</h2>
        <div class="pager">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button>
          <button type="button" disabled={page === maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}>Next</button>
        </div>
      </div>
      <div class="media-grid">
        {visibleItems.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
      </div>
    </section>
  );
}
