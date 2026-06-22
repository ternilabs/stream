export function SeasonEpisodePicker({ season, episode, onChange }: { season: number; episode: number; onChange: (season: number, episode: number) => void }) {
  return (
    <div class="season-episode-panel" aria-label="TV episode picker">
      <span class="kicker">TV episode</span>
      <div class="season-picker">
        <label class="field">Season<input aria-label="Season" type="number" min="1" value={season} onInput={(event) => onChange(Number(event.currentTarget.value) || 1, episode)} /></label>
        <label class="field">Episode<input aria-label="Episode" type="number" min="1" value={episode} onInput={(event) => onChange(season, Number(event.currentTarget.value) || 1)} /></label>
      </div>
    </div>
  );
}
