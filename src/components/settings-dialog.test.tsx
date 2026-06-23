import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { setCachedValue } from '../lib/local-store';
import { mergeSourceHealth } from '../lib/source-health';
import { SOURCES } from '../lib/source-registry';
import { SettingsDialog } from './settings-dialog';

describe('SettingsDialog', () => {
  it('shows server list without redundant provider labels and clears app storage after confirmation', () => {
    setCachedValue('settings', 'selectedSource', 'vidlink');
    render(<SettingsDialog open sources={mergeSourceHealth(SOURCES)} onClose={() => undefined} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.queryByText('Third-party provider')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear local storage'));
    fireEvent.click(screen.getByText('Clear storage'));
    expect(localStorage.getItem('stream:v1:settings')).toBeNull();
  });
});
