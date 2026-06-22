import { MediaItem } from '../lib/types';

export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <article class="media-card">
      <div class="poster" aria-hidden={!item.posterUrl}>{item.posterUrl ? <img src={item.posterUrl} alt={item.title} /> : null}</div>
      <h3>{item.title}</h3>
      <p>{[item.year, item.type.toUpperCase()].filter(Boolean).join(' · ')}</p>
    </article>
  );
}
