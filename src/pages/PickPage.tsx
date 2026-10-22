import { useNavigate } from 'react-router-dom';
import { familyList } from '../families';
import { Board } from '../components/home/Board';
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-5xl sm:text-6xl">Pick a design</h1>
      <p className="mt-3 max-w-[62ch] text-lg text-muted">
        Nine designs in three groups. Each one adds leverage: a longer lever, a thicker grip or a better
        angle. Choose one, or press its number.
      </p>
      <div className="mt-10">
        <Board numbered />
      </div>
    </div>
  );
}
