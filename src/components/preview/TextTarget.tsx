type Props = {
  text: string;
  className: string;
  stagger?: { step: number };
};

export function TextTarget({ text, className, stagger }: Props) {
  const display = text || 'Animate';
  if (stagger) {
    return (
      <p
        className={`${className} font-display text-5xl sm:text-6xl text-fg leading-tight tracking-tight text-center`}
        aria-label={display}
      >
        {[...display].map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            style={
              {
                ['--i' as never]: i,
              } as React.CSSProperties
            }
            aria-hidden
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
    );
  }
  return (
    <p
      className={`${className} font-display text-5xl sm:text-6xl text-fg leading-tight tracking-tight text-center`}
    >
      {display}
    </p>
  );
}
