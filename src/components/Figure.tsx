import { useMemo } from 'react';
import { getFamily } from '../families';
import type { FamilyId, Params } from '../families/types';
import { flatten, toSvgDocument } from '../outputs/svg/render';

/**
 * A design's measured drawing as an inline figure: the same true-scale views the "Get files" drawings
 * use, generated from parameters (never from the mesh), drawn in ink on paper.
 */
export function figureSvg(familyId: FamilyId, params: Params, view = 0): string {
  const fam = getFamily(familyId)!;
  const views = fam.drawing(params).views;
  const v = views[Math.min(view, views.length - 1)];
  return toSvgDocument(flatten(v.shapes), { margin: 3 })
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
}: {
  familyId: FamilyId;
  params?: Params;
  view?: number;
  /** Accessible description; omit when the figure is decorative next to its caption. */
  label?: string;
  className?: string;
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
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
