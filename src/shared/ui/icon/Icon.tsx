export type IconName =
  | 'plus'
  | 'left'
  | 'right'
  | 'sun'
  | 'moon'
  | 'link'
  | 'check'
  | 'x'
  | 'trash'
  | 'gear'
  | 'repeat'
  | 'flag'
  | 'io'
  | 'cal'
  | 'clock'
  | 'search';

interface IconProps {
  name: IconName;
  size?: number;
  width?: number;
  fill?: string;
}

export function Icon({ name, size = 18, width = 2.4, fill = 'none' }: IconProps) {
  return (
    <svg
      className="i"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'left' && <path d="M15 6l-6 6 6 6" />}
      {name === 'right' && <path d="M9 6l6 6-6 6" />}
      {name === 'sun' && (
        <g>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </g>
      )}
      {name === 'moon' && <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />}
      {name === 'link' && (
        <g>
          <path d="M9 15l6-6" />
          <path d="M11 6l1-1a4 4 0 015.6 5.6l-2 2" />
          <path d="M13 18l-1 1a4 4 0 01-5.6-5.6l2-2" />
        </g>
      )}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 6.5" />}
      {name === 'x' && <path d="M6 6l12 12M18 6L6 18" />}
      {name === 'trash' && <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />}
      {name === 'gear' && (
        <g>
          <path d="M4 7h7M15 7h5" />
          <circle cx="13" cy="7" r="2.1" />
          <path d="M4 17h7M15 17h5" />
          <circle cx="13" cy="17" r="2.1" />
          <path d="M4 12h3M11 12h9" />
          <circle cx="9" cy="12" r="2.1" />
        </g>
      )}
      {name === 'repeat' && (
        <g>
          <path d="M4 9l3-3 3 3" />
          <path d="M7 6v7a3 3 0 003 3h8" />
          <path d="M20 15l-3 3-3-3" />
          <path d="M17 18V11a3 3 0 00-3-3H6" opacity=".55" />
        </g>
      )}
      {name === 'flag' && <path d="M5 21V4M5 4h11l-2 4 2 4H5" />}
      {name === 'io' && (
        <g>
          <path d="M12 3v12M8 11l4 4 4-4" />
          <path d="M5 20h14" />
        </g>
      )}
      {name === 'cal' && (
        <g>
          <rect x="4" y="5" width="16" height="16" />
          <path d="M4 9h16M8 3v4M16 3v4" />
        </g>
      )}
      {name === 'clock' && (
        <g>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </g>
      )}
      {name === 'search' && (
        <g>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </g>
      )}
    </svg>
  );
}
