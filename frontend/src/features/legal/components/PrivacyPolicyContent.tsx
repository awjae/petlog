import styles from './LegalDocument.module.css';

export const PRIVACY_POLICY_EFFECTIVE_DATE = '2026-07-09';
export const PRIVACY_POLICY_CONTACT_EMAIL = 'aw.js.share@gmail.com';

/**
 * 개인정보처리방침 콘텐츠(intro + section×N)만 담당하는 순수 콘텐츠 컴포넌트.
 * /privacy 페이지와 LegalDocumentSheet 바텀시트가 함께 사용한다.
 * 페이지 제목/시행일 헤더, 하단 복귀 링크 등 chrome은 호출부 책임이다.
 */
export function PrivacyPolicyContent() {
  return (
    <>
      <p className={styles.intro}>
        Petlog(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」
        등 관련 법령을 준수합니다. 본 방침은 회사가 제공하는 반려동물 건강 기록 서비스(이하
        &quot;서비스&quot;)에서 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지 안내합니다.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. 수집하는 개인정보 항목 및 수집 방법</h2>
        <p className={styles.paragraph}>
          회사는 회원가입 및 서비스 이용 과정에서 다음 정보를 수집합니다.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>회원 정보(필수)</strong>: 이메일 주소, 비밀번호(암호화 저장), 이름(선택)
          </li>
          <li>
            <strong>반려동물 정보</strong>: 이름, 종(개/고양이), 품종, 생년월일, 성별, 체중, 중성화
            여부, 프로필 이미지
          </li>
          <li>
            <strong>건강 기록 정보</strong>: 체중·식욕·활동량·증상·배변·구토·기분 등 건강 기록값,
            메모, 기록 일시
          </li>
          <li>
            <strong>진료 정보</strong>: 방문 병원명, 방문일, 진료 내용, 첨부 이미지(진단서·사진 등)
          </li>
          <li>
            <strong>투약·접종·예약 정보</strong>: 약품명, 용법·용량, 투약 기간, 접종명, 접종일, 다음
            접종 예정일, 병원 예약 일시 및 메모
          </li>
          <li>
            <strong>AI 건강 리포트 생성 정보</strong>: 리포트 생성을 요청하면 위 건강 기록 정보가 AI
            분석을 위해 이용됩니다. 자세한 내용은 6항을 참고해 주세요.
          </li>
          <li>
            <strong>서비스 이용 과정에서 자동 생성되는 정보</strong>: 접속 로그, 서비스 이용 기록,
            오류 발생 기록, 앱 알림 수신을 위한 기기 식별 정보
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. 개인정보의 수집 및 이용 목적</h2>
        <ul className={styles.list}>
          <li>회원 식별 및 인증, 로그인 상태 유지</li>
          <li>반려동물 건강 기록 저장·조회 등 핵심 서비스 제공</li>
          <li>AI 기반 건강 리포트 생성</li>
          <li>백신·투약 만료 및 정기 건강 기록 알림 등 서비스 이용 안내</li>
          <li>문의 및 불만 처리 등 고객 대응</li>
          <li>부정 이용 방지 및 서비스 안정적 운영</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</h2>
        <p className={styles.paragraph}>
          회사는 원칙적으로 회원 탈퇴 시 지체 없이 개인정보를 파기합니다. 다만 서비스 오남용 방지 및
          이용자 보호를 위해 다음과 같이 유예 기간을 둡니다.
        </p>
        <ul className={styles.list}>
          <li>
            회원 탈퇴를 신청하면 <strong>탈퇴 신청일로부터 30일간</strong> 계정 정보가 보관되며,
            해당 기간 내 재로그인 시 탈퇴가 취소되고 계정이 복구됩니다.
          </li>
          <li>
            유예 기간이 지나면 회원 정보 및 반려동물 건강 기록은 개인을 식별할 수 없도록
            익명화되거나 파기됩니다.
          </li>
          <li>
            관계 법령에서 별도의 보존 기간을 정하는 경우 회사는 해당 법령이 정한 기간 동안 정보를
            보관합니다.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. 개인정보의 파기 절차 및 방법</h2>
        <p className={styles.paragraph}>
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일
          형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며, 종이 문서는 별도로 존재하지 않습니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. 개인정보의 제3자 제공</h2>
        <p className={styles.paragraph}>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나
          수사기관이 법령에서 정한 절차와 방법에 따라 요청하는 경우는 예외로 합니다.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. 개인정보 처리 위탁</h2>
        <p className={styles.paragraph}>
          회사는 안정적인 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부에 위탁하고
          있습니다.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>수탁자</th>
                <th>위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Amazon Web Services(AWS)</td>
                <td>회원·건강 기록 데이터베이스 및 이미지 파일 저장(서울 리전)</td>
              </tr>
              <tr>
                <td>OpenAI</td>
                <td>
                  AI 건강 리포트 생성을 위한 건강 기록 데이터 분석(리포트 생성을 요청한 경우에만
                  전송). 전송되는 정보는 반려동물의 건강 기록(품종·연령·체중·증상 등)으로 한정되며,
                  이메일 등 회원을 식별할 수 있는 정보는 제외됩니다.
                </td>
              </tr>
              <tr>
                <td>Sentry</td>
                <td>서비스 오류 진단 및 안정성 개선을 위한 오류 로그 수집</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. 이용자의 권리와 행사 방법</h2>
        <ul className={styles.list}>
          <li>
            이용자는 언제든지 앱 내 &apos;설정&apos;에서 본인의 프로필 정보를 열람·수정할 수
            있습니다.
          </li>
          <li>
            이용자는 앱 내 &apos;설정 &gt; 회원 탈퇴&apos;를 통해 개인정보 처리 정지 및 삭제(탈퇴)를
            요청할 수 있습니다.
          </li>
          <li>
            그 외 개인정보 열람·정정·삭제 요청은 아래 문의처를 통해 접수할 수 있으며, 회사는 관련
            법령에 따라 지체 없이 조치합니다.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. 개인정보의 안전성 확보 조치</h2>
        <ul className={styles.list}>
          <li>비밀번호는 암호화하여 저장하며, 회사를 포함한 누구도 원문을 조회할 수 없습니다.</li>
          <li>
            로그인 인증 토큰은 해시 형태로 저장하고, 브라우저 스크립트가 접근할 수 없는 쿠키로
            관리합니다.
          </li>
          <li>모든 통신 구간에 HTTPS 암호화를 적용합니다.</li>
          <li>개인정보 처리 시스템에 대한 접근 권한을 최소한의 인원으로 제한합니다.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. 개인정보 보호책임자</h2>
        <p className={styles.paragraph}>
          회사는 개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등을 위해 아래와 같이 담당자를
          지정하고 있습니다.
        </p>
        <p className={styles.paragraph}>
          문의 이메일:{' '}
          <a href={`mailto:${PRIVACY_POLICY_CONTACT_EMAIL}`} className={styles.link}>
            {PRIVACY_POLICY_CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>10. 고지의 의무</h2>
        <p className={styles.paragraph}>
          본 방침의 내용이 추가·삭제·수정되는 경우, 변경 사항 시행 최소 7일 전에 앱 내 공지 등을
          통해 안내합니다.
        </p>
      </section>
    </>
  );
}
