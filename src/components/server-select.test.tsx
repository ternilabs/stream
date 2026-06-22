import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
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
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Alpha (up)');
    expect(options[1]).toHaveTextContent('Beta (down)');
    expect(options[2]).toHaveTextContent('Gamma (unknown)');
  });

  it('marks the selected option', () => {
    render(<ServerSelect sources={sources} value="b" onChange={() => {}} />);
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options[0].selected).toBe(false);
    expect(options[1].selected).toBe(true);
    expect(options[2].selected).toBe(false);
  });
});
