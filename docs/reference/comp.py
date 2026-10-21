# Componentes de ejercicios (HTML/SVG) y hoja de estilos
import math
import random
from art import star, gem, unicorn, sparkle

FONT_DIR = "../fonts"

CSS = f"""
@font-face {{ font-family: Andika; src: url({FONT_DIR}/Andika-Regular.woff); font-weight: 400; }}
@font-face {{ font-family: Andika; src: url({FONT_DIR}/Andika-Bold.woff); font-weight: 700; }}
@font-face {{ font-family: Andika; src: url({FONT_DIR}/Andika-Italic.woff); font-style: italic; }}
@font-face {{ font-family: Fredoka; src: url({FONT_DIR}/Fredoka-400.woff); font-weight: 400; }}
@font-face {{ font-family: Fredoka; src: url({FONT_DIR}/Fredoka-500.woff); font-weight: 500; }}
@font-face {{ font-family: Fredoka; src: url({FONT_DIR}/Fredoka-600.woff); font-weight: 600; }}
@font-face {{ font-family: Fredoka; src: url({FONT_DIR}/Fredoka-700.woff); font-weight: 700; }}
@page {{ size: A4; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: #fff; }}
body {{ font-family: Andika, sans-serif; color: #2e1a47; font-size: 12.5pt; line-height: 1.4;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ width: 210mm; height: 297mm; padding: 12mm 14mm 15mm; position: relative; overflow: hidden;
  break-after: page; page-break-after: always; --lc: #7c3aed; --lcl: #ede9fe; }}
.page:last-child {{ break-after: auto; page-break-after: auto; }}
.phead {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; }}
.tag {{ font: 600 10.5pt Fredoka; color: var(--lc); background: var(--lcl); border-radius: 99px;
  padding: 1.5mm 4.5mm; display: inline-flex; align-items: center; gap: 2mm; }}
.pfoot {{ position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; justify-content: space-between;
  align-items: center; font: 400 9pt Fredoka; color: #8b7aa8; }}
.pfoot .done {{ display: flex; align-items: center; gap: 2mm; }}
.pnum {{ font: 600 10pt Fredoka; color: var(--lc); }}
h1 {{ font: 600 25pt Fredoka; color: var(--lc); margin: 0 0 3mm; line-height: 1.1; }}
h2 {{ font: 600 16pt Fredoka; color: var(--lc); margin: 0 0 2mm; line-height: 1.15; }}
h3 {{ font: 600 13pt Fredoka; color: #2e1a47; margin: 0 0 1.5mm; }}
p {{ margin: 0 0 2.5mm; }}
.kicker {{ font: 500 11pt Fredoka; color: var(--lc); letter-spacing: .5px; text-transform: uppercase; }}
.story p {{ font-size: 15.5pt; line-height: 1.6; margin-bottom: 3.5mm; }}
.story.letter p {{ font-size: 14pt; line-height: 1.5; margin-bottom: 2.6mm; }}
.box {{ border: .6mm solid var(--lc); border-radius: 5mm; padding: 4mm 5mm; margin-bottom: 4mm; }}
.soft {{ background: var(--lcl); border-radius: 5mm; padding: 4mm 5mm; margin-bottom: 4mm; }}
.mission {{ display: flex; gap: 4mm; align-items: center; border: .7mm dashed var(--lc); border-radius: 5mm;
  padding: 3.5mm 5mm; background: #fff; }}
.mission b {{ font-family: Fredoka; font-weight: 600; color: var(--lc); }}
.lumi {{ display: flex; gap: 3mm; align-items: flex-start; margin: 2mm 0 4mm; }}
.lumi .bubble {{ position: relative; background: #fdf4ff; border: .5mm solid #e879f9; border-radius: 5mm;
  padding: 3mm 4.5mm; font-size: 12.5pt; flex: 1; }}
.lumi .bubble b {{ color: #a21caf; font-family: Fredoka; font-weight: 600; }}
.sec {{ margin-bottom: 4.5mm; }}
.sec-h {{ display: flex; align-items: baseline; gap: 2.5mm; margin-bottom: 2.5mm; }}
.sec-n {{ font: 600 10pt Fredoka; color: #fff; background: var(--lc); border-radius: 99px; padding: .8mm 3mm;
  white-space: nowrap; }}
.sec-t {{ font: 600 14pt Fredoka; color: #2e1a47; }}
.sec-i {{ font-size: 11.5pt; color: #5b4a75; margin: -1mm 0 2.5mm; }}
.big {{ font: 600 19pt Fredoka; }}
.num {{ font-family: Fredoka; font-weight: 500; }}
.hl {{ background: #fef08a; border-radius: 1.5mm; padding: 0 1mm; }}
.c-u {{ color: #2563eb; }} .c-d {{ color: #db2777; }} .c-c {{ color: #16a34a; }} .c-um {{ color: #d97706; }}
.row {{ display: flex; gap: 5mm; }}
.col {{ flex: 1; }}
.center {{ text-align: center; }}
.muted {{ color: #6b5b86; font-size: 10.5pt; }}

/* operación en columna */
.ops {{ display: flex; flex-wrap: wrap; gap: 3.5mm; }}
.opcard {{ position: relative; border: .45mm solid #e9d5ff; border-radius: 4mm; padding: 3mm 3.5mm 3mm 3mm;
  background: #fff; }}
.opcard .lbl {{ position: absolute; top: -2.2mm; left: -2.2mm; width: 6.5mm; height: 6.5mm; border-radius: 50%;
  background: var(--lc); color: #fff; font: 600 9.5pt/6.5mm Fredoka; text-align: center; }}
.vop {{ display: grid; grid-template-columns: 5mm repeat(var(--cols), 9.5mm); gap: .9mm; justify-content: center; }}
.vop .lab {{ font: 600 7.5pt/4.2mm Fredoka; text-align: center; border-radius: 1.5mm; color: #fff; }}
.lab.U {{ background: #3b82f6; }} .lab.D {{ background: #ec4899; }} .lab.C {{ background: #22c55e; }}
.lab.UM {{ background: #f59e0b; }}
.vop .cy {{ height: 5.6mm; width: 6mm; justify-self: center; border: .3mm dashed #c4b5fd; border-radius: 1.4mm;
  font: 600 9pt/5.2mm Fredoka; color: #db2777; text-align: center; }}
.vop .cy.none {{ border-color: transparent; }}
.vop .dg {{ height: 9.5mm; font: 500 17pt/9.5mm Fredoka; text-align: center; border-radius: 1.8mm; }}
.dg.U {{ background: #eff6ff; }} .dg.D {{ background: #fdf2f8; }} .dg.C {{ background: #f0fdf4; }}
.dg.UM {{ background: #fffbeb; }}
.dg.empty {{ background: #fff; border: .35mm solid #ddd6fe; }}
.vop .sg {{ font: 500 17pt/9.5mm Fredoka; text-align: center; color: var(--lc); }}
.vop .ln {{ grid-column: 1 / -1; height: .7mm; background: #2e1a47; border-radius: 1mm; margin: .3mm 0; }}
.vop .rs {{ height: 10mm; border: .55mm solid #a78bfa; border-radius: 2mm; background: #fff;
  font: 600 17pt/9mm Fredoka; text-align: center; color: #7c3aed; }}
.vop .rs.blank {{ border-color: transparent; }}
.strike {{ position: relative; }}
.strike::after {{ content: ""; position: absolute; left: 18%; right: 18%; top: 50%; height: .5mm; background: #e11d48;
  transform: rotate(-35deg); }}

/* hechos sueltos */
.facts {{ display: grid; gap: 2.8mm 5mm; }}
.fact {{ display: flex; align-items: center; gap: 2mm; font: 500 15pt Fredoka; white-space: nowrap; }}
.fact .q {{ min-width: 0; }}
.ans {{ display: inline-block; width: 15mm; height: 9.5mm; border: .5mm solid #c4b5fd; border-radius: 2.2mm;
  background: #fff; vertical-align: middle; }}
.ans.sm {{ width: 11mm; }}
.ans.xs {{ width: 9mm; height: 8mm; border-radius: 1.8mm; }}
.opcard.tight {{ padding: 2.5mm 2.5mm; }}
.story-page {{ display: flex; flex-direction: column; }}
.drawbox {{ flex: 1; border: .6mm dashed var(--lc); border-radius: 5mm; margin: 5mm 0 9mm; padding: 3mm 5mm; font: 500 12pt Fredoka; color: var(--lc); }}
.ans.lg {{ width: 22mm; }}
.ans.xl {{ width: 30mm; }}
.ans.fill {{ font: 600 14pt/8.5mm Fredoka; color: #7c3aed; text-align: center; }}

/* tabla de función */
table.ftab {{ border-collapse: separate; border-spacing: 1.2mm; margin: 0 auto; }}
.ftab th {{ font: 600 10.5pt Fredoka; color: var(--lc); text-align: right; padding-right: 2mm; white-space: nowrap; }}
.ftab td {{ width: 12mm; height: 10mm; border: .45mm solid #ddd6fe; border-radius: 2mm; text-align: center;
  font: 500 14pt Fredoka; }}
.ftab td.given {{ background: var(--lcl); color: var(--lc); border-color: transparent; }}

/* grupos y filas */
.groups {{ display: flex; gap: 3mm; flex-wrap: wrap; }}
.grp {{ border: .5mm dashed var(--lc); border-radius: 50%; width: 19mm; height: 19mm; display: flex; flex: none;
  flex-wrap: wrap; justify-content: center; align-content: center; gap: .6mm .3mm; font-size: 12pt; line-height: 1; padding: 2mm; }}
.array {{ display: inline-grid; gap: 1mm; font-size: 15pt; line-height: 1; }}

/* galera */
.galera {{ display: grid; grid-template-columns: auto 15mm; font: 500 17pt Fredoka; }}
.galera .dvd {{ display: flex; gap: 1mm; padding: 0 2.5mm 0 1mm; }}
.galera .dvd span {{ width: 8mm; text-align: center; }}
.galera .dvs {{ border-left: .7mm solid #2e1a47; border-bottom: .7mm solid #2e1a47; padding-left: 3mm; }}
.galera .work {{ min-height: 14mm; }}
.galera .quo {{ padding: 1.5mm 0 0 2mm; display: flex; gap: 1mm; }}
.galera .quo i {{ width: 7.5mm; height: 9mm; border: .5mm solid #a78bfa; border-radius: 2mm; display: block; }}
.galera .quo b {{ color: #7c3aed; font-weight: 600; width: 7.5mm; text-align: center; }}
.resto {{ font: 500 10.5pt Fredoka; display: flex; align-items: center; gap: 1.5mm; margin-top: 1mm; color: #5b4a75; }}
.resto i {{ width: 9mm; height: 8mm; border: .5mm solid #f0abfc; border-radius: 2mm; display: inline-block; }}

/* problemas */
.problem {{ border: .5mm solid var(--lc); border-radius: 5mm; padding: 3.5mm 4.5mm; background: #fff; }}
.problem .ptxt {{ font-size: 13.5pt; margin-bottom: 2mm; }}
.problem .work {{ height: 34mm; border-radius: 3mm;
  background-image: radial-gradient(circle, #ddd6fe .35mm, transparent .4mm); background-size: 5mm 5mm; }}
.problem .resp {{ font: 500 12.5pt Fredoka; margin-top: 2mm; display: flex; gap: 2mm; align-items: center; }}
.problem .resp .line {{ flex: 1; border-bottom: .5mm solid #a78bfa; height: 6mm; }}

/* laberinto y pixel */
.maze {{ display: grid; gap: 1.6mm; margin: 0 auto; }}
.maze div {{ border: .5mm solid #ddd6fe; border-radius: 3mm; font: 500 15pt Fredoka; display: flex;
  align-items: center; justify-content: center; background: #fff; }}
.maze div.start, .maze div.end {{ border: .8mm solid var(--lc); }}
.pix {{ display: grid; margin: 0 auto; border: .7mm solid #2e1a47; }}
.pix div {{ border: .3mm solid #a8a29e; font: 500 12.5pt Fredoka; display: flex; align-items: center;
  justify-content: center; }}
.legend {{ display: flex; gap: 4mm; justify-content: center; flex-wrap: wrap; font: 500 12pt Fredoka; }}
.legend span {{ display: inline-flex; align-items: center; gap: 1.5mm; }}
.legend i {{ width: 7mm; height: 7mm; border-radius: 2mm; display: inline-block; border: .4mm solid #2e1a47; }}

/* cadena doble */
.chain {{ display: flex; align-items: center; gap: 1.5mm; font: 500 15pt Fredoka; }}
.chain .ball {{ width: 12mm; height: 12mm; border-radius: 50%; border: .55mm solid var(--lc); display: flex;
  align-items: center; justify-content: center; background: #fff; }}
.chain .ball.given {{ background: var(--lcl); color: var(--lc); }}
.chain .arr {{ font: 500 8pt Fredoka; color: var(--lc); text-align: center; line-height: 1; }}
.chain .arr b {{ display: block; font-size: 14pt; }}

/* guardián */
.guard-top {{ display: flex; gap: 5mm; align-items: center; margin-bottom: 3mm; }}
.guard-top h1 {{ font-size: 23pt; }}
.guard-emoji {{ font-size: 40pt; line-height: 1; width: 26mm; height: 26mm; border-radius: 50%; background: var(--lcl);
  display: flex; align-items: center; justify-content: center; flex: none; }}
.spell {{ border: .8mm solid var(--lc); border-radius: 6mm; padding: 4mm 5mm; background: var(--lcl); }}
.codebox {{ display: flex; gap: 5mm; align-items: center; justify-content: center; margin-top: 3mm;
  font: 600 12pt Fredoka; }}
.codebox .k {{ width: 30mm; height: 13mm; border: .6mm solid var(--lc); background: #fff; border-radius: 3mm; }}
.codebox .l {{ width: 15mm; height: 15mm; border: .8mm solid #db2777; background: #fff; border-radius: 3mm; }}
.seal {{ display: flex; gap: 6mm; align-items: center; }}
.sign {{ flex: 1; border-bottom: .4mm solid #8b7aa8; height: 8mm; }}
.check {{ display: inline-block; width: 6mm; height: 6mm; border: .45mm solid var(--lc); border-radius: 1.5mm;
  vertical-align: middle; margin-left: 1mm; }}
.score {{ font: 600 13pt Fredoka; color: var(--lc); }}

/* mapa de las tablas */
table.mt {{ border-collapse: collapse; margin: 0 auto; }}
.mt td, .mt th {{ width: 14.2mm; height: 14.2mm; border: .35mm solid #c4b5fd; text-align: center;
  font: 500 13pt Fredoka; }}
.mt th {{ background: var(--lc); color: #fff; font-weight: 600; }}
.mt th.corner {{ background: #2e1a47; }}
.mt td.dia {{ background: #fdf4ff; }}

/* cartas */
.cards {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; }}
.card {{ height: 46mm; border: .35mm dashed #8b7aa8; display: grid; grid-template-columns: 1fr 1fr; }}
.card > div {{ display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2mm 3mm;
  text-align: center; }}
.card .front {{ border-right: .45mm dashed #c026d3; }}
.card .q1 {{ font: 600 22pt Fredoka; color: #2e1a47; }}
.card .q2 {{ font: 500 11pt Fredoka; color: #8b7aa8; }}
.card .a1 {{ font: 700 26pt Fredoka; color: #7c3aed; }}
.card .hint {{ font-size: 9.5pt; line-height: 1.25; color: #5b4a75; margin-top: 1mm; }}

/* tablero */
.board {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; }}
.sq {{ position: relative; height: 26mm; border-radius: 4mm; border: .6mm solid #c4b5fd; display: flex;
  flex-direction: column; align-items: center; justify-content: center; font: 600 14pt Fredoka; background: #fff; }}
.sq .n {{ position: absolute; top: 1mm; left: 2mm; font: 500 8pt Fredoka; color: #8b7aa8; }}
.sq .sp {{ font: 500 8.5pt Fredoka; text-align: center; line-height: 1.15; padding: 0 1mm; }}

/* pergamino */
.decoder {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }}
.dc {{ display: flex; justify-content: space-between; align-items: center; border: .5mm solid #e9d5ff;
  border-radius: 3mm; padding: 2mm 4mm; font: 500 15pt Fredoka; background: #fffdf7; }}
.dc b {{ font: 700 17pt Fredoka; color: #db2777; }}

/* solucionario */
.sol {{ font-size: 10.2pt; line-height: 1.35; columns: 2; column-gap: 8mm; }}
.sol .it {{ break-inside: avoid; margin-bottom: 2.4mm; }}
.sol .it b {{ font-family: Fredoka; font-weight: 600; color: #7c3aed; }}

/* guía */
.guide p, .guide li {{ font-size: 11pt; line-height: 1.4; }}
.guide ul {{ margin: 0 0 2mm; padding-left: 5mm; }}
.guide li {{ margin-bottom: 1.2mm; }}
.guide h2 {{ font-size: 14pt; margin-top: 1mm; }}
table.plan {{ width: 100%; border-collapse: separate; border-spacing: 0 1.2mm; font-size: 10.8pt; }}
.plan td {{ padding: 1.8mm 3mm; background: #f5f3ff; }}
.plan td:first-child {{ border-radius: 2.5mm 0 0 2.5mm; font: 600 10.5pt Fredoka; color: #7c3aed; white-space: nowrap; }}
.plan td:last-child {{ border-radius: 0 2.5mm 2.5mm 0; }}

/* diploma */
.diploma {{ position: absolute; inset: 10mm; border: 3mm double #a855f7; border-radius: 8mm; padding: 14mm 14mm;
  text-align: center; display: flex; flex-direction: column; align-items: center; }}
"""


