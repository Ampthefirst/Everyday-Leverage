import { Link } from 'react-router-dom';
import { Card, Note, Page, PageHeader } from '../components/Card';

export default function PrintHelpPage() {
  return (
    <Page narrow>
      <PageHeader
        title="Get it printed"
        lead="You don't need your own 3D printer. The hard part — a design that fits and won't break — is done here. Printing can happen somewhere else."
      />
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold">Where to print</h2>
          <p className="mt-2">
            Many schools, libraries and makerspaces have 3D printers, and online print services will post a
            part to you. Ask before you go — opening hours, costs and file rules differ. Write the place you
            plan to use in the "Get files" tab and it goes on your request sheet.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">What to bring</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>
              The <strong>request-a-print sheet</strong> (PDF) — it explains the part, the material and the
              settings in plain language.
            </li>
            <li>
              The <strong>STL or 3MF file</strong> on a USB stick or by email. The 3MF also carries the
              settings.
            </li>
            <li>
              If you can, the <strong>fit-test mini-print</strong>: a small slice of the part that has to fit.
              It prints in minutes, so one print slot goes further.
            </li>
          </ol>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Useful without a printer</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              The <strong>1:1 fit-check template</strong>: print on paper at 100% and hold it against the jar
              lid, handle or knob.
            </li>
            <li>
              The <strong>foldable size mock-up</strong>: cut, fold and tape it to feel the size in your hand
              (not a working part).
            </li>
            <li>
              The <strong>dimensioned drawing</strong>: enough for someone to make the part another way.
            </li>
          </ul>
        </Card>
        <Note tone="info">
          <h2 className="text-lg font-bold">Paper printing tip</h2>
          <p>
            Printers often shrink pages to fit. Choose "Actual size" or 100%, turn off "Fit to page", and
            check the 25 mm square with a ruler before trusting any template.
          </p>
        </Note>
        <Card>
          <h2 className="text-xl font-bold">Words you might hear</h2>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="font-semibold">Walls / perimeters</dt>
              <dd className="text-muted">The solid outer skin. More walls = stronger.</dd>
            </div>
            <div>
              <dt className="font-semibold">Infill</dt>
              <dd className="text-muted">The honeycomb inside, as a percentage. It supports the walls.</dd>
            </div>
            <div>
              <dt className="font-semibold">Layer height</dt>
              <dd className="text-muted">
                How thick each printed layer is. Parts are weakest across layers, which is why placement on
                the bed matters.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Supports</dt>
              <dd className="text-muted">
                Temporary scaffolding under overhangs, snapped off after printing.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">PLA / PETG</dt>
              <dd className="text-muted">
                The two plastics this app designs for. PETG is tougher and handles warmth better.
              </dd>
            </div>
          </dl>
        </Card>
        <p>
          <Link to="/design" className="font-semibold text-primary underline">
            Start a design
          </Link>
        </p>
      </div>
    </Page>
  );
}
