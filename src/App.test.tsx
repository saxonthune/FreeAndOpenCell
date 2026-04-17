import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the FreeAndOpenCell heading', () => {
    const { getByRole } = render(() => <App />);
    expect(
      getByRole('heading', { name: 'FreeAndOpenCell' }),
    ).toBeInTheDocument();
  });
});
