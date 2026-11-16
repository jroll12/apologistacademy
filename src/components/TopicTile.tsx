import {
  BeakerIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  HeartIcon,
  ScaleIcon,
  SunIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { TopicId } from '../conversation/types';
import { cx } from '../lib/cx';
import s from './TopicTile.module.css';

/** Heroicons outline, one per topic. No crosses: the design system keeps them out of decoration. */
const ICONS: Record<TopicId, ComponentType<SVGProps<SVGSVGElement>>> = {
  suffering: HeartIcon,
  bible: BookOpenIcon,
  jesus: SunIcon,
  science: BeakerIcon,
  god: GlobeAltIcon,
  morality: ScaleIcon,
  faiths: UsersIcon,
  church: BuildingLibraryIcon,
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