def page(body, lc="#7c3aed", lcl="#ede9fe", tag=None, num=None, done_star=False, extra_cls=""):
    head = ""
    if tag:
        head = f'<div class="phead"><span class="tag">{tag}</span>{gem(lc, lcl, "9mm")}</div>'
    foot = ""
    if num is not None:
        left = ""
        if done_star:
            left = (f'<span class="done">{star("7mm")}<span>¿Has terminado la página? '
                    f'¡Colorea la estrella!</span></span>')
        foot = f'<div class="pfoot">{left or "<span></span>"}<span class="pnum">{num}</span></div>'
    return (f'<section class="page {extra_cls}" style="--lc:{lc};--lcl:{lcl}">'
            f'{head}{body}{foot}</section>')


def sec(n, title, instr="", body=""):
    i = f'<div class="sec-i">{instr}</div>' if instr else ""
    return (f'<div class="sec"><div class="sec-h"><span class="sec-n">Prueba {n}</span>'
            f'<span class="sec-t">{title}</span></div>{i}{body}</div>')


def lumi(text, w="17mm"):
    return f'<div class="lumi">{unicorn(w)}<div class="bubble">{text}</div></div>'


PLACES = ["U", "D", "C", "UM"]


def vop(kind, a, b, label="", solved=False, empty=False, carries=None, cols=None, borrow=None):
    """Operación en columna. kind in '+', '-', 'x'.
    carries: dict col_index_from_right -> texto (para ejemplos resueltos).
    borrow: dict col_index_from_right -> (nuevo_valor_arriba) para restas resueltas."""
    sa, sb = str(a), str(b)
    if kind == "+":
        res = a + b
        cols = cols or (4 if max(len(sa), len(sb)) <= 4 else 5)
    elif kind == "-":
        res = a - b
        cols = cols or len(sa)
    else:
        res = a * b
        cols = cols or 3
    sr = str(res)
    sign = {"+": "+", "-": "−", "x": "×"}[kind]
    places = PLACES[:cols][::-1]
    cells = ['<span></span>'] + [f'<span class="lab {p}">{p}</span>' for p in places]
    # fila de llevadas
    cells.append('<span></span>')
    for i in range(cols):
        ci = cols - 1 - i  # índice desde la derecha
        txt = ""
        if solved and carries and ci in carries:
            txt = carries[ci]
        if solved and borrow and ci in borrow:
            txt = borrow[ci]
        cls = "cy"
        if kind == "-" and not solved:
            cls = "cy"
        if kind == "x" and ci != 1:
            cls = "cy none"
        if kind == "+" and ci == 0:
            cls = "cy none"
        if solved and not txt:
            cls = "cy none"
        cells.append(f'<span class="{cls}">{txt}</span>')

    def digit_row(s, signch=""):
        out = [f'<span class="sg">{signch}</span>']
        pad = cols - len(s)
        for i in range(cols):
            p = places[i]
            if empty:
                out.append(f'<span class="dg empty"></span>')
            elif i < pad:
                out.append(f'<span class="dg"></span>')
            else:
                d = s[i - pad]
                ci = cols - 1 - i
                extra = " strike" if (solved and borrow and ci in borrow) and signch == "" else ""
                out.append(f'<span class="dg {p}{extra}">{d}</span>')
        return out

    cells += digit_row(sa)
    cells += digit_row(sb, sign)
    cells.append('<span class="ln"></span>')
    cells.append('<span></span>')
    pad = cols - len(sr)
    for i in range(cols):
        if solved:
            if i < pad:
                cells.append('<span class="rs blank"></span>')
            else:
                cells.append(f'<span class="rs">{sr[i - pad]}</span>')
        else:
            cells.append('<span class="rs"></span>')
    lbl = f'<span class="lbl">{label}</span>' if label else ""
    tight = " tight" if kind == "x" else ""
    return (f'<div class="opcard{tight}">{lbl}<div class="vop" style="--cols:{cols}">{"".join(cells)}</div></div>'), res


