/**
 * claude-opus-5: Reuses the real card's class names so the placeholder cannot drift from the card it stands
 * in for. Only the shimmer modifiers are skeleton-specific.
 */
export function SkeletonCard() {
  return (
    <article class="card skeleton-card" aria-hidden="true" data-testid="skeleton-card">
      <div class="poster skeleton-poster" />
      <div class="meta skeleton-meta"><span /><span /></div>
      <div class="title skeleton-title"><span /><span /></div>
    </article>
  );
}

export function SkeletonCardGrid({ count, className, label }: { count: number; className: string; label: string }) {
  return (
    <div class={className} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, index) => <SkeletonCard key={index} />)}
    </div>
  );
}
