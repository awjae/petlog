/**
 * 디자인 토큰의 명암비(WCAG 2.1)를 검증한다.
 *
 * 테마(스카이/핑크) × 명암(라이트/다크) 조합이 늘어날수록 "어느 조합에서 글씨가 안 보이는지"를
 * 눈으로 확인하기 어려워진다. globals.css의 토큰 값을 직접 읽어 조합마다 아래 규칙을 확인한다.
 *
 *   - 본문/보조 텍스트   : 4.5:1 이상 (WCAG AA)
 *   - 버튼 위 텍스트     : 4.5:1 이상
 *   - 큰 텍스트/아이콘   : 3.0:1 이상
 *
 * 실행: npm run check:contrast
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'app',
  'globals.css',
);

/** `<selector> { ... }` 블록에서 `--토큰: 값;` 을 뽑아낸다. */
function parseTokenBlocks(css) {
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const selector = m[1].trim().split('\n').pop().trim();
    const vars = {};
    for (const [, name, value] of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars[name] = value.trim();
    }
    if (Object.keys(vars).length > 0) {
      // 명암은 CSS 미디어 쿼리가 아니라 셀렉터(data-mode)로 갈린다.
      // "직전 @media가 dark였나"를 추론하던 이전 방식은 다른 미디어 쿼리가
      // globals.css에 하나만 추가돼도 조용히 오판했다.
      blocks.push({ selector, vars });
    }
  }
  return blocks;
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * [전경 토큰, 배경 토큰, 최소 명암비, 설명]
 *
 * 규칙은 "화면에 실제로 존재하는 조합"만 넣는다. 쓰이지 않는 조합을 검사하면
 * 통과 결과가 접근성을 보증하는 것처럼 보이지만 실제로는 아무것도 막지 못한다.
 *
 * 한계: 이 스크립트는 globals.css의 토큰만 읽는다. TSX에 인라인으로 박힌 색은
 * 검사 대상이 아니므로, 색은 반드시 토큰으로만 지정한다.
 */
const RULES = [
  // 본문
  ['--color-text-primary', '--color-bg', 4.5, '본문 텍스트'],
  ['--color-text-primary', '--color-surface', 4.5, '카드 위 본문'],
  ['--color-text-secondary', '--color-bg', 4.5, '보조 텍스트'],
  ['--color-text-secondary', '--color-surface', 4.5, '카드 위 보조 텍스트'],
  ['--color-text-secondary', '--color-track', 3.0, '세그먼트 미선택 라벨'],
  ['--color-text-inverse', '--color-text-primary', 4.5, '토스트 위 텍스트'],

  // 기능색
  ['--color-primary-text', '--color-primary', 4.5, '주요 버튼 위 텍스트'],
  ['--color-primary', '--color-bg', 4.5, '링크/아이콘'],
  ['--color-primary', '--color-surface', 4.5, '카드 위 링크/아이콘'],
  // 선택된 세그먼트/배지 라벨은 15px 일반 텍스트라 4.5를 요구한다.
  ['--color-primary', '--color-primary-light', 4.5, '틴트 면 위 텍스트'],

  // 상태색 — 배지 면(-light) 위에 같은 계열 글씨가 올라간다.
  ['--color-success', '--color-success-light', 4.5, '성공 배지'],
  ['--color-warning', '--color-warning-light', 4.5, '경고 배지'],
  ['--color-danger', '--color-danger-light', 4.5, '위험 배지'],
  ['--color-warning', '--color-surface', 4.5, '경고 텍스트'],
  ['--color-success', '--color-surface', 4.5, '성공 텍스트'],
  ['--color-danger', '--color-surface', 4.5, '위험 텍스트'],
  ['--color-danger-text', '--color-danger', 4.5, '위험 버튼 위 텍스트'],

  // 컨트롤 — 스위치 손잡이는 두 모드 모두 흰색이다.
  ['#ffffff', '--color-control-on', 3.0, '스위치 ON 손잡이'],

  // 파스텔 면 위 글씨 — 펫 컬러는 모드와 무관하게 같은 값이다.
  ['--color-on-pastel', '--color-pet-1', 4.5, '펫 태그 1'],
  ['--color-on-pastel', '--color-pet-2', 4.5, '펫 태그 2'],
  ['--color-on-pastel', '--color-pet-3', 4.5, '펫 태그 3'],
  ['--color-on-pastel', '--color-pet-4', 4.5, '펫 태그 4'],
  ['--color-on-pastel', '--color-pet-5', 4.5, '펫 태그 5'],
];

const css = readFileSync(CSS_PATH, 'utf8');
const blocks = parseTokenBlocks(css);

/** 실제 화면에 적용되는 4가지 조합. 뒤 블록이 앞 블록을 덮어쓴다(캐스케이드와 같은 순서). */
const THEMES = [
  { name: '스카이 · 라이트', selectors: [':root'] },
  { name: '스카이 · 다크', selectors: [':root', ":root[data-mode='dark']"] },
  { name: '핑크 · 라이트', selectors: [':root', ":root[data-theme='pastel-pink']"] },
  {
    name: '핑크 · 다크',
    selectors: [
      ':root',
      ":root[data-theme='pastel-pink']",
      ":root[data-mode='dark']",
      ":root[data-mode='dark'][data-theme='pastel-pink']",
    ],
  },
];

let failed = 0;

for (const theme of THEMES) {
  const vars = {};
  // selectors 순서 = 캐스케이드 순서. 뒤 블록이 앞 블록을 덮어쓴다.
  for (const selector of theme.selectors) {
    for (const block of blocks) {
      if (block.selector === selector) Object.assign(vars, block.vars);
    }
  }

  console.log(`\n▸ ${theme.name}`);
  for (const [fg, bg, min, label] of RULES) {
    const fgVal = fg.startsWith('#') ? fg : vars[fg];
    const bgVal = bg.startsWith('#') ? bg : vars[bg];
    if (!fgVal?.startsWith('#') || !bgVal?.startsWith('#')) {
      console.log(`  ? ${label}: ${fg} 또는 ${bg} 값을 색으로 읽지 못했습니다`);
      continue;
    }
    const ratio = contrast(fgVal, bgVal);
    const ok = ratio >= min;
    if (!ok) failed += 1;
    console.log(
      `  ${ok ? '✔' : '✘'} ${label.padEnd(20)} ${ratio.toFixed(2)}:1 (기준 ${min}:1)  ${fgVal} on ${bgVal}`,
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed}개 조합이 대비 기준에 못 미칩니다.`);
  process.exit(1);
}
console.log('\n모든 테마 조합이 대비 기준을 만족합니다.');