def galera(dividend, divisor, label="", solved=False, qcells=None):
    q, r = divmod(dividend, divisor)
    nq = qcells or len(str(q))
    ds = "".join(f"<span>{d}</span>" for d in str(dividend))
    if solved:
        qs = "".join(f"<b>{d}</b>" for d in str(q))
    else:
        qs = "<i></i>" * nq
    lbl = f'<span class="lbl">{label}</span>' if label else ""
    resto_val = f'<b style="color:#c026d3">{r}</b>' if solved else "<i></i>"
    return (f'<div class="opcard tight">{lbl}<div class="galera"><div class="dvd">{ds}</div>'
            f'<div class="dvs">{divisor}</div><div class="work"></div><div class="quo">{qs}</div></div>'
            f'<div class="resto">Resto: {resto_val}</div></div>'), (q, r)


def fact(q, w=""):
    return f'<div class="fact"><span class="q">{q}</span><span class="ans {w}"></span></div>'


def facts_grid(items, cols=3, w=""):
    return (f'<div class="facts" style="grid-template-columns:repeat({cols},1fr)">'
            + "".join(fact(q, w) for q in items) + "</div>")


def blank(w=""):
    return f'<span class="ans {w}"></span>'


def necklace(values, show, lc, lcl, width=180, r=6.3):
    """Collar de cuentas: values lista de números; show = índices visibles."""
    n = len(values)
    h = 30
    pts = []
    for i in range(n):
        t = i / (n - 1)
        x = 8 + t * (width - 16)
        y = 8 + 13 * math.sin(math.pi * t)
        pts.append((x, y))
    path = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    beads = ""
    for i, (x, y) in enumerate(pts):
        given = i in show
        fill = lcl if given else "#fff"
        txt = (f'<text x="{x:.1f}" y="{y + 2.2:.1f}" text-anchor="middle" font-family="Fredoka" '
               f'font-weight="600" font-size="6" fill="{lc}">{values[i]}</text>') if given else ""
        beads += (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{lc}" stroke-width=".55"/>{txt}')
    return (f'<svg style="width:{width}mm;height:{h}mm" viewBox="0 0 {width} {h}">'
            f'<path d="{path}" fill="none" stroke="#c4b5fd" stroke-width=".6" stroke-dasharray="1.2 1"/>{beads}</svg>')


def wheel(n, nums, lc, lcl, size=78):
    """Rueda de multiplicar: centro ×n, anillo con números, huecos fuera."""
    c = 50
    k = len(nums)
    s = ""
    for i, v in enumerate(nums):
        a = -math.pi / 2 + i * 2 * math.pi / k
        x1, y1 = c + 16 * math.cos(a), c + 16 * math.sin(a)
        x2, y2 = c + 41 * math.cos(a), c + 41 * math.sin(a)
        s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#ddd6fe" stroke-width=".8"/>'
    s += f'<circle cx="{c}" cy="{c}" r="30" fill="{lcl}" stroke="{lc}" stroke-width=".8"/>'
    for i, v in enumerate(nums):
        a = -math.pi / 2 + i * 2 * math.pi / k
        x, y = c + 23.5 * math.cos(a), c + 23.5 * math.sin(a)
        s += (f'<text x="{x:.1f}" y="{y + 2.4:.1f}" text-anchor="middle" font-family="Fredoka" font-weight="600" '
              f'font-size="7" fill="#2e1a47">{v}</text>')
        x, y = c + 41 * math.cos(a), c + 41 * math.sin(a)
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7.2" fill="#fff" stroke="{lc}" stroke-width=".7"/>'
    s += (f'<circle cx="{c}" cy="{c}" r="14" fill="{lc}"/>'
          f'<text x="{c}" y="{c + 4}" text-anchor="middle" font-family="Fredoka" font-weight="700" '
          f'font-size="11" fill="#fff">×{n}</text>')
    return f'<svg style="width:{size}mm;height:{size}mm" viewBox="0 0 100 100">{s}</svg>'


def maze(n, rng, lc, rows=6, cols=6, cell=21):
    # camino monótono derecha/abajo
    path = [(0, 0)]
    r = c = 0
    while (r, c) != (rows - 1, cols - 1):
        if r == rows - 1:
            c += 1
        elif c == cols - 1:
            r += 1
        elif rng.random() < .5:
            c += 1
        else:
            r += 1
        path.append((r, c))
    multiples = [n * k for k in range(1, 11)]
    non = [x for x in range(n + 1, n * 10) if x % n != 0]
    grid = {}
    last = None
    for p in path:
        v = rng.choice(multiples)
        while v == last:
            v = rng.choice(multiples)
        grid[p] = v
        last = v
    for rr in range(rows):
        for cc in range(cols):
            if (rr, cc) not in grid:
                grid[(rr, cc)] = rng.choice(non)
    cells = ""
    for rr in range(rows):
        for cc in range(cols):
            cls = ""
            if (rr, cc) == (0, 0):
                cls = "start"
            if (rr, cc) == (rows - 1, cols - 1):
                cls = "end"
            cells += f'<div class="{cls}">{grid[(rr, cc)]}</div>'
    html = (f'<div class="maze" style="grid-template-columns:repeat({cols},{cell}mm);'
            f'grid-auto-rows:{cell * .72:.1f}mm;width:max-content">{cells}</div>')
    return html, [grid[p] for p in path]


def ftable(top_label, bot_label, n, given_idx):
    th = f'<tr><th>{top_label}</th>' + "".join(f'<td class="given">{k}</td>' for k in range(1, 11)) + "</tr>"
    bh = f'<tr><th>{bot_label}</th>'
    for k in range(1, 11):
        if k in given_idx:
            bh += f'<td class="given">{n * k}</td>'
        else:
            bh += '<td></td>'
    bh += "</tr>"
    return f'<table class="ftab">{th}{bh}</table>', [n * k for k in range(1, 11) if k not in given_idx]


def chain(start, steps=3):
    out = f'<div class="chain"><span class="ball given">{start}</span>'
    for _ in range(steps):
        out += '<span class="arr">doble<b>→</b></span><span class="ball"></span>'
    out += "</div>"
    vals = []
    v = start
    for _ in range(steps):
        v *= 2
        vals.append(v)
    return out, vals


def problem(text, resp="Respuesta:", h=34):
    return (f'<div class="problem"><div class="ptxt">{text}</div><div class="work" style="height:{h}mm"></div>'
            f'<div class="resp"><b>{resp}</b><span class="line"></span></div></div>')
