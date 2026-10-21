# Ilustraciones SVG reutilizables
import math

INK = "#4c1d95"


def unicorn(w="60mm", extra=""):
    mane = [(72, 48, "#fca5a5"), (56, 70, "#fdba74"), (46, 96, "#fde68a"),
            (44, 124, "#86efac"), (44, 152, "#93c5fd"), (45, 180, "#a5b4fc"),
            (46, 206, "#d8b4fe")]
    circles = "".join(
        f'<circle cx="{x}" cy="{y}" r="18" fill="{c}"/>' for x, y, c in mane)
    neck = "M68 128 C62 160 58 190 56 218 L144 218 C138 192 130 168 128 148 Z"
    return f'''<svg style="width:{w}" viewBox="0 0 200 222" {extra}>
 <g stroke="{INK}" stroke-width="3">{circles}</g>
 <path d="{neck}" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
 <ellipse cx="102" cy="100" rx="52" ry="48" fill="none" stroke="{INK}" stroke-width="6"/>
 <ellipse cx="140" cy="128" rx="36" ry="27" fill="none" stroke="{INK}" stroke-width="6"/>
 <path d="{neck}" fill="#fff"/>
 <ellipse cx="102" cy="100" rx="52" ry="48" fill="#fff"/>
 <ellipse cx="140" cy="128" rx="36" ry="27" fill="#fdf2f8"/>
 <path d="M70 68 Q62 28 92 46 Z" fill="#fff" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
 <path d="M74 62 Q70 38 87 48 Z" fill="#fbcfe8"/>
 <path d="M98 58 L132 6 L120 62 Z" fill="#fde68a" stroke="#b45309" stroke-width="3" stroke-linejoin="round"/>
 <path d="M104 48 L124 42 M110 36 L127 30 M116 24 L129 19" stroke="#b45309" stroke-width="2.5" stroke-linecap="round"/>
 <circle cx="88" cy="58" r="11" fill="#fca5a5" stroke="{INK}" stroke-width="3"/>
 <circle cx="76" cy="66" r="10" fill="#d8b4fe" stroke="{INK}" stroke-width="3"/>
 <ellipse cx="116" cy="96" rx="7" ry="9" fill="#3b0764"/>
 <circle cx="118.5" cy="92" r="2.6" fill="#fff"/>
 <path d="M107 84 L103 79 M112 82 L110 76 M118 82 L119 76" stroke="#3b0764" stroke-width="2.4" stroke-linecap="round"/>
 <ellipse cx="128" cy="116" rx="8" ry="5" fill="#f9a8d4" opacity=".9"/>
 <ellipse cx="160" cy="122" rx="3" ry="4" fill="#be185d"/>
 <path d="M138 140 Q150 149 163 139" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>
</svg>'''


def gem(color="#7c3aed", light="#ede9fe", w="20mm", outline=False, label=""):
    """Cristal. outline=True -> blanco para colorear."""
    f1 = "#fff" if outline else light
    f2 = "#fff" if outline else color
    f3 = "#fff" if outline else mix(color, light)
    sw = 3.2
    txt = (f'<text x="50" y="60" text-anchor="middle" font-family="Fredoka" '
           f'font-weight="600" font-size="22" fill="{color}">{label}</text>') if label else ""
    return f'''<svg style="width:{w}" viewBox="0 0 100 100">
 <polygon points="25,10 75,10 95,35 50,92 5,35" fill="{f1}" stroke="{color}" stroke-width="{sw}" stroke-linejoin="round"/>
 <polygon points="25,10 50,10 35,35" fill="{f3}"/>
 <polygon points="50,10 75,10 65,35" fill="{f3}"/>
 <polygon points="35,35 65,35 50,92" fill="{f2 if not outline else '#fff'}" opacity="{1 if outline else .55}"/>
 <g fill="none" stroke="{color}" stroke-width="2.2" stroke-linejoin="round">
  <polyline points="5,35 95,35"/>
  <polyline points="25,10 35,35 50,10 65,35 75,10"/>
  <polyline points="35,35 50,92 65,35"/>
 </g>
 <polygon points="25,10 75,10 95,35 50,92 5,35" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linejoin="round"/>
 {txt}
</svg>'''


