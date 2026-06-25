import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SelectMenu } from './select-menu';

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta', decoration: <span class="status-dot is-down" /> },
  { value: 'gamma', label: 'Gamma' },
];

describe('SelectMenu', () => {
  it('renders options and marks the selected value', () => {
    render(<SelectMenu label="Server" value="beta" options={options} onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));

    const renderedOptions = screen.getAllByRole('option');
    expect(renderedOptions).toHaveLength(3);
    expect(renderedOptions[0]).toHaveTextContent('Alpha');
    expect(renderedOptions[1]).toHaveTextContent('Beta');
    expect(renderedOptions[1]).toHaveAttribute('aria-selected', 'true');
    expect(renderedOptions[1].querySelector('.status-dot')).toHaveClass('is-down');
    expect(renderedOptions[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange and closes after choosing an option', () => {
    const onChange = vi.fn();
    render(<SelectMenu label="Server" value="alpha" options={options} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));
    fireEvent.click(screen.getByRole('option', { name: 'Gamma' }));

    expect(onChange).toHaveBeenCalledWith('gamma');
    expect(screen.getByRole('button', { name: 'Server' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when pointerdown happens outside the menu', () => {
    render(<><SelectMenu label="Server" value="alpha" options={options} onChange={() => {}} /><button>Outside</button></>);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));
    expect(screen.getByRole('button', { name: 'Server' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.getByRole('button', { name: 'Server' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('matches menu width to the trigger width and opens above when below space is tight', async () => {
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 120 });
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('select-menu-button')) {
        return { x: 0, y: 80, width: 240, height: 40, top: 80, right: 240, bottom: 120, left: 0, toJSON: () => ({}) } as DOMRect;
      }
      return { x: 0, y: 0, width: 240, height: 100, top: 0, right: 240, bottom: 100, left: 0, toJSON: () => ({}) } as DOMRect;
    });

    render(<SelectMenu label="Server" value="alpha" options={options} onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Server' }));

    const root = screen.getByRole('button', { name: 'Server' }).closest('.select-menu');
    await waitFor(() => expect(root).toHaveClass('is-above'));
    expect(screen.getByRole('listbox', { name: 'Server list' })).toHaveStyle({ width: '240px' });

    rectSpy.mockRestore();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });

  it('renders a disabled empty state when no options exist', () => {
    render(<SelectMenu label="Server" value="" options={[]} emptyLabel="No servers available" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Server' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Server' })).toHaveTextContent('No servers available');
  });
});
