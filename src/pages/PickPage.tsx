import { useNavigate } from 'react-router-dom';
import { familyList } from '../families';
import { Catalogue } from '../components/home/Catalogue';
import { usePageKeys } from '../app/hotkeys';

export default function PickPage() {
  const navigate = useNavigate();
  const ids = familyList().map((f) => f.id);
  usePageKeys((k) => {
    const n = Number(k);
    if (n >= 1 && n <= ids.length) {
      navigate(`/pick/${ids[n - 1]}`, { viewTransition: true });
      return true;
    }
  });
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-24 lg:py-16">
      <h1 className="text-[2.6rem] sm:text-[3.2rem]">Pick a design</h1>
      <p className="mt-4 max-w-[38em] text-muted">
        Nine designs in three groups. Each lists the tasks it starts from, the sizes it fits and how it adds
        leverage, with a drawing made from its own measurements. Choose one, or press its number.
      </p>
      <Catalogue />
    </div>
  );
}
