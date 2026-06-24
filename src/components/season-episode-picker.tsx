import { TvSeasonSummary } from '../lib/types';

interface SeasonEpisodePickerProps {
  seasons: TvSeasonSummary[];
  season: number;
  episode: number;
  onChange: (season: number, episode: number) => void;
}

function episodeLabel(episode: TvSeasonSummary['episodes'][number]) {
  return episode.title ? `E${episode.episodeNumber} - ${episode.title}` : `Episode ${episode.episodeNumber}`;
}

export function SeasonEpisodePicker({ seasons, season, episode, onChange }: SeasonEpisodePickerProps) {
  const selectedSeason = seasons.find((item) => item.seasonNumber === season) ?? seasons[0];

  if (!selectedSeason) {
    return (
      <div class="season-episode-panel" aria-label="TV episode picker">
        <span class="kicker">TV episode</span>
        <div class="empty-row">Episode data unavailable.</div>
      </div>
    );
  }

  return (
    <div class="season-episode-panel" aria-label="TV episode picker">
      <span class="kicker">TV episode</span>
      <div class="season-picker">
        <label class="field">
          Season
          <select
            aria-label="Season"
            value={String(selectedSeason.seasonNumber)}
            onChange={(event) => {
              const nextSeasonNumber = Number(event.currentTarget.value);
              const nextSeason = seasons.find((item) => item.seasonNumber === nextSeasonNumber);
              const nextEpisode = nextSeason?.episodes.some((item) => item.episodeNumber === episode)
                ? episode
                : nextSeason?.episodes[0]?.episodeNumber;
              if (nextSeason && nextEpisode) onChange(nextSeason.seasonNumber, nextEpisode);
            }}
          >
            {seasons.map((item) => <option value={String(item.seasonNumber)} key={item.seasonNumber}>{item.title || `Season ${item.seasonNumber}`}</option>)}
          </select>
        </label>
        <label class="field">
          Episode
          <select aria-label="Episode" value={String(episode)} onChange={(event) => onChange(selectedSeason.seasonNumber, Number(event.currentTarget.value))}>
            {selectedSeason.episodes.map((item) => <option value={String(item.episodeNumber)} key={item.episodeNumber}>{episodeLabel(item)}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
