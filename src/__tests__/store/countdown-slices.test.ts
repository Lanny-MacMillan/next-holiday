import fs from 'fs';
import path from 'path';

const SLICES = path.join(process.cwd(), 'src/store/slices');

const files = [
  'countdownSlice.ts',
  ...fs
    .readdirSync(SLICES, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '__tests__')
    .flatMap(d =>
      fs.readdirSync(path.join(SLICES, d.name)).map(f => `${d.name}/${f}`),
    )
    .filter(f => f.endsWith('CountdownSlice.ts')),
].sort();

type Action = (payload?: string) => { type: string; payload?: string };
type State = { targetDate: string | null; isActive: boolean };

function load(file: string) {
  const mod = require(path.join(SLICES, file));
  const exported = Object.entries(mod).filter(
    ([, v]) => typeof v === 'function' && 'type' in (v as object),
  ) as [string, Action][];
  const pick = (prefix: string) =>
    exported.find(([name]) => name.startsWith(prefix))?.[1] as Action;
  return {
    reducer: mod.default as (s: State | undefined, a: { type: string }) => State,
    set: pick('set'),
    update: pick('update'),
    clear: pick('clear'),
  };
}

const DATE = '2026-12-25T00:00';
const LATER = '2027-01-01T09:30';
// These update the date only; every other slice also switches a stopped countdown on
const updateKeepsActiveFlag = (file: string) =>
  [
    'countdownSlice.ts',
    'hanukkah/hanukkahCountdownSlice.ts',
    'kwanzaa/kwanzaaCountdownSlice.ts',
  ].includes(file);

describe('countdown slices', () => {
  it('finds all of them', () => {
    expect(files.length).toBeGreaterThanOrEqual(15);
  });

  describe.each(files)('%s', file => {
    const slice = load(file);
    const initial = slice.reducer(undefined, { type: '@@init' });

    it('starts with no countdown', () => {
      expect(initial).toEqual({ targetDate: null, isActive: false });
    });

    it('exports a set, update and clear action', () => {
      expect(typeof slice.set).toBe('function');
      expect(typeof slice.update).toBe('function');
      expect(typeof slice.clear).toBe('function');
    });

    it('set starts a countdown to the date', () => {
      expect(slice.reducer(initial, slice.set(DATE))).toEqual({
        targetDate: DATE,
        isActive: true,
      });
    });

    it('update moves the date of a running countdown', () => {
      const running = slice.reducer(initial, slice.set(DATE));
      expect(slice.reducer(running, slice.update(LATER))).toEqual({
        targetDate: LATER,
        isActive: true,
      });
    });

    it('clear stops the countdown', () => {
      const running = slice.reducer(initial, slice.set(DATE));
      expect(slice.reducer(running, slice.clear())).toEqual({
        targetDate: null,
        isActive: false,
      });
    });

    it('ignores actions from other slices', () => {
      const running = slice.reducer(initial, slice.set(DATE));
      expect(slice.reducer(running, { type: 'something/else' })).toBe(running);
    });

    if (updateKeepsActiveFlag(file)) {
      it('update alone does not switch a stopped countdown on', () => {
        expect(slice.reducer(initial, slice.update(DATE))).toEqual({
          targetDate: DATE,
          isActive: false,
        });
      });
    } else {
      it('update also switches a stopped countdown on', () => {
        expect(slice.reducer(initial, slice.update(DATE))).toEqual({
          targetDate: DATE,
          isActive: true,
        });
      });
    }
  });
});
