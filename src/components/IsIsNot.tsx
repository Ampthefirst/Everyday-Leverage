export const IS_ROWS: [string, string][] = [
  [
    'A tool that turns a described task and a few measurements into a fitted, strength-checked design',
    'A medical device, a treatment, or a substitute for an occupational therapist or doctor',
  ],
  [
    'A set of usable files: a 3D model, dimensioned drawings, a 1:1 fit-check template and a print sheet',
    'A guarantee of strength — the numbers are estimates, backed by whatever gets tested',
  ],
  ['A way to make a first print more likely to work', 'Food-safe — printed plastic is porous'],
];

export function IsIsNotTable() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">What Everyday Leverage is and is not</caption>
      <thead>
        <tr>
          <th scope="col" className="border-b border-text p-3 text-base font-semibold text-muted">
            The app is
          </th>
          <th scope="col" className="border-b border-text p-3 text-base font-semibold text-muted">
            The app is not
          </th>
        </tr>
      </thead>
      <tbody>
        {IS_ROWS.map(([a, b]) => (
          <tr key={a} className="border-b border-border align-top">
            <td className="p-3">{a}</td>
            <td className="p-3">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
