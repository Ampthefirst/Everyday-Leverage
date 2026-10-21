import type { AnyFamily, UseLocation } from '../families/types';
import type { MaterialId } from '../strength/materials';
import { MATERIALS } from '../strength/materials';
import type { PrintSettings } from '../strength/types';

export interface SettingAdvice {
  settings: PrintSettings;
  reasons: Record<'material' | 'walls' | 'infill' | 'layerHeight' | 'lineWidth', string>;
}

const HOT_PLACES: UseLocation[] = ['kitchen', 'bathroom', 'car', 'outdoors'];

export function recommendSettings(family: AnyFamily, location: UseLocation): SettingAdvice {
  const hot = HOT_PLACES.includes(location);
  const material: MaterialId = hot ? 'PETG' : 'PLA';
  const torque = family.group === 'B' || family.id === 'A3';
  const walls = torque ? 5 : 4;
  const infill = family.group === 'C' && family.id !== 'C2' ? 0.4 : 0.3;
  return {
    settings: { material, walls, lineWidth: 0.45, infill, layerHeight: 0.2 },
    reasons: {
      material: hot
        ? `PETG: it is tougher and softens at ${MATERIALS.PETG.softeningC.value[0]}–${MATERIALS.PETG.softeningC.value[1]} °C, so warm water or a hot car is less of a problem than with PLA.`
        : 'PLA: easy to print and stiff. Fine for room-temperature use away from heat.',
      walls: `${walls} walls: the outer shell carries most bending and twisting load, so walls matter more than infill.`,
      infill: `${Math.round(infill * 100)}% infill: supports the walls and stops them buckling; more adds weight but little strength.`,
      layerHeight: '0.2 mm layers: a good balance of strength, layer bonding and print time.',
      lineWidth: '0.45 mm lines suit a standard 0.4 mm nozzle.',
    },
  };
}

export interface HeatWarning {
  tone: 'warn' | 'bad';
  text: string;
}

export function heatWarnings(material: MaterialId, location: UseLocation): HeatWarning[] {
  const soft = MATERIALS[material].softeningC.value;
  const out: HeatWarning[] = [
    { tone: 'warn', text: 'Do not put printed parts in the dishwasher — hot water softens and warps them.' },
  ];
  if (location === 'car')
    out.push({
      tone: material === 'PLA' ? 'bad' : 'warn',
      text: `A closed car can pass ${soft[0]} °C in summer — ${material} may soften and bend.`,
    });
  if (location === 'kitchen')
    out.push({
      tone: material === 'PLA' ? 'bad' : 'warn',
      text: `Keep it away from the stove and kettle: ${material} softens around ${soft[0]}–${soft[1]} °C.`,
    });
  if (location === 'bathroom')
    out.push({ tone: 'warn', text: 'Hot tap water is fine for a moment; do not leave it in hot water.' });
  if (location === 'outdoors')
    out.push({ tone: 'warn', text: 'Sunlight slowly weakens plastic. Check it for cracks now and then.' });
  if (MATERIALS[material].creep.value === 'high')
    out.push({
      tone: 'warn',
      text: 'PLA slowly bends under a steady load (creep). Do not leave weight hanging on it.',
    });
  return out;
}
