export function SeasonEpisodePicker({ season, episode, onChange }: { season: number; episode: number; onChange: (season: number, episode: number) => void }) {
  return (
    <div class="season-picker">
      <label class="field">Season<input type="number" min="1" value={season} onInput={(event) => onChange(Number(event.currentTarget.value) || 1, episode)} /></label>
      <label class="field">Episode<input type="number" min="1" value={episode} onInput={(event) => onChange(season, Number(event.currentTarget.value) || 1)} /></label>
    </div>
  );
}
