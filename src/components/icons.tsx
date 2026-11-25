import type { SVGProps } from 'react';

/**
 * Two icons Heroicons does not have, drawn to match it: outline, 24px grid, 1.5px round strokes,
 * `currentColor`. They are used the same way as the Heroicons (as a component taking SVG props).
 */
function Outline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

/** A Latin cross, with the crossbar above the middle. */
export function CrossIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M12 3v18" />
      <path d="M7 8.5h10" />
    </Outline>
  );
}

/** A small church: a steeple with a cross on top, a wing on each side, and an arched door. */
export function ChurchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      {/* The cross on the steeple */}
      <path d="M12 1.75v3.5" />
      <path d="M10.5 3h3" />
      {/* The tower and its pointed roof */}
      <path d="M8.75 10 12 6.5l3.25 3.5V21h-6.5V10Z" />
      {/* The wings */}
      <path d="M8.75 13.25 4.25 15.5V21h4.5" />
      <path d="M15.25 13.25l4.5 2.25V21h-4.5" />
      {/* The arched door */}
      <path d="M10.75 21v-3a1.25 1.25 0 0 1 2.5 0v3" />
      <path d="M2.5 21h19" />
    </Outline>
  );
}
