type P = { size?: number };

function WeightIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="28" width="32" height="9" rx="4.5" fill="#a8d4ea" />
      <rect x="17" y="22" width="6" height="7" fill="#78b8d6" />
      <rect x="7" y="19" width="26" height="5" rx="2.5" fill="#5aa0c6" />
      <circle cx="20" cy="13" r="12" fill="#f4faff" />
      <circle cx="20" cy="13" r="12" stroke="#c8e4f4" strokeWidth="2" />
      <circle cx="20" cy="13" r="8" fill="none" stroke="#d8eef8" strokeWidth="1" />
      <line
        x1="20"
        y1="13"
        x2="27"
        y2="7"
        stroke="#e05050"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="13" r="2.5" fill="#6baed6" />
      <circle cx="20" cy="13" r="1" fill="white" />
    </svg>
  );
}

function AppetiteIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 22 Q7 35 20 35 Q33 35 33 22 Z" fill="#f8b84c" />
      <rect x="6" y="18" width="28" height="6" rx="3" fill="#e8982a" />
      <circle cx="14" cy="28" r="2.5" fill="#9a5820" />
      <circle cx="20" cy="30.5" r="2.5" fill="#a06828" />
      <circle cx="27" cy="28" r="2.5" fill="#9a5820" />
      <circle cx="17" cy="25" r="2" fill="#a06828" />
      <circle cx="24" cy="25.5" r="2" fill="#9a5820" />
      <path
        d="M15 15 Q17 12 15 9"
        stroke="#e8982a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 14 Q22 11 20 8"
        stroke="#e8982a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 15 Q27 12 25 9"
        stroke="#e8982a"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ActivityIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="10" cy="16" rx="4" ry="5" fill="#d4906a" />
      <ellipse cx="20" cy="13" rx="4" ry="5" fill="#d4906a" />
      <ellipse cx="30" cy="16" rx="4" ry="5" fill="#d4906a" />
      <ellipse cx="20" cy="27" rx="10" ry="9" fill="#d4906a" />
      <ellipse cx="20" cy="26" rx="6.5" ry="6" fill="#e0a880" />
    </svg>
  );
}

function MoodIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="11" y="9" width="22" height="27" rx="3" fill="#e8d898" />
      <rect x="8" y="7" width="22" height="27" rx="3" fill="#fffdf0" />
      <rect x="8" y="7" width="22" height="8" rx="3" fill="#ffd85a" />
      <rect x="8" y="12" width="22" height="3" fill="#ffd85a" />
      <rect x="12" y="20" width="14" height="2" rx="1" fill="#e0d8b8" />
      <rect x="12" y="24" width="12" height="2" rx="1" fill="#e0d8b8" />
      <rect x="12" y="28" width="9" height="2" rx="1" fill="#e0d8b8" />
      <rect
        x="24"
        y="8"
        width="3"
        height="6"
        rx="1.5"
        fill="#ffa040"
        transform="rotate(15 25.5 11)"
      />
      <path d="M24.5 14 L26 17.5 L27.5 14" fill="#ffe0b0" transform="rotate(15 26 14)" />
    </svg>
  );
}

function SymptomIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="17" y="5" width="6" height="22" rx="3" fill="white" />
      <rect x="17" y="5" width="6" height="22" rx="3" stroke="#ddd8cc" strokeWidth="1.5" />
      <rect x="18.5" y="14" width="3" height="13" rx="1.5" fill="#e05050" />
      <circle cx="20" cy="31" r="7" fill="#e05050" />
      <circle cx="20" cy="31" r="4.5" fill="#f08080" />
      <circle cx="17.5" cy="28.5" r="1.5" fill="white" opacity={0.6} />
      <rect x="23" y="10" width="3" height="1.5" rx="0.75" fill="#b8ccd8" />
      <rect x="23" y="15" width="3" height="1.5" rx="0.75" fill="#b8ccd8" />
      <rect x="23" y="20" width="3" height="1.5" rx="0.75" fill="#b8ccd8" />
    </svg>
  );
}

function StoolIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="20" cy="34" rx="11" ry="4.5" fill="#8a4818" />
      <ellipse cx="20" cy="28.5" rx="9" ry="5.5" fill="#a05820" />
      <ellipse cx="20" cy="23" rx="7" ry="6" fill="#b86828" />
      <ellipse cx="21" cy="16.5" rx="5" ry="5" fill="#c07830" />
      <circle cx="17.5" cy="23" r="1.5" fill="#3a2010" />
      <circle cx="22.5" cy="23" r="1.5" fill="#3a2010" />
      <circle cx="18" cy="22.5" r="0.5" fill="white" />
      <circle cx="23" cy="22.5" r="0.5" fill="white" />
      <circle cx="22" cy="13.5" r="1.5" fill="white" opacity={0.5} />
    </svg>
  );
}

function VomitIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="18" r="14" fill="#d8f0d0" />
      <circle cx="20" cy="18" r="14" stroke="#a0d890" strokeWidth="1.5" />
      <path
        d="M12.5 12.5 L15.5 15.5 M15.5 12.5 L12.5 15.5"
        stroke="#5a7850"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24.5 12.5 L27.5 15.5 M27.5 12.5 L24.5 15.5"
        stroke="#5a7850"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 23 Q17 20.5 20 23 Q23 25.5 26 23"
        stroke="#5a7850"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M20 32 L20 30" stroke="#85c978" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="20" cy="35" rx="4" ry="3.5" fill="#a8d898" />
    </svg>
  );
}

function HospitalIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="14" width="26" height="24" rx="2" fill="#e8f4fc" />
      <rect x="7" y="10" width="26" height="7" rx="2" fill="#6baed6" />
      <rect x="7" y="14" width="26" height="3" fill="#6baed6" />
      <rect x="14" y="19" width="12" height="4" rx="2" fill="#e05050" />
      <rect x="18" y="15" width="4" height="12" rx="2" fill="#e05050" />
      <rect x="9" y="28" width="6" height="10" rx="1" fill="#a8d4ea" />
      <rect x="25" y="28" width="6" height="10" rx="1" fill="#a8d4ea" />
      <rect x="16" y="30" width="8" height="8" rx="1" fill="#78b8d6" />
      <rect x="13" y="6" width="14" height="5" rx="1" fill="#5aa0c6" />
    </svg>
  );
}

function VaccinationIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="28" y="12" width="8" height="3" rx="1.5" fill="#4a8ab0" />
      <rect x="30.5" y="14.5" width="3" height="11" rx="1.5" fill="#5aacd0" />
      <rect x="28" y="25" width="8" height="3" rx="1.5" fill="#4a8ab0" />
      <rect x="8" y="14" width="24" height="12" rx="5" fill="white" />
      <rect x="9.5" y="15.5" width="13" height="9" rx="4" fill="#6baed6" />
      <rect
        x="8"
        y="14"
        width="24"
        height="12"
        rx="5"
        stroke="#a8cce0"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="24" y="14" width="1.5" height="5" rx="0.75" fill="#d0e8f4" />
      <rect x="27" y="14" width="1.5" height="5" rx="0.75" fill="#d0e8f4" />
      <rect x="2" y="18.5" width="7" height="3" rx="1.5" fill="#90b8cc" />
    </svg>
  );
}

function AppointmentIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="5" y="10" width="30" height="28" rx="4" fill="white" />
      <rect x="5" y="10" width="30" height="28" rx="4" stroke="#c8e4f4" strokeWidth="1.5" />
      <rect x="5" y="10" width="30" height="11" rx="4" fill="#6baed6" />
      <rect x="5" y="17" width="30" height="4" fill="#6baed6" />
      <rect x="13" y="6" width="4" height="8" rx="2" fill="#4a8ab0" />
      <rect x="23" y="6" width="4" height="8" rx="2" fill="#4a8ab0" />
      <rect x="9" y="24" width="6" height="5" rx="1.5" fill="#e8f4fc" />
      <rect x="17" y="24" width="6" height="5" rx="1.5" fill="#ffd85a" />
      <rect x="25" y="24" width="6" height="5" rx="1.5" fill="#e8f4fc" />
      <rect x="9" y="31" width="6" height="5" rx="1.5" fill="#e8f4fc" />
      <rect x="17" y="31" width="6" height="5" rx="1.5" fill="#e8f4fc" />
      <rect x="25" y="31" width="6" height="5" rx="1.5" fill="#e8f4fc" />
      <path
        d="M18.5 26 L19.8 27.5 L22 25"
        stroke="#e89a30"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function MedicationIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="12" width="26" height="11" rx="5.5" fill="#f08080" />
      <rect x="17" y="12" width="13" height="11" rx="5.5" fill="#fafafa" />
      <rect x="17" y="12" width="5" height="11" fill="#fafafa" />
      <rect x="17" y="12" width="1.5" height="11" fill="#e8c8c8" />
      <rect
        x="4"
        y="12"
        width="26"
        height="11"
        rx="5.5"
        stroke="#e0c0c0"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="30" cy="30" r="8" fill="#6baed6" />
      <circle cx="30" cy="30" r="8" stroke="#4a8ab0" strokeWidth="1.5" />
      <rect x="26" y="29.25" width="8" height="1.5" rx="0.75" fill="white" opacity={0.65} />
      <rect x="29.25" y="26" width="1.5" height="8" rx="0.75" fill="white" opacity={0.65} />
    </svg>
  );
}

function HealthRecordIllustration({ size = 40 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard body */}
      <rect x="8" y="9" width="24" height="28" rx="3" fill="white" />
      <rect x="8" y="9" width="24" height="28" rx="3" stroke="#c8e4f4" strokeWidth="1.5" />
      {/* Clip ring at top */}
      <rect x="15" y="5" width="10" height="7" rx="3" fill="#6baed6" />
      <rect x="17.5" y="6.5" width="5" height="4" rx="2" fill="white" />
      {/* Light blue header band */}
      <rect x="8" y="9" width="24" height="8" rx="3" fill="#dceef8" />
      <rect x="8" y="14" width="24" height="3" fill="#dceef8" />
      {/* EKG / pulse line */}
      <path
        d="M10 23 L15 23 L16.5 18.5 L18 27.5 L19.5 23 L30 23"
        stroke="#e05050"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Ruled lines */}
      <rect x="11" y="30" width="12" height="1.5" rx="0.75" fill="#d0e8f4" />
      <rect x="11" y="34" width="9" height="1.5" rx="0.75" fill="#d0e8f4" />
    </svg>
  );
}

export const RECORD_ILLUSTRATIONS = {
  weight: WeightIllustration,
  appetite: AppetiteIllustration,
  activity: ActivityIllustration,
  mood: MoodIllustration,
  symptom: SymptomIllustration,
  stool: StoolIllustration,
  vomit: VomitIllustration,
  hospital: HospitalIllustration,
  vaccination: VaccinationIllustration,
  appointment: AppointmentIllustration,
  medication: MedicationIllustration,
  healthRecord: HealthRecordIllustration,
} as const;

export type IllustrationKey = keyof typeof RECORD_ILLUSTRATIONS;
