export default function Icon({ name = 'arrow', ...props }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    diagonal: <path d="M6 18 18 6M6 6h12v12" />,
    down: <path d="M12 4v16m-6-6 6 6 6-6" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 6 9 7 9-7" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8 12-2 9 6-3 6 3-2-9M10 8l1.5 1.5L14 7" /></>,
    certificate: <><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M7 7h10M7 11h4m4 6-1 5 3-2 3 2-1-5" /><circle cx="17" cy="14" r="3" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
    cube: <><path d="m12 3 9 5-9 5-9-5 9-5Zm9 5v9l-9 5-9-5V8m9 5v9" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.arrow}</svg>;
}
