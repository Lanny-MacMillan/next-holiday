'use client';

import { useEffect, useMemo, useState } from 'react';

export interface Suggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface SuggestionsProps {
  // Wording for the empty-page prompt, e.g. "Set up meal planning"
  heading: string;
  question: string;
  // What the suggestions are, for the dialog title: "Suggested meal planning tasks"
  noun: string;
  items: Suggestion[];
  // Titles already on the page; those suggestions show as added and cannot be picked again
  existingTitles: string[];
  // Adds the chosen suggestions; throw to keep the dialog open and show an error
  onAdd: (items: Suggestion[]) => Promise<void>;
  // On an empty page the prompt is shown; afterwards a small button takes its place
  showPrompt: boolean;
  onDismissPrompt: () => void;
}

const PRIORITY_STYLES: Record<Suggestion['priority'], string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const keyOf = (title: string) => title.trim().toLowerCase();

// A list of ready-made items to choose from: offered on an empty page, and still there
// afterwards for anything not yet added.
export default function Suggestions({
  heading,
  question,
  noun,
  items,
  existingTitles,
  onAdd,
  showPrompt,
  onDismissPrompt,
}: SuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(
    () => new Set(existingTitles.map(keyOf)),
    [existingTitles],
  );
  const remaining = items.filter(item => !existing.has(keyOf(item.title)));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !adding) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, adding]);

  const openPicker = () => {
    setSelected(new Set(remaining.map(item => keyOf(item.title))));
    setError(null);
    setOpen(true);
  };

  const toggle = (item: Suggestion) =>
    setSelected(current => {
      const next = new Set(current);
      const key = keyOf(item.title);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const add = async () => {
    const chosen = remaining.filter(item => selected.has(keyOf(item.title)));
    if (chosen.length === 0) return;

    setAdding(true);
    setError(null);
    try {
      await onAdd(chosen);
      setOpen(false);
      onDismissPrompt();
    } catch {
      setError(
        'Something went wrong adding them. Some may have been added; please try again.',
      );
    } finally {
      setAdding(false);
    }
  };

  if (remaining.length === 0 && !open) return null;

  return (
    <>
      {showPrompt ? (
        <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {heading}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">{question}</p>
          <div className="flex gap-2">
            <button
              onClick={openPicker}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Choose suggestions
            </button>
            <button
              onClick={onDismissPrompt}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={openPicker}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            💡 Suggestions ({remaining.length})
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestions-title"
            className="card rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-2">
              <h3
                id="suggestions-title"
                className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white"
              >
                Suggested {noun}
              </h3>
              <button
                onClick={() => setOpen(false)}
                disabled={adding}
                aria-label="Close"
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>
                {selected.size} of {remaining.length} selected
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(remaining.map(i => keyOf(i.title))))
                  }
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear
                </button>
              </span>
            </div>

            <ul className="overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
              {items.map(item => {
                const added = existing.has(keyOf(item.title));
                return (
                  <li key={item.title}>
                    <label
                      className={`flex items-start gap-3 p-3 ${
                        added ? 'opacity-60' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={added || selected.has(keyOf(item.title))}
                        disabled={added || adding}
                        onChange={() => toggle(item)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority]}`}
                          >
                            {item.priority}
                          </span>
                          {added && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Already added
                            </span>
                          )}
                        </span>
                        <span className="block text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {error && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                disabled={adding}
                className="px-4 py-2 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={add}
                disabled={selected.size === 0 || adding}
                className="px-4 py-2 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {adding ? 'Adding...' : `Add ${selected.size} selected`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
