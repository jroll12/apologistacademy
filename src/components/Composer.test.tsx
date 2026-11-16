import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_REPLY_CHARS } from '../conversation/types';
import { Composer } from './Composer';

function Harness({
  onSend,
  disabled,
  initial = '',
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Composer
      value={value}
      onChange={setValue}
      onSend={(t) => {
        onSend(t);
        setValue('');
      }}
      disabled={disabled}
      placeholder="Type or speak your reply"
    />
  );
}

afterEach(cleanup);

describe('Composer', () => {
  it('keeps Send off until there is something to send', async () => {
    const user = userEvent.setup();
    render(<Harness onSend={() => {}} />);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Your reply' }), '   ');
    expect(send).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Your reply' }), 'hello');
    expect(send).toBeEnabled();
  });

  it('sends on Enter and clears, but Shift+Enter makes a new line', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    const box = screen.getByRole('textbox', { name: 'Your reply' });

    await user.type(box, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSend).not.toHaveBeenCalled();
    expect(box).toHaveValue('line one\nline two');

    await user.type(box, '{Enter}');
    expect(onSend).toHaveBeenCalledWith('line one\nline two');
    expect(box).toHaveValue('');
  });

  it('sends with the button', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    await user.type(screen.getByRole('textbox', { name: 'Your reply' }), 'hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('does nothing while paused', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} disabled initial="draft" />);
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('counts down near the limit and stops at it', async () => {
    render(<Harness onSend={() => {}} initial={'x'.repeat(MAX_REPLY_CHARS - 10)} />);
    expect(screen.getByText('10 left')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toHaveAttribute('maxlength', String(MAX_REPLY_CHARS));
  });

  it('hides the count on a short reply', () => {
    render(<Harness onSend={() => {}} initial="short" />);
    expect(screen.queryByText(/ left$/)).not.toBeInTheDocument();
  });

  it('says so when the browser cannot take voice input', () => {
    render(<Harness onSend={() => {}} />);
    expect(screen.getByText(/Voice input is not available/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Speak your reply' })).not.toBeInTheDocument();
  });
});
