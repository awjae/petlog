import { describe, it, expect } from 'vitest';
import { vaccineSchedule } from './vaccineSchedule';

describe('vaccineSchedule', () => {
  it('강아지는 생후 6주부터 2주 간격, 16주에 광견병이다', () => {
    const doses = vaccineSchedule('dog', '2026-01-01');
    expect(doses.map((d) => d.date)).toEqual([
      '2026-02-12',
      '2026-02-26',
      '2026-03-12',
      '2026-03-26',
      '2026-04-09',
      '2026-04-23',
    ]);
    expect(doses.at(-1)?.vaccines).toContain('광견병');
  });

  it('고양이는 생후 8주에 시작한다', () => {
    const doses = vaccineSchedule('cat', '2026-01-01');
    expect(doses[0]).toEqual({ order: 1, date: '2026-02-26', vaccines: '종합백신(FVRCP) 1차' });
    expect(doses).toHaveLength(4);
  });
});
