import { LinkButton } from '../components/Button';
import { Page } from '../components/Card';

export function HomePage() {
  return (
    <Page>
      <h1 className="text-4xl font-bold">Everyday Leverage</h1>
      <p className="mt-3 max-w-2xl text-xl text-muted">
        Turn a hard daily task and a few measurements into a custom-fit, strength-checked aid you can 3D
        print.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton to="/find">Help me find a design</LinkButton>
        <LinkButton to="/design" variant="secondary">
          Pick a design
        </LinkButton>
      </div>
    </Page>
  );
}
