import React from 'react';
import { icons, type IconName } from './icons';

export type { IconName };

export interface IconProps {
  /** Icon identifier — must be a key of the icon registry. */
  name: IconName;
  /**
   * Width AND height in px (or any CSS length string, e.g. "1em").
   * @default 16
   */
  size?: number | string;
  /** Additional CSS class names applied to the <svg> element. */
  className?: string;
  /** Inline styles applied to the <svg> element. */
  style?: React.CSSProperties;
  /**
   * Accessible label. When provided the icon is announced to screen readers.
   * Omit (or leave empty) for purely decorative icons.
   */
  label?: string;
}

/**
 * Renders an inline SVG icon from the local registry.
 *
 * @example
 * // Decorative — hidden from AT
 * <Icon name="calendar" size={20} />
 *
 * @example
 * // Labelled — announced by screen readers
 * <Icon name="search" label="Search history" />
 *
 * @example
 * // Sized with a CSS length
 * <Icon name="settings" size="1.25em" />
 */
export function Icon({ name, size = 16, className, style, label }: IconProps) {
  const svgContent = icons[name];

  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      className={['icon', className].filter(Boolean).join(' ')}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
