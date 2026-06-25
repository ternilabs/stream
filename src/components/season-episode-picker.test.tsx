import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SeasonEpisodePicker } from './season-episode-picker';
import { TvSeasonSummary } from '../lib/types';

const seasons: TvSeasonSummary[] = [
  {
    seasonNumber: 1,
    title: 'Season 1',
    episodeCount: 2,
    episodes: [
      { episodeNumber: 1, title: 'Winter Is Coming', aired: '2011-04-17' },
      { episodeNumber: 2, title: 'The Kingsroad', aired: '2011-04-24' },
    ],
  },
  {
    seasonNumber: 2,
    title: 'Season 2',
    episodeCount: 1,
    episodes: [{ episodeNumber: 1, title: 'The North Remembers', aired: '2012-04-01' }],
  },
];

describe('SeasonEpisodePicker', () => {
  it('renders custom season and episode dropdowns from API data', () => {
    render(<SeasonEpisodePicker seasons={seasons} season={1} episode={2} onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Season' })).toHaveTextContent('Season 1');
    expect(screen.getByRole('button', { name: 'Episode' })).toHaveTextContent('E2 - The Kingsroad');

    fireEvent.click(screen.getByRole('button', { name: 'Season' }));
    expect(screen.getByRole('option', { name: 'Season 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Episode' }));
    expect(screen.getByRole('option', { name: 'E2 - The Kingsroad' })).toBeInTheDocument();
  });

  it('selects the first episode when changing to a season without the current episode', () => {
    const onChange = vi.fn();
    render(<SeasonEpisodePicker seasons={seasons} season={1} episode={2} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Season' }));
    fireEvent.click(screen.getByRole('option', { name: 'Season 2' }));

    expect(onChange).toHaveBeenCalledWith(2, 1);
  });

  it('updates the selected episode from API episode options', () => {
    const onChange = vi.fn();
    render(<SeasonEpisodePicker seasons={seasons} season={1} episode={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Episode' }));
    fireEvent.click(screen.getByRole('option', { name: 'E2 - The Kingsroad' }));

    expect(onChange).toHaveBeenCalledWith(1, 2);
  });

  it('renders an unavailable state when no API seasons exist', () => {
    render(<SeasonEpisodePicker seasons={[]} season={1} episode={1} onChange={() => {}} />);

    expect(screen.getByText('Episode data unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Season' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Episode' })).not.toBeInTheDocument();
  });
});
