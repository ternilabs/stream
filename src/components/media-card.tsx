import { Film, Star } from 'preact-feather';
import { MediaItem } from '../lib/types';

export function MediaCard({ item }: { item: MediaItem }) {
  const href = `/watch/${item.id}?type=${item.type}`;
  return (
    <article class="card is-visible">
      <a class="card-link" href={href} aria-label={`Watch ${item.title}`}>
        <div class="poster" aria-hidden={!item.posterUrl}>
          {item.rating ? <span class="rating"><Star aria-hidden="true" />{item.rating.toFixed(1)}</span> : null}
          {item.posterUrl ? <img src={item.posterUrl} alt="" /> : <span class="placeholder"><Film aria-hidden="true" /></span>}
        </div>
        <div class="meta"><span>{item.type.toUpperCase()}</span><span>{item.year ?? '----'}</span></div>
        <div class="title">{item.title}</div>
      </a>
    </article>
  );
}
