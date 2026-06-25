import { SelectMenu } from './select-menu';
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
          <SelectMenu
            label="Season"
            value={String(selectedSeason.seasonNumber)}
            options={seasons.map((item) => ({ value: String(item.seasonNumber), label: item.title || `Season ${item.seasonNumber}` }))}
            onChange={(value) => {
              const nextSeasonNumber = Number(value);
              const nextSeason = seasons.find((item) => item.seasonNumber === nextSeasonNumber);
              const nextEpisode = nextSeason?.episodes.some((item) => item.episodeNumber === episode)
                ? episode
                : nextSeason?.episodes[0]?.episodeNumber;
              if (nextSeason && nextEpisode) onChange(nextSeason.seasonNumber, nextEpisode);
            }}
          />
        </label>
        <label class="field">
          Episode
          <SelectMenu
            label="Episode"
            value={String(episode)}
            options={selectedSeason.episodes.map((item) => ({ value: String(item.episodeNumber), label: episodeLabel(item) }))}
            onChange={(value) => onChange(selectedSeason.seasonNumber, Number(value))}
          />
        </label>
      </div>
    </div>
  );
}
