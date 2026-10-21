import { LinkButton } from '../components/Button';
import { Page, PageHeader } from '../components/Card';

export function NotFoundPage() {
  return (
    <Page narrow>
      <PageHeader title="Page not found" lead="That link does not point to anything here." />
      <LinkButton to="/">Go to the start page</LinkButton>
    </Page>
  );
}
