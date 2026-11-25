import { BeakerIcon, BookOpenIcon, GlobeAltIcon, HeartIcon, ScaleIcon, SunIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { TopicId } from '../conversation/types';
import { cx } from '../lib/cx';
import { ChurchIcon, CrossIcon } from './icons';
import s from './TopicTile.module.css';

/** One icon per topic: Heroicons outline, plus the cross and church drawn to match (see icons.tsx). */
const ICONS: Record<TopicId, ComponentType<SVGProps<SVGSVGElement>>> = {
  suffering: HeartIcon,
  bible: BookOpenIcon,
  jesus: CrossIcon,
  science: BeakerIcon,
  god: SunIcon,
  morality: ScaleIcon,
  faiths: GlobeAltIcon,
  church: ChurchIcon,
};

/** Violet icon tile with a white glyph, as the design system specifies. */
export function TopicTile({ topic, size = 'md' }: { topic: TopicId; size?: 'md' | 'lg' }) {
  const Icon = ICONS[topic];
  return (
    <span className={cx(s.tile, size === 'lg' && s.lg)} aria-hidden="true">
      <Icon />
    </span>
  );
}
