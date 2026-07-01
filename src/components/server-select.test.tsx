import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ServerSelect } from './server-select';
import type { SourceWithHealth } from '../lib/types';

const sources: SourceWithHealth[] = [
  { id: 'a', name: 'Alpha', health: 'up', checkedAt: undefined, movieTemplate: '', tvTemplate: '' },
  { id: 'b', name: 'Beta', health: 'down', checkedAt: undefined, movieTemplate: '', tvTemplate: '' },
  { id: 'c', name: 'Gamma', health: 'unknown', checkedAt: undefined, movieTemplate: '', tvTemplate: '' },
];

describe('ServerSelect', () => {
  it('renders options for each source with health status', () => {
    render(<ServerSelect sources={sources} value="a" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Alpha');
    expect(options[1]).toHaveTextContent('Beta');
    expect(options[2]).toHaveTextContent('Gamma');
    expect(options[1].querySelector('.status-dot')).toHaveClass('is-down');
  });

  it('marks the selected option', () => {
    render(<ServerSelect sources={sources} value="b" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when selecting a source', () => {
    const onChange = vi.fn();
    render(<ServerSelect sources={sources} value="a" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));
    fireEvent.click(screen.getByRole('option', { name: 'Gamma' }));

    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('renders a disabled empty state when no sources exist', () => {
    render(<ServerSelect sources={[]} value="" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Server' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Server' })).toHaveTextContent('No servers available');
  });

  it('disables down sources in the dropdown', () => {
    render(<ServerSelect sources={sources} value="a" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));

    expect(screen.getByRole('option', { name: 'Beta' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-disabled', 'true');
  });
});
