import * as React from 'react';

import { bindTextValueWithoutEmojis, propAllowsEmoji, stripEmojis } from '@/lib/strip-emojis';
import { cn } from '@/lib/utils';

function Input({ className, type, onChange, value, defaultValue, ...props }: React.ComponentProps<'input'>) {
  const allowEmoji = propAllowsEmoji(props['data-allow-emoji']);
  const textValue = typeof value === 'string' && !allowEmoji ? stripEmojis(value) : value;
  const textDefault =
    typeof defaultValue === 'string' && !allowEmoji ? stripEmojis(defaultValue) : defaultValue;

  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
      value={textValue}
      defaultValue={textDefault}
      onChange={allowEmoji ? onChange : bindTextValueWithoutEmojis(onChange)}
    />
  );
}

export { Input };
