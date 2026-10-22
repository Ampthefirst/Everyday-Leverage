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
          <th scope="col" className="font-display border-b-2 border-border p-3 text-2xl font-normal">
            The app is
          </th>
          <th scope="col" className="font-display border-b-2 border-border p-3 text-2xl font-normal">
            The app is not
          </th>
        </tr>
      </thead>
      <tbody>
        {IS_ROWS.map(([a, b]) => (
          <tr key={a} className="border-b border-border align-top">
            <td className="p-3">
              <span aria-hidden="true" className="font-display mr-2 text-xl text-ok">
                +
              </span>
              {a}
            </td>
            <td className="p-3">
              <span aria-hidden="true" className="font-display mr-2 text-xl text-bad">
                −
              </span>
              {b}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
