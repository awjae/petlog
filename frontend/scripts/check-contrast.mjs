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
      blocks.push({
        selector,
        vars,
        isDark:
          css.slice(0, m.index).split('@media').length > 1 &&
          /prefers-color-scheme:\s*dark/.test(css.slice(0, m.index).split('@media').pop()),
      });
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

/** [전경 토큰, 배경 토큰, 최소 명암비, 설명] */
const RULES = [
  ['--color-text-primary', '--color-bg', 4.5, '본문 텍스트'],
  ['--color-text-primary', '--color-surface', 4.5, '카드 위 본문'],
  ['--color-text-secondary', '--color-bg', 4.5, '보조 텍스트'],
  ['--color-text-secondary', '--color-surface', 4.5, '카드 위 보조 텍스트'],
  ['--color-primary-text', '--color-primary', 4.5, '주요 버튼 위 텍스트'],
  ['--color-primary', '--color-bg', 4.5, '링크/아이콘'],
  ['--color-primary', '--color-surface', 4.5, '카드 위 링크/아이콘'],
  ['--color-primary', '--color-primary-light', 3.0, '틴트 배지 위 텍스트'],
  ['--color-danger-text', '--color-danger', 4.5, '위험 버튼 위 텍스트'],
  ['--color-danger', '--color-surface', 3.0, '위험 상태 텍스트'],
  ['--color-warning', '--color-surface', 4.5, '경고 텍스트'],
  ['--color-success', '--color-surface', 4.5, '성공 텍스트'],
  ['--color-text-inverse', '--color-text-primary', 4.5, '토스트 위 텍스트'],
];

const css = readFileSync(CSS_PATH, 'utf8');
const blocks = parseTokenBlocks(css);

/** 실제 화면에 적용되는 4가지 조합. 뒤 블록이 앞 블록을 덮어쓴다(캐스케이드와 같은 순서). */
const THEMES = [
  { name: '스카이 · 라이트', selectors: [':root'], dark: false },
  { name: '스카이 · 다크', selectors: [':root'], dark: true },
  { name: '핑크 · 라이트', selectors: [':root', "[data-theme='pastel-pink']"], dark: false },
  { name: '핑크 · 다크', selectors: [':root', "[data-theme='pastel-pink']"], dark: true },
];

let failed = 0;

for (const theme of THEMES) {
  const vars = {};
  for (const block of blocks) {
    if (!theme.selectors.includes(block.selector)) continue;
    if (block.isDark && !theme.dark) continue;
    Object.assign(vars, block.vars);
  }

  console.log(`\n▸ ${theme.name}`);
  for (const [fg, bg, min, label] of RULES) {
    const fgVal = vars[fg];
    const bgVal = vars[bg];
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
