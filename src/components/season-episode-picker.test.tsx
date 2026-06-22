import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { SeasonEpisodePicker } from './season-episode-picker';

describe('SeasonEpisodePicker', () => {
  it('renders season and episode inputs', () => {
    render(<SeasonEpisodePicker season={2} episode={5} onChange={() => {}} />);
    const seasonInput = screen.getByLabelText('Season') as HTMLInputElement;
    const episodeInput = screen.getByLabelText('Episode') as HTMLInputElement;
    expect(seasonInput).toBeInTheDocument();
    expect(episodeInput).toBeInTheDocument();
    expect(seasonInput.value).toBe('2');
    expect(episodeInput.value).toBe('5');
  });

  it('has min attribute of 1 on both inputs', () => {
    render(<SeasonEpisodePicker season={1} episode={1} onChange={() => {}} />);
    expect(screen.getByLabelText('Season')).toHaveAttribute('min', '1');
    expect(screen.getByLabelText('Episode')).toHaveAttribute('min', '1');
  });
});
