import { useEffect, useState } from 'preact/hooks';
import { ChevronLeft, ChevronRight } from 'preact-feather';
import { useVisibleCount } from '../hooks/use-visible-count';
import { MediaItem } from '../lib/types';
import { MediaCard } from './media-card';

interface MediaSectionProps {
  title: string;
  items: MediaItem[];
  loading?: boolean;
}

export function MediaSection({ title, items, loading = false }: MediaSectionProps) {
  const visibleCount = useVisibleCount();
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(items.length / visibleCount) - 1);

  useEffect(() => {
    setPage((current) => Math.min(current, maxPage));
  }, [maxPage, visibleCount]);

  const start = page * visibleCount;
  const visibleItems = items.slice(start, start + visibleCount);
  const skeletonItems = Array.from({ length: visibleCount }, (_, index) => index);

  return (
    <section class="media-section" aria-label={title} aria-busy={loading ? 'true' : undefined}>
      <div class="section-head">
        <h2>{title}</h2>
        <div class="section-controls">
          <button type="button" aria-label={`Previous ${title}`} disabled={loading || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft aria-hidden="true" /></button>
          <button type="button" aria-label={`Next ${title}`} disabled={loading || page === maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))}><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <div class="grid">
        {loading
          ? skeletonItems.map((item) => (
            <div class="card skeleton-card" data-testid="media-skeleton-card" aria-hidden="true" key={item}>
              <div class="poster skeleton-poster" />
              <div class="meta skeleton-meta"><span /><span /></div>
              <div class="title skeleton-title" />
            </div>
          ))
          : visibleItems.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} />)}
      </div>
    </section>
  );
}