def mix(c1, c2):
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{(x + y) // 2:02x}" for x, y in zip(a, b))


def star(w="9mm", color="#f59e0b", fill="#fff"):
    pts = []
    for i in range(10):
        r = 46 if i % 2 == 0 else 19
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f"{50 + r * math.cos(a):.1f},{52 + r * math.sin(a):.1f}")
    return (f'<svg style="width:{w}" viewBox="0 0 100 100"><polygon points="{" ".join(pts)}" '
            f'fill="{fill}" stroke="{color}" stroke-width="5" stroke-linejoin="round"/></svg>')


def sparkle(w="6mm", color="#f472b6"):
    return (f'<svg style="width:{w}" viewBox="0 0 100 100"><path d="M50 0 C54 38 62 46 100 50 '
            f'C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0 Z" fill="{color}"/></svg>')


def borron(w="30mm"):
    return f'''<svg style="width:{w}" viewBox="0 0 160 110">
 <path d="M30 95 C8 95 4 70 22 62 C14 40 40 26 56 38 C62 14 100 10 108 34 C126 22 152 36 142 60 C160 66 156 95 132 95 Z"
   fill="#e5e7eb" stroke="#6b7280" stroke-width="4" stroke-linejoin="round"/>
 <ellipse cx="66" cy="64" rx="7" ry="9" fill="#374151"/><circle cx="68" cy="61" r="2.4" fill="#fff"/>
 <ellipse cx="98" cy="64" rx="7" ry="9" fill="#374151"/><circle cx="100" cy="61" r="2.4" fill="#fff"/>
 <path d="M70 82 Q82 76 94 82" fill="none" stroke="#374151" stroke-width="3.5" stroke-linecap="round"/>
 <ellipse cx="52" cy="76" rx="6" ry="3.5" fill="#f9a8d4" opacity=".8"/>
 <ellipse cx="112" cy="76" rx="6" ry="3.5" fill="#f9a8d4" opacity=".8"/>
</svg>'''


def castle(w="40mm"):
    return f'''<svg style="width:{w}" viewBox="0 0 200 170">
 <g stroke="{INK}" stroke-width="4" stroke-linejoin="round">
  <rect x="20" y="70" width="40" height="95" fill="#ede9fe"/>
  <rect x="140" y="70" width="40" height="95" fill="#ede9fe"/>
  <rect x="55" y="95" width="90" height="70" fill="#f5f3ff"/>
  <rect x="80" y="45" width="40" height="120" fill="#fce7f3"/>
  <polygon points="14,72 40,22 66,72" fill="#c4b5fd"/>
  <polygon points="134,72 160,22 186,72" fill="#c4b5fd"/>
  <polygon points="74,47 100,0 126,47" fill="#f9a8d4"/>
  <path d="M86 165 L86 130 Q100 112 114 130 L114 165 Z" fill="#fde68a"/>
 </g>
 <circle cx="40" cy="95" r="6" fill="#fde68a" stroke="{INK}" stroke-width="3"/>
 <circle cx="160" cy="95" r="6" fill="#fde68a" stroke="{INK}" stroke-width="3"/>
 <circle cx="100" cy="72" r="7" fill="#fde68a" stroke="{INK}" stroke-width="3"/>
</svg>'''


def chest(w="36mm"):
    return f'''<svg style="width:{w}" viewBox="0 0 200 160">
 <g stroke="{INK}" stroke-width="5" stroke-linejoin="round">
  <path d="M20 70 Q20 20 100 20 Q180 20 180 70 Z" fill="#c084fc"/>
  <rect x="20" y="70" width="160" height="80" rx="6" fill="#a855f7"/>
  <rect x="88" y="20" width="24" height="130" fill="#fde68a"/>
  <rect x="80" y="62" width="40" height="34" rx="6" fill="#fbbf24"/>
 </g>
 <circle cx="100" cy="76" r="5" fill="{INK}"/><rect x="97.5" y="78" width="5" height="10" fill="{INK}"/>
</svg>'''
