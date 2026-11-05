/** n-of-total progress bar. Decorative: the text beside it carries the meaning. */
export function Segments({ total, on }: { total: number; on: number }) {
  return (
    <div className="segs" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={i < on ? 'sg on' : 'sg'} />
      ))}
    </div>
  );
}
