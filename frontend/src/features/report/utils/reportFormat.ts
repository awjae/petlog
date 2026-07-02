export function formatPeriodRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  const sm = s.getMonth() + 1;
  const em = e.getMonth() + 1;
  const sd = s.getDate();
  const ed = e.getDate();
  if (sy === ey && sm === em) {
    return `${sy}년 ${sm}월 ${sd}일 ~ ${ed}일`;
  }
  return `${sy}.${String(sm).padStart(2, '0')}.${String(sd).padStart(2, '0')} ~ ${String(em).padStart(2, '0')}.${String(ed).padStart(2, '0')}`;
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
