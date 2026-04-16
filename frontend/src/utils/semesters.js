export function buildSemestersFromCourses(courses) {
  if (!courses?.length) return [];
  const bySem = new Map();
  for (const c of courses) {
    const s = c.semester;
    if (!bySem.has(s)) bySem.set(s, []);
    bySem.get(s).push(c);
  }
  return Array.from(bySem.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([id, list]) => ({
      id,
      theme: `Semester ${id}`,
      credits: list.reduce((acc, x) => acc + (Number(x.credits) || 0), 0),
      courses: list.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        type: c.type
      }))
    }));
}

export function creditBreakdownByType(courses) {
  const out = { core: 0, modern: 0, lab: 0, elec: 0, proj: 0, inter: 0 };
  for (const c of courses || []) {
    const t = c.type && out[c.type] !== undefined ? c.type : "core";
    out[t] += Number(c.credits) || 0;
  }
  return out;
}
