'use client';

import { useRef, type CSSProperties, type ReactNode, type RefObject, type TouchEvent } from 'react';
import { useOverlayDismiss } from '@/shared/hooks/useOverlayDismiss';
import { useSheetTransition } from '@/shared/hooks/useSheetTransition';
import styles from './BottomSheet.module.css';

/**
 * 바텀시트 껍데기 — 오버레이, 시트 박스, 드래그 핸들, 열림·닫힘 전환, 뒤로 가기 처리.
 *
 * useSheetTransition이 전환 로직을 걷어낸 뒤에도 시트 9종은 그 위의 껍데기를
 * 그대로 복제하고 있었다. root/overlay/sheet/dragHandle 네 규칙(약 60줄)이 CSS
 * 모듈 9개에, 아래로 끌어 닫는 제스처(refs 4개 + 핸들러 3개)가 3곳에 있었다.
 * 그래서 max-height 하나만 서로 달랐는데도 z-index와 safe-area 처리가 시트마다
 * 갈렸다.
 *
 * 아래로 끌어 닫기는 옵션이 아니라 기본이다. 핸들바는 9종 전부가 그리는데 반응하는
 * 건 3종뿐이었다 — 잡아당기라고 생긴 막대가 아무 일도 안 하는 쪽이 버그다. 오버레이
 * 탭과 Escape로 이미 전부 닫히니 드래그가 새로 여는 닫힘 경로도 없다.
 *
 * 헤더는 여기 넣지 않는다. 뒤로 가기 버튼, 취소/확인, 제목+닫기로 시트마다 구성이
 * 달라 공통화하면 분기만 늘어난다. 대신 children을 함수로 받아 닫기 동작과 드래그
 * 핸들러를 넘겨준다 — 헤더에도 드래그를 걸어야 하기 때문이다.
 */

// 아래로 끌어 닫는 임계값. 80px 이상 끌었거나, 짧고 빠르게 튕겼을 때(0.5px/ms).
const DRAG_CLOSE_PX = 80;
const DRAG_CLOSE_VELOCITY = 0.5;

export interface SheetDragHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export interface BottomSheetControls {
  /** 닫는 애니메이션을 재생한 뒤 onClose를 호출한다 */
  close: () => void;
  /** 닫는 애니메이션을 재생한 뒤 지정한 동작으로 넘어간다 */
  closeWith: (action: () => void) => void;
  /** 헤더처럼 핸들 밖의 영역에도 드래그로 닫기를 걸 때 펼친다 */
  drag: SheetDragHandlers;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 시트의 aria-label */
  label: string;
  children: ReactNode | ((controls: BottomSheetControls) => ReactNode);
  /** 예: '85dvh'. 없으면 내용 높이를 그대로 따른다 */
  maxHeight?: string;
  /** 기본값 200(시트 계층). 확인 다이얼로그 계층은 300이다 */
  zIndex?: number;
  /** 시트 박스에 추가로 붙일 클래스 */
  sheetClassName?: string;
  /** 시트 DOM이 필요한 경우(예: 키보드 팝업 대응) */
  sheetRef?: RefObject<HTMLDivElement | null>;
}

export function BottomSheet({
  isOpen,
  onClose,
  label,
  children,
  maxHeight,
  zIndex,
  sheetClassName,
  sheetRef,
}: BottomSheetProps) {
  const { mounted, visible, close, closeWith } = useSheetTransition(isOpen, onClose);

  useOverlayDismiss(isOpen, close);

  const innerRef = useRef<HTMLDivElement | null>(null);

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const dragStartTime = useRef(0);

  function handleDragStart(e: TouchEvent) {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    dragStartTime.current = Date.now();
    // 손가락을 따라가는 동안에는 CSS 트랜지션을 끈다.
    if (innerRef.current) innerRef.current.style.transition = 'none';
  }

  function handleDragMove(e: TouchEvent) {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    // 위로 끄는 건 무시한다(아래로만 닫힌다).
    if (delta < 0) return;
    dragCurrentY.current = delta;
    if (innerRef.current) innerRef.current.style.transform = `translateY(${delta}px)`;
  }

  function handleDragEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;

    const delta = dragCurrentY.current;
    const elapsed = Date.now() - dragStartTime.current;
    const velocity = elapsed > 0 ? delta / elapsed : 0;

    if (innerRef.current) {
      innerRef.current.style.transition = '';
      innerRef.current.style.transform = '';
    }

    // 임계값에 못 미치면 위 초기화만으로 CSS 트랜지션이 제자리로 되돌린다.
    if (delta >= DRAG_CLOSE_PX || velocity >= DRAG_CLOSE_VELOCITY) close();
  }

  if (!mounted) return null;

  const drag: SheetDragHandlers = {
    onTouchStart: handleDragStart,
    onTouchMove: handleDragMove,
    onTouchEnd: handleDragEnd,
  };

  const rootStyle = {
    ...(zIndex !== undefined && { '--sheet-z': zIndex }),
    ...(maxHeight && { '--sheet-max-h': maxHeight }),
  } as CSSProperties;

  return (
    <div className={`${styles.root} ${visible ? styles.rootVisible : ''}`} style={rootStyle}>
      <div className={styles.overlay} onClick={close} aria-hidden="true" />

      <div
        ref={(node) => {
          innerRef.current = node;
          if (sheetRef) sheetRef.current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''} ${sheetClassName ?? ''}`}
      >
        <div className={styles.dragHandleArea} {...drag}>
          <div className={styles.dragHandle} aria-hidden="true" />
        </div>

        {typeof children === 'function' ? children({ close, closeWith, drag }) : children}
      </div>
    </div>
  );
}
