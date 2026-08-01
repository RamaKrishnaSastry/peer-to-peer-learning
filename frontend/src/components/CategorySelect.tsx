import { useEffect, useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  domain: string;
  level: number;
  parentId: number | null;
  path: string;
}

const LEVEL_LABELS = ["Domain", "Subject", "Topic", "Subtopic"];

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  domain?: string;
}

export const CategorySelect = ({ value, onChange, className, domain }: CategorySelectProps) => {
  const { data: categories } = useFetch<CategoryNode[]>(
    ["categories", "all", domain ?? "all"],
    `${API_ENDPOINTS.CATEGORIES.ALL}${domain ? `?domain=${domain}` : ""}`,
  );
  const [pathIds, setPathIds] = useState<(number | null)[]>([]);

  const byParent = useMemo(() => {
    const map = new Map<number | null, CategoryNode[]>();
    categories?.forEach((c) => {
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (!categories || value === "") {
      setPathIds([]);
      return;
    }
    const selected = categories.find((c) => c.id.toString() === value);
    if (!selected) return;
    const ids: (number | null)[] = [selected.id];
    let parentId: number | null = selected.parentId;
    while (parentId !== null) {
      ids.unshift(parentId);
      parentId = categories.find((c) => c.id === parentId)?.parentId ?? null;
    }
    setPathIds(ids);
  }, [categories, value]);

  const handleSelect = (level: number, id: string) => {
    const next = [...pathIds];
    next[level] = id ? parseInt(id) : null;
    setPathIds(next.slice(0, level + 1));
    onChange(id);
  };

  if (!categories) return null;

  const roots = byParent.get(null) ?? [];

  const optionsForLevel = (level: number): CategoryNode[] => {
    if (level === 0) return roots;
    const parentId = pathIds[level - 1];
    if (parentId == null) return [];
    return byParent.get(parentId) ?? [];
  };

  const levelsToRender: number[] = [];
  for (let level = 0; optionsForLevel(level).length > 0; level++) {
    levelsToRender.push(level);
  }

  return (
    <div className={`grid gap-3 ${className || "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
      {levelsToRender.map((level) => (
        <div key={level}>
          <label className="block text-gray-700 text-sm mb-1">
            {LEVEL_LABELS[level] ?? `Level ${level + 1}`}
          </label>
          <select
            value={pathIds[level]?.toString() ?? ""}
            onChange={(e) => handleSelect(level, e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">All {LEVEL_LABELS[level].toLowerCase()}s</option>
            {optionsForLevel(level).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
