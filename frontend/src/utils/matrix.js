export function levelToValue(level) {
  if (level === "strong") return 3;
  if (level === "moderate") return 2;
  if (level === "low") return 1;
  return 0;
}

/** @param {Array<{id:number, po_number:string}>} posOrdered */
export function buildMatrixSemesterData(courses, posOrdered, cosByCourseId, mapByCourseId) {
  return courses.map((course) => {
    const cos = cosByCourseId[course.id] || [];
    const maps = mapByCourseId[course.id] || [];
    return {
      code: course.code,
      name: course.name,
      cos: cos.map((co) => ({
        co: `CO${co.co_number}`,
        map: posOrdered.map((po) => {
          const row = maps.find(
            (m) => Number(m.co_id) === Number(co.id) && Number(m.po_id) === Number(po.id)
          );
          return row ? levelToValue(row.level) : 0;
        })
      }))
    };
  });
}
