/** Star rating for the Film & Screen desk. Ratings are stored 0–10 and shown as 5 stars. */
export default function Stars({
  rating,
  size = 'sm',
  showValue = true,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(10, rating));
  const pct = (clamped / 10) * 100;
  const glyphSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`relative inline-block leading-none ${glyphSize}`} aria-hidden>
        <span className="text-rule-mid">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden whitespace-nowrap text-brass"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </span>
      {showValue && (
        <span className="font-mono text-xs font-bold tracking-wide text-ink">
          {clamped.toFixed(1)}
          <span className="text-faint">/10</span>
        </span>
      )}
      <span className="sr-only">Rated {clamped.toFixed(1)} out of 10</span>
    </span>
  );
}
