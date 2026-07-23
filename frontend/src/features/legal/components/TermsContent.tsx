import styles from './LegalDocument.module.css';

export const TERMS_EFFECTIVE_DATE = '2026-07-23';
export const TERMS_CONTACT_EMAIL = 'aw.js.share@gmail.com';

/**
 * 이용약관 콘텐츠(intro + 제N조×N + 부칙)만 담당하는 순수 콘텐츠 컴포넌트.
 * /terms 페이지와 LegalDocumentSheet 바텀시트가 함께 사용한다.
 * 페이지 제목/시행일 헤더, 하단 복귀 링크 등 chrome은 호출부 책임이다.
 */
export function TermsContent() {
  return (
    <>
      <p className={styles.intro}>
        Petlog(이하 &quot;회사&quot;)가 제공하는 반려동물 건강 기록 서비스(이하
        &quot;서비스&quot;)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정합니다.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제1조 (목적)</h2>
        <p className={styles.paragraph}>
          이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및
          책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제2조 (서비스의 내용)</h2>
        <p className={styles.paragraph}>회사는 다음과 같은 서비스를 제공합니다.</p>
        <ul className={styles.list}>
          <li>반려동물 건강 기록의 저장 및 조회</li>
          <li>건강 기록 기반 변화 확인 및 리포트 제공</li>
          <li>AI 기반 건강 요약 리포트 생성(유료)</li>
          <li>백신·투약 만료 및 정기 기록 알림</li>
        </ul>
        <p className={styles.paragraph}>
          서비스는 반려동물의 건강 기록을 보호자가 스스로 관리하도록 돕는 도구이며, 수의학적 진단,
          처방 또는 치료를 제공하지 않습니다. AI 리포트를 포함한 서비스 내 모든 정보는 참고용이며,
          반려동물의 건강에 관한 판단은 반드시 수의사와 상담해야 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</h2>
        <p className={styles.paragraph}>
          ① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이
          발생합니다.
        </p>
        <p className={styles.paragraph}>
          ② 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자
          및 변경사유를 명시하여 최소 7일 전(회원에게 불리한 변경의 경우 30일 전) 공지합니다.
        </p>
        <p className={styles.paragraph}>
          ③ 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제4조 (회원가입 및 계정 관리)</h2>
        <p className={styles.paragraph}>
          ① 회원가입은 이용자가 약관 내용에 동의하고 이메일, 비밀번호 등 회사가 정한 정보를 입력하여
          신청하며, 회사가 이를 승낙함으로써 성립합니다.
        </p>
        <p className={styles.paragraph}>
          ② 회원은 가입 시 정확한 정보를 제공해야 하며, 정보가 사실과 다를 경우 서비스 이용에 제한이
          있을 수 있습니다.
        </p>
        <p className={styles.paragraph}>
          ③ 회원은 본인의 계정 정보를 스스로 관리할 책임이 있으며, 제3자에게 계정을 양도, 대여하거나
          공유할 수 없습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제5조 (회원의 의무)</h2>
        <p className={styles.paragraph}>회원은 다음 행위를 해서는 안 됩니다.</p>
        <ul className={styles.list}>
          <li>타인의 정보 도용 또는 허위 정보 등록</li>
          <li>회사의 서비스 운영을 방해하는 행위</li>
          <li>
            서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 유통, 상업적으로 이용하는 행위
          </li>
          <li>관계 법령 및 이 약관에서 금지하는 행위</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제6조 (서비스 이용의 제한 및 중단)</h2>
        <p className={styles.paragraph}>
          ① 회사는 회원이 제5조를 위반하거나 서비스 운영을 방해하는 경우, 사전 통지 후 서비스 이용을
          제한할 수 있습니다. 다만 긴급한 경우 사후 통지할 수 있습니다.
        </p>
        <p className={styles.paragraph}>
          ② 회사는 시스템 점검, 교체, 천재지변 등 불가피한 사유가 있는 경우 서비스 제공을 일시
          중단할 수 있으며, 이 경우 사전에 공지합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제7조 (회원 탈퇴 및 자격 상실)</h2>
        <p className={styles.paragraph}>
          ① 회원은 언제든지 설정 화면을 통해 탈퇴를 신청할 수 있으며, 탈퇴 절차와 개인정보 처리는
          개인정보처리방침을 따릅니다.
        </p>
        <p className={styles.paragraph}>
          ② 회사는 회원이 제5조를 중대하게 위반한 경우 사전 통지 후 회원 자격을 제한하거나 상실시킬
          수 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제8조 (게시물 및 기록 데이터에 대한 권리)</h2>
        <p className={styles.paragraph}>
          ① 회원이 서비스에 등록한 반려동물 건강 기록, 이미지 등 콘텐츠에 대한 권리는 회원에게
          있습니다.
        </p>
        <p className={styles.paragraph}>
          ② 회사는 서비스 제공, 개선 및 AI 리포트 생성을 위한 목적 범위 내에서 회원의 콘텐츠를
          이용할 수 있으며, 이는 개인정보처리방침에 따릅니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제9조 (면책 조항)</h2>
        <p className={styles.paragraph}>
          ① 회사가 제공하는 AI 건강 리포트 및 서비스 내 정보는 참고용 요약 정보이며, 의료적 진단,
          처방 또는 치료 행위에 해당하지 않습니다. 회사는 이를 근거로 한 의사결정으로 발생한 손해에
          대해 책임을 지지 않습니다.
        </p>
        <p className={styles.paragraph}>
          ② 회사는 천재지변, 회원의 귀책사유 등 회사의 통제 범위를 벗어난 사유로 서비스를 제공할 수
          없는 경우 책임을 지지 않습니다.
        </p>
        <p className={styles.paragraph}>
          ③ 회원이 등록한 정보의 정확성에 대한 책임은 회원에게 있습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>제10조 (문의처)</h2>
        <p className={styles.paragraph}>
          서비스 이용과 관련한 문의는 아래 이메일로 접수할 수 있습니다.
        </p>
        <p className={styles.paragraph}>
          문의 이메일:{' '}
          <a href={`mailto:${TERMS_CONTACT_EMAIL}`} className={styles.link}>
            {TERMS_CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>부칙</h2>
        <p className={styles.paragraph}>이 약관은 2026년 7월 23일부터 시행합니다.</p>
      </section>
    </>
  );
}
