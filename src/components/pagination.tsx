interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onSelect: (page: number) => void;
}

type PageSlot = number | 'ellipsis';

/**
 * First page, last page, and the current page with its neighbours, with a gap marker wherever
 * the run is not contiguous.
 */
export function pageWindow(current: number, total: number): PageSlot[] {
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return pages.flatMap((page, index) => {
    const isGap = index > 0 && page - pages[index - 1] > 1;
    return isGap ? ['ellipsis' as const, page] : [page];
  });
}

function PageSlotButton({ slot, index, currentPage, onSelect }: { slot: PageSlot; index: number; currentPage: number; onSelect: (page: number) => void }) {
  if (slot === 'ellipsis') {
    return <span class="browse-page-button" aria-hidden="true" key={`e${index}`}>…</span>;
  }

  const isActive = slot === currentPage;
  return (
    <button
      class={`browse-page-button${isActive ? ' is-active' : ''}`}
      type="button"
      aria-label={`Page ${slot}`}
      aria-current={isActive ? 'page' : undefined}
      key={slot}
      onClick={() => onSelect(slot)}
    >{slot}</button>
  );
}

/**
 * claude-opus-5: Lifted out of SearchPage, which had the page-window arithmetic, the slot rendering, and the
 * boundary controls nested inside its own render.
 */
export function Pagination({ currentPage, totalPages, onSelect }: PaginationProps) {
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  return (
    <nav class="browse-pagination" aria-label="Pagination">
      <button class="browse-page-button" type="button" aria-label="First page" disabled={atStart} onClick={() => onSelect(1)}>«</button>
      <button class="browse-page-button" type="button" aria-label="Previous page" disabled={atStart} onClick={() => onSelect(currentPage - 1)}>‹</button>
      {pageWindow(currentPage, totalPages).map((slot, index) => (
        <PageSlotButton slot={slot} index={index} currentPage={currentPage} onSelect={onSelect} key={slot === 'ellipsis' ? `e${index}` : slot} />
      ))}
      <button class="browse-page-button" type="button" aria-label="Next page" disabled={atEnd} onClick={() => onSelect(currentPage + 1)}>›</button>
      <button class="browse-page-button" type="button" aria-label="Last page" disabled={atEnd} onClick={() => onSelect(totalPages)}>»</button>
    </nav>
  );
}
