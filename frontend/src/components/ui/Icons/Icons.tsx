export const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const ConfigsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="8" y1="19" x2="12" y2="19" />
  </svg>
);

export function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const AdminIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5.5 Q8 2.5 12 2.5 Q16 2.5 16 5.5 Q16 6.5 12 6.5 Q8 6.5 8 5.5" fill="currentColor" />
    <ellipse cx="12" cy="6.5" rx="6" ry="1.2" fill="currentColor" />
  </svg>
);

export const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const SystemThemeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.32333 6.77305C3.32333 5.3356 4.48861 4.17032 5.92606 4.17032H20.2799C20.777 4.17032 21.1799 4.57326 21.1799 5.07032C21.1799 5.56737 20.777 5.97032 20.2799 5.97032H5.92606C5.48273 5.97032 5.12333 6.32972 5.12333 6.77305V17.7048H13.2552C13.7522 17.7048 14.1552 18.1077 14.1552 18.6048C14.1552 19.1018 13.7522 19.5048 13.2552 19.5048H1.71448C1.21743 19.5048 0.814484 19.1018 0.814484 18.6048C0.814484 18.1077 1.21743 17.7048 1.71448 17.7048H3.32333V6.77305ZM17.9685 10.1348C17.5252 10.1348 17.1658 10.4942 17.1658 10.9375V16.902C17.1658 17.3454 17.5252 17.7048 17.9685 17.7048H20.5843C21.0276 17.7048 21.387 17.3454 21.387 16.902V10.9375C21.387 10.4942 21.0276 10.1348 20.5843 10.1348H17.9685ZM15.3658 10.9375C15.3658 9.50004 16.5311 8.33476 17.9685 8.33476H20.5843C22.0217 8.33476 23.187 9.50004 23.187 10.9375V16.902C23.187 18.3395 22.0217 19.5048 20.5843 19.5048H17.9685C16.5311 19.5048 15.3658 18.3395 15.3658 16.902V10.9375Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const LightThemeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 15.45C13.9054 15.45 15.45 13.9054 15.45 12C15.45 10.0946 13.9054 8.54998 12 8.54998C10.0946 8.54998 8.55001 10.0946 8.55001 12C8.55001 13.9054 10.0946 15.45 12 15.45ZM12 17.25C14.8995 17.25 17.25 14.8995 17.25 12C17.25 9.10048 14.8995 6.74998 12 6.74998C9.10051 6.74998 6.75001 9.10048 6.75001 12C6.75001 14.8995 9.10051 17.25 12 17.25Z"
      fill="#FFFFFF"
    />
    <path
      d="M12 1.09998C12.4971 1.09998 12.9 1.50292 12.9 1.99998V3.73911C12.9 4.23616 12.4971 4.63911 12 4.63911C11.5029 4.63911 11.1 4.23616 11.1 3.73911V1.99998C11.1 1.50292 11.5029 1.09998 12 1.09998ZM3.97231 3.97228C4.32378 3.6208 4.89363 3.6208 5.2451 3.97228L6.54945 5.27662C6.90092 5.62809 6.90092 6.19794 6.54945 6.54942C6.19797 6.90089 5.62813 6.90089 5.27665 6.54942L3.97231 5.24507C3.62083 4.8936 3.62083 4.32375 3.97231 3.97228ZM20.0277 3.97228C20.3792 4.32375 20.3792 4.8936 20.0277 5.24507L18.7234 6.54942C18.3719 6.90089 17.802 6.90089 17.4506 6.54942C17.0991 6.19794 17.0991 5.62809 17.4506 5.27662L18.7549 3.97228C19.1064 3.6208 19.6762 3.6208 20.0277 3.97228ZM1.10001 12C1.10001 11.5029 1.50295 11.1 2.00001 11.1H3.73914C4.23619 11.1 4.63914 11.5029 4.63914 12C4.63914 12.497 4.23619 12.9 3.73914 12.9H2.00001C1.50295 12.9 1.10001 12.497 1.10001 12ZM19.3609 12C19.3609 11.5029 19.7638 11.1 20.2609 11.1H22C22.4971 11.1 22.9 11.5029 22.9 12C22.9 12.497 22.4971 12.9 22 12.9H20.2609C19.7638 12.9 19.3609 12.497 19.3609 12ZM6.54945 17.4505C6.90092 17.802 6.90092 18.3719 6.54945 18.7233L5.2451 20.0277C4.89363 20.3791 4.32378 20.3791 3.97231 20.0277C3.62083 19.6762 3.62083 19.1064 3.97231 18.7549L5.27665 17.4505C5.62813 17.0991 6.19797 17.0991 6.54945 17.4505ZM17.4506 17.4505C17.802 17.0991 18.3719 17.0991 18.7234 17.4505L20.0277 18.7549C20.3792 19.1064 20.3792 19.6762 20.0277 20.0277C19.6762 20.3791 19.1064 20.3791 18.7549 20.0277L17.4506 18.7233C17.0991 18.3719 17.0991 17.802 17.4506 17.4505ZM12 19.3608C12.4971 19.3608 12.9 19.7638 12.9 20.2608V22C12.9 22.497 12.4971 22.9 12 22.9C11.5029 22.9 11.1 22.497 11.1 22V20.2608C11.1 19.7638 11.5029 19.3608 12 19.3608Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const DarkThemeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.14646 15.449C12.0985 15.449 14.6995 12.8468 14.6995 9.37121C14.6995 8.58696 14.5642 7.84243 14.3207 7.16098C14.0194 6.31778 14.3172 5.46999 14.8797 4.96935C15.4633 4.44999 16.4196 4.24174 17.2611 4.76156C20.0067 6.45743 21.8009 9.59252 21.8009 13.1225C21.8009 18.3486 17.8179 22.8003 12.6479 22.8003C9.1801 22.8003 6.2204 20.772 4.67452 17.879C4.20728 17.0046 4.47963 16.0702 5.01853 15.5255C5.5387 14.9998 6.39074 14.7368 7.22036 15.0733C7.81986 15.3164 8.46769 15.449 9.14646 15.449ZM7.67362 18.9242C7.49237 18.7457 7.3195 18.5576 7.15572 18.3606C6.85792 18.0025 6.59018 17.615 6.35674 17.2028C6.32453 17.1459 6.29298 17.0885 6.26209 17.0307C6.16774 16.8541 6.35836 16.6661 6.54388 16.7413C6.59356 16.7615 6.6435 16.7811 6.69369 16.8001C7.11981 16.9616 7.56399 17.0822 8.02209 17.1575C8.19623 17.1861 8.37238 17.2082 8.55033 17.2235C8.74695 17.2404 8.94577 17.249 9.14646 17.249C13.2075 17.249 16.4995 13.722 16.4995 9.37121C16.4995 9.15218 16.4911 8.93522 16.4747 8.7207C16.4575 8.49458 16.4313 8.27117 16.3966 8.05085C16.3232 7.58462 16.2115 7.1323 16.0652 6.69773C16.0491 6.65003 16.0327 6.60255 16.0158 6.55529C15.9484 6.36678 16.1449 6.18777 16.3152 6.29297C16.3678 6.32544 16.4199 6.35858 16.4717 6.39239C16.868 6.65142 17.2397 6.94952 17.582 7.28167C17.8014 7.49452 18.0087 7.72136 18.2028 7.96087C19.3229 9.34335 20.0009 11.1481 20.0009 13.1225C20.0009 17.4733 16.7089 21.0003 12.6479 21.0003C10.7295 21.0003 8.98282 20.2133 7.67362 18.9242Z"
      fill="#FFFFFF"
    />
    <path
      d="M8.682 7.86235C8.78066 7.59574 8.82998 7.46244 8.90186 7.42442C8.96412 7.39149 9.03864 7.39149 9.1009 7.42442C9.17277 7.46244 9.2221 7.59574 9.32076 7.86235L9.62241 8.6775C9.6424 8.73151 9.65239 8.75852 9.66831 8.78116C9.68242 8.80121 9.69989 8.81868 9.71995 8.83279C9.74258 8.84871 9.76959 8.85871 9.82361 8.87869L10.6388 9.18031C10.9054 9.27897 11.0387 9.3283 11.0767 9.40017C11.1097 9.46243 11.1097 9.53695 11.0767 9.59922C11.0387 9.67109 10.9054 9.72042 10.6388 9.81908L9.82361 10.1207C9.76959 10.1407 9.74258 10.1507 9.71995 10.1666C9.69989 10.1807 9.68242 10.1982 9.66831 10.2182C9.65239 10.2409 9.6424 10.2679 9.62241 10.3219L9.32076 11.137C9.2221 11.4036 9.17277 11.5369 9.1009 11.575C9.03864 11.6079 8.96412 11.6079 8.90186 11.575C8.82998 11.5369 8.78066 11.4036 8.682 11.137L8.38035 10.3219C8.36036 10.2679 8.35037 10.2409 8.33445 10.2182C8.32034 10.1982 8.30287 10.1807 8.28281 10.1666C8.26017 10.1507 8.23317 10.1407 8.17915 10.1207L7.364 9.81908C7.09737 9.72042 6.96406 9.67109 6.92604 9.59922C6.8931 9.53695 6.8931 9.46243 6.92604 9.40017C6.96406 9.3283 7.09737 9.27897 7.364 9.18031L8.17915 8.87869C8.23317 8.85871 8.26017 8.84871 8.28281 8.83279C8.30287 8.81868 8.32034 8.80121 8.33445 8.78116C8.35037 8.75852 8.36036 8.73151 8.38035 8.6775L8.682 7.86235Z"
      fill="#FFFFFF"
    />
    <path
      d="M4.68134 2.86232C4.78 2.59571 4.82933 2.46241 4.9012 2.42439C4.96346 2.39146 5.03798 2.39146 5.10024 2.42439C5.17212 2.46241 5.22145 2.59571 5.3201 2.86232L5.75683 4.04248C5.77681 4.0965 5.78681 4.12351 5.80273 4.14614C5.81684 4.1662 5.83431 4.18367 5.85437 4.19778C5.877 4.2137 5.90401 4.22369 5.95803 4.24368L7.1382 4.68036C7.40484 4.77902 7.53815 4.82835 7.57617 4.90022C7.60911 4.96249 7.60911 5.03701 7.57617 5.09927C7.53815 5.17114 7.40484 5.22047 7.13821 5.31913L5.95803 5.75581C5.90401 5.7758 5.877 5.7858 5.85437 5.80172C5.83431 5.81582 5.81684 5.83329 5.80273 5.85335C5.78681 5.87599 5.77681 5.90299 5.75683 5.95701L5.3201 7.13718C5.22145 7.40378 5.17212 7.53709 5.10024 7.5751C5.03798 7.60804 4.96346 7.60804 4.9012 7.5751C4.82933 7.53709 4.78 7.40378 4.68134 7.13718L4.24462 5.95701C4.22463 5.90299 4.21464 5.87599 4.19872 5.85335C4.18461 5.83329 4.16714 5.81582 4.14708 5.80172C4.12444 5.7858 4.09744 5.7758 4.04342 5.75581L2.86324 5.31913C2.59661 5.22047 2.4633 5.17114 2.42527 5.09927C2.39234 5.03701 2.39234 4.96249 2.42527 4.90022C2.4633 4.82835 2.59661 4.77902 2.86324 4.68036L4.04342 4.24368C4.09743 4.22369 4.12444 4.2137 4.14708 4.19778C4.16714 4.18367 4.18461 4.1662 4.19872 4.14614C4.21464 4.12351 4.22463 4.0965 4.24462 4.04248L4.68134 2.86232Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const MinusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const LoaderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      {[...Array(12)].map((_, i) => {
        const angle = i * 30 - 90;
        const x1 = 12 + 8 * Math.cos((angle * Math.PI) / 180);
        const y1 = 12 + 8 * Math.sin((angle * Math.PI) / 180);
        const x2 = 12 + 10 * Math.cos((angle * Math.PI) / 180);
        const y2 = 12 + 10 * Math.sin((angle * Math.PI) / 180);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity={0.3} className={`loader-line loader-line-${i}`} />;
      })}
    </g>
  </svg>
);

export const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const HelpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const ContributorsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const FreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

export const OpenSourceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <path d="M12 16v2" />
    <path d="M8 16v2" />
    <path d="M16 16v2" />
  </svg>
);

export const EncryptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);

export const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const RequestIcon = () => <ConfigsIcon />;

export const NewsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8" />
    <path d="M10 10h8" />
  </svg>
);
