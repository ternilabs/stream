import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { setCachedValue } from '../lib/local-store';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { SettingsDialog } from './settings-dialog';

describe('SettingsDialog', () => {
  it('shows server unavailable placeholder when source data is unavailable', () => {
    render(<SettingsDialog open sources={[]} sourcesUnavailable onClose={() => undefined} />);
    const state = screen.getByRole('status', { name: 'Servers unavailable' });
    expect(state).toHaveClass('server-unavailable');
    expect(screen.queryByLabelText('Server status list')).not.toBeInTheDocument();
  });

  it('shows online and down source states only when source data exists', () => {
    const sources = mergeSourceHealth(SOURCES, { checkedAt: null, sources: [
      { id: 'mapple', name: 'Mapple', isUp: true },
      { id: 'vidlink', name: 'VidLink', isUp: false },
    ] });

    render(<SettingsDialog open sources={sources} sourcesUnavailable={false} onClose={() => undefined} />);

    expect(screen.getByText('Mapple').closest('.server-row')).toHaveTextContent('Online');
    expect(screen.getByText('VidLink').closest('.server-row')).toHaveTextContent('Down');
  });

  it('clears app storage and closes both dialogs after confirmation', async () => {
    const onClose = vi.fn();
    setCachedValue('settings', 'selectedSource', 'vidlink');
    localStorage.setItem('stream:recent-searches', JSON.stringify(['Dune']));

    render(<SettingsDialog open sources={mergeSourceHealth(SOURCES, { checkedAt: null, sources: [{ id: 'mapple', name: 'Mapple', isUp: true }] })} sourcesUnavailable={false} onClose={onClose} />);

    fireEvent.click(screen.getByText('Clear local storage'));
    fireEvent.click(screen.getByText('Clear storage'));

    expect(localStorage.getItem('stream:v2:settings')).toBeNull();
    expect(localStorage.getItem('stream:recent-searches')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});
