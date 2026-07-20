// "이미지로 공유" 액션에서 쓸 리포트 요약 카드 이미지를 생성한다.
// 별도 이미지 렌더링 라이브러리(html2canvas 등)를 추가하지 않고, Canvas 2D API만으로
// 직접 그린다 — 콘텐츠가 petName/기간/overview/섹션 불릿 정도로 단순해 라이브러리
// 도입 비용을 정당화하기 어렵다고 판단했다. 색상은 테마 CSS 변수를 런타임에 읽어와
// 라이트/다크 테마를 그대로 반영한다.

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const MARGIN_X = 64;
const CONTENT_WIDTH = CANVAS_WIDTH - MARGIN_X * 2;

export interface ShareImageParams {
  petName: string;
  periodLabel: string;
  overview: string | null;
  highlights: string[];
  recommendations: string[];
  concerns?: string[];
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** 반려동물 정보가 없을 때를 대비한 최소 fallback. */
const FALLBACK_PET_LABEL = '반려동물';

export async function generateShareImageBlob(params: ShareImageParams): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx = context;

  const colorBg = cssVar('--color-bg', '#f4f0e6');
  const colorSurface = cssVar('--color-surface', '#fffef8');
  const colorPrimary = cssVar('--color-primary', '#6baed6');
  const colorPrimaryLight = cssVar('--color-primary-light', '#dceef8');
  const colorWarning = cssVar('--color-warning', '#e89a30');
  const colorTextPrimary = cssVar('--color-text-primary', '#2d3c48');
  const colorTextSecondary = cssVar('--color-text-secondary', '#6a8295');
  const colorBorder = cssVar('--color-border', '#ddd8cc');

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colorBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 워드마크
  ctx.fillStyle = colorPrimary;
  ctx.font = '700 40px -apple-system, sans-serif';
  ctx.fillText('Petlog', MARGIN_X, 88);

  // Masthead 카드
  const mastheadY = 140;
  const mastheadHeight = 160;
  ctx.fillStyle = colorSurface;
  roundRect(ctx, MARGIN_X, mastheadY, CONTENT_WIDTH, mastheadHeight, 24);
  ctx.fill();
  ctx.strokeStyle = colorBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, MARGIN_X, mastheadY, CONTENT_WIDTH, mastheadHeight, 24);
  ctx.stroke();

  ctx.fillStyle = colorTextSecondary;
  ctx.font = '600 26px -apple-system, sans-serif';
  ctx.fillText(params.petName || FALLBACK_PET_LABEL, MARGIN_X + 32, mastheadY + 56);

  ctx.fillStyle = colorTextPrimary;
  ctx.font = '700 34px -apple-system, sans-serif';
  ctx.fillText(params.periodLabel, MARGIN_X + 32, mastheadY + 106);

  let cursorY = mastheadY + mastheadHeight + 32;

  // Overview 카드
  if (params.overview) {
    const overviewMaxWidth = CONTENT_WIDTH - 64;
    ctx.font = '700 32px -apple-system, sans-serif';
    const lines = wrapLines(ctx, params.overview, overviewMaxWidth).slice(0, 4);
    const cardHeight = 64 + lines.length * 44;

    ctx.fillStyle = colorPrimaryLight;
    roundRect(ctx, MARGIN_X, cursorY, CONTENT_WIDTH, cardHeight, 24);
    ctx.fill();

    ctx.fillStyle = colorTextPrimary;
    lines.forEach((line, i) => {
      ctx.fillText(line, MARGIN_X + 32, cursorY + 56 + i * 44);
    });
    cursorY += cardHeight + 28;
  }

  function drawSection(title: string, items: string[], accentColor: string) {
    if (items.length === 0) return;

    ctx.font = '400 24px -apple-system, sans-serif';
    const bulletLines = items.slice(0, 3).map((item) => `· ${item}`);
    const wrapped = bulletLines.flatMap((line) => wrapLines(ctx, line, CONTENT_WIDTH - 64));
    const cardHeight = 64 + wrapped.length * 36;

    ctx.fillStyle = colorSurface;
    roundRect(ctx, MARGIN_X, cursorY, CONTENT_WIDTH, cardHeight, 20);
    ctx.fill();

    ctx.fillStyle = accentColor;
    ctx.font = '700 22px -apple-system, sans-serif';
    ctx.fillText(title, MARGIN_X + 32, cursorY + 40);

    ctx.fillStyle = colorTextPrimary;
    ctx.font = '400 24px -apple-system, sans-serif';
    wrapped.forEach((line, i) => {
      ctx.fillText(line, MARGIN_X + 32, cursorY + 78 + i * 36);
    });

    cursorY += cardHeight + 20;
  }

  drawSection('주요 변화', params.highlights, colorPrimary);
  if (params.concerns && params.concerns.length > 0) {
    drawSection('우려 사항', params.concerns, colorWarning);
  }
  drawSection('관리 팁', params.recommendations, colorPrimary);

  ctx.fillStyle = colorTextSecondary;
  ctx.font = '400 20px -apple-system, sans-serif';
  ctx.fillText('petlog.quest에서 반려동물 건강을 기록해보세요', MARGIN_X, CANVAS_HEIGHT - 48);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
