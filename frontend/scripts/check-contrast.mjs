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

/**
 * `<selector> { ... }` 블록에서 `--토큰: 값;` 을 뽑아낸다.
 *
 * 셀렉터는 콤마로 나눠 **전부** 키로 등록한다. 한 줄만 보던 이전 구현은
 * `:root,\n[data-mode='light'] {` 처럼 셀렉터를 두 줄로 쓰는 순간 `:root` 를 놓쳤고,
 * 그 결과 라이트 조합 전체(46개 검사)가 조용히 건너뛰어졌다. 검사기가 스스로
 * "검사하지 못했다"를 통과로 처리하면 없느니만 못하다.
 */
function parseTokenBlocks(css) {
  // 주석 안의 텍스트가 셀렉터로 섞이지 않도록 먼저 제거한다.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const vars = {};
    for (const [, name, value] of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars[name] = value.trim();
    }
    if (Object.keys(vars).length === 0) continue;

    // 명암은 CSS 미디어 쿼리가 아니라 셀렉터(data-mode)로 갈린다.
    for (const selector of m[1].split(',')) {
      const key = selector.trim().replace(/\s+/g, ' ');
      if (key) blocks.push({ selector: key, vars });
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

  // 공유 이미지의 overview 카드(shareImage.ts) — 틴트 면 위 본문 글씨.
  ['--color-text-primary', '--color-primary-light', 4.5, '틴트 면 위 본문'],

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
      // 값을 못 읽는 것 자체가 결함이다. 규칙은 있는데 검사를 못 했다는 뜻이므로
      // 조용히 넘기지 않고 실패로 센다 — 파서가 깨졌을 때 "전부 통과"가 나오던
      // 원인이 여기 있었다.
      console.log(`  ✘ ${label}: ${fg} 또는 ${bg} 값을 색으로 읽지 못했습니다`);
      failed += 1;
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

/**
 * 하위 트리 라이트 오버라이드([data-mode='light'])가 성립하려면, 다크 블록이 선언하는
 * 모든 토큰을 라이트 블록도 선언해야 한다. 다크 전용 토큰이 하나라도 생기면 공유 이미지
 * 미리보기가 그 토큰만 다크 값을 상속해 반쯤 어두운 카드가 나간다 — 시각으로만 발견되는
 * 종류의 결함이라 여기서 막는다.
 * (결정 문서: .claude/docs/decisions/030-design-token-roles-and-theme-mode.md)
 */
const lightTokens = new Set(
  blocks.filter((b) => !b.selector.includes('dark')).flatMap((b) => Object.keys(b.vars)),
);
const darkOnly = [
  ...new Set(blocks.filter((b) => b.selector.includes('dark')).flatMap((b) => Object.keys(b.vars))),
].filter((token) => !lightTokens.has(token));

console.log('\n▸ 하위 트리 라이트 오버라이드 불변식');
if (darkOnly.length > 0) {
  failed += darkOnly.length;
  console.log(`  ✘ 라이트 블록에 없는 다크 전용 토큰: ${darkOnly.join(', ')}`);
} else {
  console.log('  ✔ 다크 블록의 토큰이 모두 라이트 블록에도 선언되어 있습니다');
}

if (failed > 0) {
  console.error(`\n${failed}건이 기준에 못 미칩니다.`);
  process.exit(1);
}
console.log('\n모든 테마 조합이 대비 기준을 만족합니다.');
