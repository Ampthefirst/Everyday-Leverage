import { useState } from 'react';
import { Card, Note, Page, PageHeader } from '../components/Card';
import { Choice, NumberSlider, Toggle } from '../components/Field';
import { Button } from '../components/Button';
import { useSettings, type TextScale } from '../state/settings';
import { useProfiles } from '../state/profiles';
import { LLM_NOTICE } from '../llm/client';

export default function SettingsPage() {
  const s = useSettings();
  return (
    <Page narrow>
      <PageHeader
        title="Settings"
        lead="Make the app easier to see and use. These choices are saved on this device only."
      />
      <div className="space-y-6">
        <Card className="space-y-5">
          <h2 className="text-3xl">Display</h2>
          <Choice
            label="Text size"
            value={s.textScale}
            options={[
              { value: '100', label: 'Normal' },
              { value: '125', label: 'Large (125%)' },
              { value: '150', label: 'Extra large (150%)' },
            ]}
            onChange={(v) => s.set({ textScale: v as TextScale })}
          />
          <Toggle
            label="High contrast"
            checked={s.highContrast}
            onChange={(v) => s.set({ highContrast: v })}
            help="Pure black, white and yellow with strong outlines."
          />
          <Toggle
            label="Reduce motion"
            checked={s.reduceMotion}
            onChange={(v) => s.set({ reduceMotion: v })}
            help="'How to use' animations become step-by-step pictures and the title screen appears at once. Your device setting is always respected."
          />
          <Toggle
            label="Single-key shortcuts"
            checked={s.hotkeys}
            onChange={(v) => s.set({ hotkeys: v })}
            help="H home, F find, P pick, M menu. Turn off if they get in the way of speech or switch software."
          />
        </Card>
        <Card className="space-y-3">
          <h2 className="text-3xl">Describe it in your own words (optional)</h2>
          <Toggle
            label="Use Gemini to understand free-text descriptions"
            checked={s.llmOptIn}
            onChange={(v) => s.set({ llmOptIn: v })}
          />
          <Note tone="info">{LLM_NOTICE}</Note>
          <p className="text-sm text-muted">
            Off by default. Everything else in the app works without it, offline.
          </p>
        </Card>
        <ProfilesCard />
      </div>
    </Page>
  );
}

function ProfilesCard() {
  const { profiles, currentId, save, remove, select, update } = useProfiles();
  const current = useProfiles((st) => st.current());
  const [name, setName] = useState('');
  return (
    <Card className="space-y-4">
      <h2 className="text-3xl">Profiles</h2>
      <p className="text-muted">
        A profile keeps measurements you use often (like hand size) and your preferred hand. Stored only in
        this browser — never uploaded. Share links never include a profile.
      </p>
      {profiles.length > 0 && (
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-center gap-2 rounded-xl border-2 p-3 ${p.id === currentId ? 'border-primary' : 'border-border'}`}
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-sm text-muted">
                hand {p.handBreadth} mm · {p.hand}
              </span>
              <span className="ml-auto flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => select(p.id === currentId ? null : p.id)}
                  aria-pressed={p.id === currentId}
                >
                  {p.id === currentId ? 'In use' : 'Use'}
                </Button>
                <Button variant="danger" onClick={() => remove(p.id)} aria-label={`Delete profile ${p.name}`}>
                  Delete
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {currentId && (
        <div className="space-y-3">
          <NumberSlider
            label="Hand width (across the knuckles)"
            value={current.handBreadth}
            min={60}
            max={110}
            step={1}
            unit="mm"
            onChange={(v) => update(current.id, { handBreadth: v })}
          />
          <Choice
            label="Preferred hand"
            value={current.hand}
            options={[
              { value: 'right', label: 'Right' },
              { value: 'left', label: 'Left' },
            ]}
            onChange={(v) => update(current.id, { hand: v as 'left' | 'right' })}
          />
        </div>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          save({
            name: name.trim(),
            handBreadth: current.handBreadth,
            hand: current.hand,
            material: current.material,
            designs: {},
          });
          setName('');
        }}
      >
        <label className="flex-1">
          <span className="block font-semibold">New profile name</span>
          <input
            className="tap mt-1 w-full rounded-lg border border-border bg-surface px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mum, Workshop"
          />
        </label>
        <Button type="submit">Add profile</Button>
      </form>
    </Card>
  );
}
