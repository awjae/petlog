'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Printer } from 'lucide-react';
import { usePetDetail } from '@/features/pet/hooks/usePet';
import { formatPetMeta } from '@/features/pet/utils/petMeta';
import { useHealthRecords } from '@/features/health-record/hooks/useHealthRecords';
import {
  DEFAULT_EXPORT_PERIOD,
  EXPORT_PERIODS,
  buildRecordExport,
  type ExportPeriodDays,
} from '@/features/health-record/utils/exportRecords';
import { canPrint } from '@/shared/native/canPrint';
import styles from './page.module.css';

type Props = {
  params: Promise<{ petId: string }>;
};

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${y}.${m}.${d}`;
}

export default function RecordExportPage({ params }: Props) {
  const { petId } = use(params);
  const router = useRouter();
  const { pet, loading: petLoading } = usePetDetail(petId);
  const { records, loading: recordsLoading, error, refetch } = useHealthRecords(petId);
  const [days, setDays] = useState<ExportPeriodDays>(DEFAULT_EXPORT_PERIOD);

  // 인쇄 가능 여부는 서버 렌더 결과와 다를 수 있으므로(window가 없다) 마운트 후에 정한다.
  // 첫 렌더에 버튼을 그렸다가 지우면 레이아웃이 튄다.
  const [printable, setPrintable] = useState(false);
  useEffect(() => setPrintable(canPrint()), []);

  const data = useMemo(() => buildRecordExport(records, days), [records, days]);
  const loading = petLoading || recordsLoading;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className={styles.title}>기록 내보내기</h1>
        <div className={styles.headerRight}>
          {printable && (
            <button
              type="button"
              className={styles.printButton}
              onClick={() => window.print()}
              aria-label="인쇄 또는 PDF로 저장"
            >
              <Printer size={20} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      {/* ── 기간 선택 ── */}
      <div className={styles.periodBar} role="group" aria-label="기간 선택">
        {EXPORT_PERIODS.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.periodChip} ${days === value ? styles.periodChipActive : ''}`}
            onClick={() => setDays(value)}
            aria-pressed={days === value}
          >
            최근 {value}일
          </button>
        ))}
      </div>

      {error && !records.length && (
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>기록을 불러오지 못했어요</p>
          <button type="button" className={styles.retryButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      )}

      {loading && !records.length && (
        <div className={styles.loadingState} aria-label="불러오는 중">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow} aria-hidden="true" />
          ))}
        </div>
      )}

      {/* ── 인쇄 대상 ── */}
      {!loading && !error && (
        <article className={styles.sheet}>
          <section className={styles.petHeader}>
            <h2 className={styles.petName}>{pet?.name ?? '반려동물'}</h2>
            {pet && <p className={styles.petMeta}>{formatPetMeta(pet)}</p>}
            <p className={styles.period}>
              {formatDate(data.from)} ~ {formatDate(data.to)} · 총 {data.rows.length}건
            </p>
          </section>

          {data.rows.length === 0 ? (
            <p className={styles.empty}>이 기간에 남긴 기록이 없어요.</p>
          ) : (
            <>
              <section className={styles.summary}>
                {data.weight && (
                  <p className={styles.weightLine}>
                    체중 {data.weight.first} kg → {data.weight.last} kg
                    <span className={styles.weightChange}>
                      ({data.weight.change > 0 ? '+' : ''}
                      {data.weight.change} kg)
                    </span>
                  </p>
                )}
                <ul className={styles.countList}>
                  {data.countByType.map((entry) => (
                    <li key={entry.type} className={styles.countItem}>
                      {entry.label} {entry.count}
                    </li>
                  ))}
                </ul>
              </section>

              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  {formatDate(data.from)}부터 {formatDate(data.to)}까지의 건강 기록
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={styles.dateCol}>
                      날짜
                    </th>
                    <th scope="col" className={styles.typeCol}>
                      유형
                    </th>
                    <th scope="col">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => {
                    // 같은 날짜가 이어지면 날짜 칸을 비운다. 표가 짧아지고 날짜 경계가 눈에 띈다.
                    const isNewDate = index === 0 || data.rows[index - 1].date !== row.date;
                    return (
                      <tr key={row.id} className={isNewDate ? styles.dateStart : ''}>
                        <td className={styles.dateCol}>{isNewDate ? formatDate(row.date) : ''}</td>
                        <td className={styles.typeCol}>{row.typeLabel}</td>
                        <td>
                          {row.summary}
                          {row.note && <span className={styles.note}>{row.note}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <p className={styles.disclaimer}>
            보호자가 직접 남긴 기록입니다. 진단이나 의료 판단을 대신하지 않습니다.
          </p>
        </article>
      )}

      {!printable && !loading && !error && (
        <p className={styles.printHint}>
          이 화면을 그대로 보여주거나, 모바일 브라우저에서 petlog.quest에 접속하면 PDF로 저장할 수
          있어요.
        </p>
      )}
    </main>
  );
}
