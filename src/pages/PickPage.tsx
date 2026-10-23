import { useNavigate } from 'react-router-dom';
import { familyList } from '../families';
import { FigureSheet } from '../components/home/FigureSheet';
import { usePageKeys } from '../app/hotkeys';

export default function PickPage() {
  const navigate = useNavigate();
  const ids = familyList().map((f) => f.id);
  usePageKeys((k) => {
    const n = Number(k);
    if (n >= 1 && n <= ids.length) {
      navigate(`/pick/${ids[n - 1]}`);
      return true;
    }
  });
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-24 lg:py-16">
      <h1 className="text-[2.6rem] sm:text-[3.2rem]">Pick a design</h1>
      <p className="mt-4 max-w-[36em] text-muted">
        Nine designs in three groups. Each one adds leverage: a longer lever, a thicker grip or a better
        angle. Every drawing here is made from the design’s own measurements.
      </p>
      <div className="mt-10">
        <FigureSheet numbered />
      </div>
    </div>
  );
}
