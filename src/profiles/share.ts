import { useEffect } from 'react';
import type { FamilyId, Params } from '../families/types';
import { getFamily } from '../families';
import { coerceParams } from '../families/schema';
import { useDesign } from '../state/design';

/**
 * Share links carry only the family and its parameters in the URL hash (never sent to a server,
 * never tied to a profile name): /design/B1#p=<base64url JSON>.
 */
export function encodeShare(params: Params): string {
  const json = JSON.stringify(params);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(s: string): Record<string, unknown> | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64 + '==='.slice((b64.length + 3) % 4))));
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

export function shareUrl(familyId: FamilyId, params: Params, origin = window.location.origin): string {
  return `${origin}/design/${familyId}#p=${encodeShare(params)}`;
}

/** Apply a shared design from the URL hash once, then clear the hash. */
export function useShareLink(familyId: FamilyId) {
  const setParams = useDesign((s) => s.setParams);
  useEffect(() => {
    const m = window.location.hash.match(/[#&]p=([A-Za-z0-9_-]+)/);
    if (!m) return;
    const raw = decodeShare(m[1]);
    const fam = getFamily(familyId);
    if (raw && fam) setParams(familyId, coerceParams(fam.fields, raw));
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [familyId, setParams]);
}
