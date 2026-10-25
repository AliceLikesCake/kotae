// Kotae Logo：圓角方形底、白色對話框裡的笑臉、右上角打勾小圓點。顏色跟著主題變數走。
export default function Logo({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="23" fill="var(--logo)" />
      <path
        d="M27 30h44a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H47l-12 10V70h-8a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="46" r="3.4" fill="#FFFFFF" />
      <circle cx="58" cy="46" r="3.4" fill="#FFFFFF" />
      <path
        d="M38.5 55c3 3.6 6.4 5.4 10.5 5.4s7.5-1.8 10.5-5.4"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="79" cy="24" r="11" fill="var(--ja)" stroke="var(--logo)" strokeWidth="3" />
      <path
        d="M74.5 24l3 3 6-6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
