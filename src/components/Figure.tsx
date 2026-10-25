import { useMemo } from 'react';
import { getFamily } from '../families';
import type { FamilyId, Params } from '../families/types';
import { flatten, toSvgDocument } from '../outputs/svg/render';
import type { Bounds, Shape } from '../outputs/svg/ir';

/**
 * A design's measured drawing as an inline figure: the same true-scale views the "Get files" drawings
 * use, generated from parameters (never from the mesh), drawn in ink on paper.
 */
export function figureSvg(familyId: FamilyId, params: Params, view = 0): string {
  const fam = getFamily(familyId)!;
  const views = fam.drawing(params).views;
  return shapesSvg(views[Math.min(view, views.length - 1)].shapes);
}

/** Inline SVG markup for drawing shapes; `bounds` fixes the frame across redraws. */
export function shapesSvg(shapes: Shape[], bounds?: Bounds): string {
  return toSvgDocument(flatten(shapes), { margin: 3, bounds })
    .replace(/<\?xml[^>]*>\s*/, '')
    .replace(/ width="[^"]*mm" height="[^"]*mm"/, ' preserveAspectRatio="xMidYMid meet"')
    .replace(/<rect width="100%" height="100%" fill="#ffffff"\/>/, '');
}

export function Figure({
  familyId,
  params,
  view = 0,
  label,
  className = '',
  transitionName,
}: {
  familyId: FamilyId;
  params?: Params;
  view?: number;
  /** Accessible description; omit when the figure is decorative next to its caption. */
  label?: string;
  className?: string;
  /** Shared across pages so this drawing glides into place during a View Transition. */
  transitionName?: string;
}) {
  const fam = getFamily(familyId)!;
  const p = params ?? fam.defaults;
  const svg = useMemo(() => figureSvg(familyId, p, view), [familyId, p, view]);
  return (
    <div
      className={`figure-svg ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
