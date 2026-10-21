import random
import math
from art import unicorn, gem, star, sparkle, borron, castle, chest, INK
from comp import (CSS, page, sec, lumi, vop, galera, fact, facts_grid, blank, necklace, wheel, maze,
                  ftable, chain, problem)

rng = random.Random(8)

LV = {
    1: dict(name="El Bosque de los Grupos", short="Bosque", lc="#15803d", lcl="#dcfce7", em="🦉",
            guard="el Búho Sabio", crystal="verde"),
    2: dict(name="El Río de las Sumas", short="Río", lc="#2563eb", lcl="#dbeafe", em="🐸",
            guard="la Rana Saltarina", crystal="azul"),
    3: dict(name="La Cueva del Seis", short="Cueva", lc="#dc2626", lcl="#fee2e2", em="🐞",
            guard="la Reina Mariquita", crystal="rojo"),
    4: dict(name="La Montaña de las Restas", short="Montaña", lc="#0e7490", lcl="#cffafe", em="🐻‍❄️",
            guard="la osa Nieve", crystal="celeste"),
    5: dict(name="El Lago del Ocho", short="Lago", lc="#7c3aed", lcl="#ede9fe", em="🐙",
            guard="el pulpo Octavio", crystal="violeta"),
    6: dict(name="El Jardín del Arcoíris", short="Jardín", lc="#c026d3", lcl="#fae8ff", em="🧚",
            guard="el Hada Iris", crystal="rosa"),
    7: dict(name="La Forja del Dragón", short="Forja", lc="#ea580c", lcl="#ffedd5", em="🐉",
            guard="la dragona Chispa", crystal="naranja"),
    8: dict(name="El Castillo del Reparto", short="Castillo", lc="#a16207", lcl="#fef9c3", em="👸",
            guard="la Reina Aurora", crystal="dorado"),
}

CODE = {1: (35, "V"), 2: (3843, "A"), 3: (42, "L"), 4: (3154, "I"), 5: (56, "E"), 6: (49, "N"),
        7: (282, "T"), 8: (21, "E")}
DECOYS = {17: "R", 19: "U", 23: "O", 29: "S", 31: "M", 37: "C", 41: "P", 53: "B", 193: "F", 317: "G",
          2965: "D", 4721: "H"}

pages = []
SOL = []  # (page, titulo, texto)
START = {}


def add(body, level=None, tag=None, star_=False, lc=None, lcl=None, numbered=True, cls=""):
    n = len(pages) + 1
    if level:
        L = LV[level]
        lc, lcl = L["lc"], L["lcl"]
        if tag is None:
            tag = f'{L["em"]} Nivel {level} · {L["name"]}'
    pages.append(page(body, lc or "#7c3aed", lcl or "#ede9fe", tag, n if numbered else None, star_, cls))
    return n


def sol(p, title, items):
    if isinstance(items, (list, tuple)):
        txt = " · ".join(items)
    else:
        txt = items
    SOL.append((p, title, txt))


def letters(seq):
    return [chr(ord("a") + i) for i in range(seq)]


def nf(x):
    return str(x)


# ---------------------------------------------------------------- PORTADA
gems_row = "".join(gem(LV[i]["lc"], LV[i]["lcl"], "13mm") for i in range(1, 9))
cover = f'''
<div style="position:absolute;inset:0;overflow:hidden">
  <div style="position:absolute;width:150mm;height:150mm;border-radius:50%;background:#faf5ff;left:30mm;top:62mm"></div>
  <div style="position:absolute;left:22mm;top:70mm">{sparkle("9mm", "#f472b6")}</div>
  <div style="position:absolute;left:170mm;top:95mm">{sparkle("11mm", "#a78bfa")}</div>
  <div style="position:absolute;left:40mm;top:190mm">{sparkle("7mm", "#60a5fa")}</div>
  <div style="position:absolute;left:160mm;top:185mm">{sparkle("8mm", "#fbbf24")}</div>
  <div style="position:absolute;left:150mm;top:66mm">{sparkle("6mm", "#34d399")}</div>
</div>
<div style="position:relative;text-align:center;padding-top:6mm">
  <div class="kicker" style="color:#a21caf">Un libro de aventuras matemáticas</div>
  <div style="font:700 60pt/1 Fredoka;color:#7c3aed;margin-top:5mm">Inessa</div>
  <div style="font:600 25pt/1.15 Fredoka;color:#c026d3;margin-top:2mm">y la Magia de los Números</div>
  <div style="margin:9mm auto 0;width:104mm">{unicorn("104mm")}</div>
  <div style="display:flex;justify-content:center;gap:3mm;margin-top:7mm">{gems_row}</div>
  <div style="font:500 15pt/1.35 Fredoka;color:#2e1a47;margin-top:6mm">Encuentra los <b style="color:#c026d3">8 cristales mágicos</b> de Numeria<br>y abre el <b style="color:#7c3aed">Gran Cofre</b></div>
  <div style="margin:8mm auto 0;width:150mm;border:.6mm dashed #c4b5fd;border-radius:5mm;padding:4mm 5mm;font:500 13pt Fredoka;display:flex;gap:3mm;align-items:center">
    <span style="white-space:nowrap">Aprendiz de maga:</span><span style="flex:1;border-bottom:.5mm solid #c4b5fd;height:8mm"></span>
  </div>
  <div class="muted" style="margin-top:2mm">(escribe aquí tu nombre)</div>
</div>'''
add(cover, numbered=False)

# ---------------------------------------------------------------- GUÍA (2 págs)
guide1 = '''
<div class="guide">
<div class="kicker">Para papá o mamá · Léelo antes de empezar</div>
<h1 style="color:#7c3aed">Cómo usar este cuaderno</h1>
<h2>Lo que le pasa a Inessa (y por qué tiene solución)</h2>
<p>Es muy habitual a los 7-8 años. Las sumas y restas largas dependen de entender «las casas» de los números
(unidades, decenas, centenas…) y de no perderse con las llevadas. Las multiplicaciones y divisiones dependen casi
por completo de las tablas: si cada 7 × 8 le cuesta un esfuerzo enorme, su cabeza se satura y se equivoca en todo
lo demás. Por eso el cuaderno ataca primero las tablas, pero <b>no a base de memorizar de carrerilla</b>: primero
entiende qué es multiplicar, después aprende trucos para encontrar cada resultado y, por último, practica hasta que
le sale solo.</p>
<h2>La buena noticia: no son 100 resultados</h2>
<p>Con la <b>regla del espejo</b> (3 × 7 = 7 × 3) y las tablas fáciles (×1, ×2, ×5 y ×10), las tablas del 6, 7 y 8 se
quedan en muy pocos resultados realmente nuevos: 6×3, 6×4, 6×6, 6×7, 6×8, 6×9, 7×3, 7×4, 7×7, 7×8, 7×9, 8×3, 8×4,
8×8 y 8×9. Cada uno tiene su truco en el cuaderno y en las cartas mágicas.</p>
<h2>Cómo funciona el juego</h2>
<ul>
<li><b>8 niveles = 8 cristales</b> (uno por cada año que va a cumplir). Cada nivel tiene: una historia corta que
<b>ella lee en voz alta</b> (así practica también la lectura), una lección con los trucos de Lumi, unas páginas de
prácticas y el <b>Desafío del Guardián</b>.</li>
<li>Al superar cada Desafío consigue su cristal (lo colorea en el mapa) y una <b>letra secreta</b>: el resultado
del «Hechizo del Cristal» se busca en el <b>Pergamino del Código</b>. Si su número no aparece en el pergamino,
sabe que tiene que revisar: el propio juego le corrige.</li>
<li>Cada página de ejercicios tiene una estrella para colorear al terminarla.</li>
<li>Con las 8 letras se forma la palabra que abre el Gran Cofre.</li>
</ul>
<h2>El premio: el Gran Cofre de Numeria</h2>
<p>Prepara una caja o un sobre grande cerrado con el <b>diploma</b> (página %%DIP%%) y la <b>sorpresa</b>. Déjalo a la
vista desde el primer día: verlo cada tarde motiva muchísimo. La palabra secreta es <b>VALIENTE</b>
(¡no se la digas!). Cuando la diga en voz alta, abrid el cofre juntos. Ideas de sorpresa: un plan especial contigo,
un libro, unas pegatinas de unicornio, elegir la cena del sábado…</p>
<h2>Qué vas a necesitar</h2>
<p>Lápiz, goma, lápices de colores, tijeras y pegamento (cartas y juego), un dado y un cronómetro (el del móvil
vale). Puedes imprimir en blanco y negro: todo se entiende igual.</p>
<h2>Dónde está cada cosa</h2>
<table class="plan">
<tr><td>Empezar</td><td>Carta de Lumi (pág. %%CARTA%%), mapa (pág. %%MAPA%%) y Pergamino del Código (pág. %%PERG%%)</td></tr>
<tr><td>Niveles</td><td>1: pág. %%L1%% · 2: pág. %%L2%% · 3: pág. %%L3%% · 4: pág. %%L4%% · 5: pág. %%L5%% · 6: pág. %%L6%% · 7: pág. %%L7%% · 8: pág. %%L8%%</td></tr>
<tr><td>Final</td><td>Gran Final (pág. %%FIN%%), mapa de las tablas final (pág. %%MTF%%) y diploma (pág. %%DIP%%)</td></tr>
<tr><td>Material</td><td>Cartas mágicas (pág. %%CART%%), tablero «Carrera al Castillo» (pág. %%TAB%%) y soluciones (pág. %%SOL%%)</td></tr>
</table>
</div>'''
add(guide1, lc="#7c3aed", lcl="#ede9fe", tag="📘 Guía para la familia")

guide2 = '''
<div class="guide">
<h2>El plan: 15 minutos al día, 4 semanas</h2>
<table class="plan">
<tr><td>Semana 1</td><td>Nivel 1 (qué es multiplicar, tablas fáciles, regla del espejo) y Nivel 2 (sumas de 3 y 4 cifras)</td></tr>
<tr><td>Semana 2</td><td>Nivel 3 (tabla del 6) y Nivel 4 (restas de 3 y 4 cifras)</td></tr>
<tr><td>Semana 3</td><td>Nivel 5 (tabla del 8) y Nivel 6 (tabla del 7 + mezcla 6-7-8)</td></tr>
<tr><td>Semana 4</td><td>Nivel 7 (2 cifras × 1 cifra), Nivel 8 (dividir) y Gran Final</td></tr>
</table>
<p style="margin-top:2mm">Cada nivel dura unos 3 días: <b>día 1</b> historia + lección, <b>día 2</b> prácticas,
<b>día 3</b> Desafío del Guardián. Si un nivel cuesta más, se alarga: el ritmo lo marca ella, no el calendario.
<b>Truco:</b> imprime un nivel cada vez y dáselo en un sobre, como si fuera una carta de Lumi.</p>
<h2>Cada sesión</h2>
<p><b>2 min</b> de calentamiento oral con las cartas mágicas → <b>10 min</b> de cuaderno → <b>3 min</b> de juego
(tablero o cartas). Parad siempre <b>cuando todavía tiene ganas</b>: mejor quedarse con hambre que acabar llorando.</p>
<h2>10 consejos de maestra</h2>
<ul>
<li><b>Elogia el esfuerzo y la estrategia</b>, no la inteligencia: «¡qué bien has usado el truco del doble!» funciona mejor que «¡qué lista!».</li>
<li><b>Los errores son pistas.</b> Antes de corregir, pregunta «¿cómo lo has pensado?». Muchas veces se corrige sola al explicarlo.</li>
<li><b>Sin prisas.</b> El cronómetro, solo cuando ya domina una tabla, y siempre contra sí misma.</li>
<li><b>En voz alta y con la frase entera</b>: «seis por siete, cuarenta y dos». Oírse ayuda a memorizar.</li>
<li><b>Poco y a menudo</b>: 2 o 3 resultados nuevos al día, mezclados con otros que ya sabe.</li>
<li><b>Cartas en 3 montones</b> (Lo sé · Casi · Todavía no): «Todavía no» se repasa cada día; «Lo sé», una vez por semana.</li>
<li><b>Con objetos</b>: lentejas, botones o piezas de Lego para hacer grupos y repartos. Tocar ayuda a entender.</li>
<li><b>En la vida real</b>: «¿cuántas ruedas tienen 7 coches?», «si repartimos 24 galletas entre 4…».</li>
<li><b>Que te enseñe ella</b>: explicar es la mejor forma de aprender. En el tablero, equivócate alguna vez a propósito para que te corrija.</li>
<li><b>Si en el cole lo hacen de otra forma</b> (la resta «llevando», la colocación de la división…), usad la del cole: el resultado es el mismo y no queremos liarla.</li>
</ul>
<div class="soft" style="margin-top:3mm;background:#f5f3ff"><p style="margin:0"><b>¿Cuándo consultar?</b> Si tras varias semanas de práctica constante sigue con
dificultades muy grandes (contar hacia atrás, comparar números, olvidar enseguida lo que ya sabía), coméntalo con su
tutor o tutora. A veces hay dificultades específicas, como la discalculia, que se trabajan mejor con apoyo.</p></div>
</div>'''
add(guide2, lc="#7c3aed", lcl="#ede9fe", tag="📘 Guía para la familia")

# ---------------------------------------------------------------- CARTA DE LUMI
letter = f'''
<div style="background:#fffbeb;border:.8mm solid #fcd34d;border-radius:7mm;padding:6mm 9mm 4mm">
 <div style="display:flex;justify-content:space-between;align-items:center">
  <div><div class="kicker" style="color:#b45309">Una carta mágica ha llegado para ti</div>
  <h1 style="color:#a21caf;margin-top:2mm">Querida Inessa:</h1></div>
  <div style="width:30mm">{unicorn("30mm")}</div>
 </div>
 <div class="story letter">
 <p>Me llamo <b>Lumi</b> y soy el unicornio guardián del Reino de <b>Numeria</b>. Aquí los números son mágicos:
 hacen crecer las flores, encienden las estrellas y pintan el arcoíris.</p>
 <p>Pero anoche, el travieso <b>Borrón</b> sopló su Niebla del Olvido y… ¡todo el reino se olvidó de los números!
 Mi cuerno se ha apagado.</p>
 <p>Para devolverle la luz necesito <b>8 cristales mágicos</b> escondidos en 8 lugares del reino. Dicen que solo
 una niña valiente, que está a punto de cumplir 8 años, puede encontrarlos. ¿Eres tú?</p>
 <p>Si consigues los 8 cristales y descubres la <b>palabra secreta</b>, se abrirá el Gran Cofre de Numeria.
 Dentro hay una sorpresa solo para ti.</p>
 <p>Y recuerda: en Numeria <b>los errores no son malos, son pistas</b>.</p>
 <p style="text-align:right;font-family:Fredoka;font-weight:600;color:#a21caf">Tu amiga, Lumi 🦄</p>
 </div>
</div>
<div class="box" style="margin-top:5mm;border-color:#a855f7;padding:3.5mm 5mm">
 <h2 style="color:#7c3aed">✨ Pacto de la aprendiz de maga</h2>
 <p style="font-size:13.5pt">Yo, <b>Inessa</b>, prometo:</p>
 <div style="font-size:13.5pt;line-height:1.85">
 <div><span class="check"></span>&nbsp; Intentarlo aunque al principio parezca difícil.</div>
 <div><span class="check"></span>&nbsp; Preguntar cuando no entienda algo.</div>
 <div><span class="check"></span>&nbsp; Ver los errores como pistas para aprender.</div>
 <div><span class="check"></span>&nbsp; ¡Divertirme muchísimo!</div>
 </div>
 <div class="seal" style="margin-top:3mm;font:500 12pt Fredoka"><span>Firma:</span><span class="sign"></span><span>Fecha:</span><span class="sign" style="flex:.6"></span></div>
</div>'''
P_CARTA = add(letter, lc="#a21caf", lcl="#fae8ff", tag="💌 El comienzo")

# ---------------------------------------------------------------- MAPA


def catmull(points):
    d = f"M{points[0][0]} {points[0][1]}"
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i > 0 else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < len(points) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}"
    return d


def gem_at(x, y, s, color):
    return (f'<svg x="{x - s / 2}" y="{y - s / 2}" width="{s}" height="{s}" viewBox="0 0 100 100">'
            f'<polygon points="25,10 75,10 95,35 50,92 5,35" fill="#fff" stroke="{color}" stroke-width="6" '
            f'stroke-linejoin="round"/><g fill="none" stroke="{color}" stroke-width="4"><polyline points="5,35 95,35"/>'
            f'<polyline points="25,10 35,35 50,10 65,35 75,10"/><polyline points="35,35 50,92 65,35"/></g></svg>')


stations = [(22, 186), (50, 160), (112, 172), (160, 140), (116, 114), (40, 106), (30, 62), (96, 66), (152, 44), (92, 16)]
mp = f'<path d="{catmull(stations)}" fill="none" stroke="#e9d5ff" stroke-width="7" stroke-linecap="round"/>'
mp += f'<path d="{catmull(stations)}" fill="none" stroke="#a78bfa" stroke-width="1" stroke-dasharray="2.5 2.5"/>'
mp += (f'<text x="22" y="196" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="4.6" '
       f'fill="#7c3aed">Tu casa</text><text x="22" y="189" text-anchor="middle" font-size="10">🏠</text>')
for i in range(1, 9):
    x, y = stations[i]
    L = LV[i]
    mp += f'<circle cx="{x}" cy="{y}" r="11" fill="{L["lcl"]}" stroke="{L["lc"]}" stroke-width="1"/>'
    mp += f'<text x="{x}" y="{y + 3.8}" text-anchor="middle" font-size="11">{L["em"]}</text>'
    mp += (f'<circle cx="{x - 9}" cy="{y - 9}" r="4" fill="{L["lc"]}"/><text x="{x - 9}" y="{y - 7.4}" '
           f'text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="4.6" fill="#fff">{i}</text>')
    mp += (f'<text x="{x}" y="{y + 16.5}" text-anchor="middle" font-family="Fredoka" font-weight="600" '
           f'font-size="4.3" fill="{L["lc"]}">{L["name"]}</text>')
    mp += gem_at(x + 15, y - 2, 11, L["lc"])
x, y = stations[9]
mp += f'<circle cx="{x}" cy="{y}" r="12" fill="#faf5ff" stroke="#7c3aed" stroke-width="1.2"/>'
mp += f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-size="12">🎁</text>'
mp += (f'<text x="{x + 16}" y="{y + 1.5}" font-family="Fredoka" font-weight="700" font-size="5.5" '
       f'fill="#7c3aed">El Gran Cofre</text>')
mapsvg = f'<svg style="width:182mm;height:200mm" viewBox="0 0 182 200">{mp}</svg>'
word_boxes = "".join(
    f'<div style="text-align:center"><div style="width:15mm;height:15mm;border:.7mm solid {LV[i]["lc"]};'
    f'border-radius:3mm;background:#fff"></div><div style="font:600 9pt Fredoka;color:{LV[i]["lc"]};'
    f'margin-top:1mm">{i}</div></div>' for i in range(1, 9))
mapa = f'''
<h1 style="margin-bottom:1mm">El mapa de Numeria</h1>
<p style="font-size:12.5pt">Cada vez que venzas a un guardián, <b>colorea su cristal</b> en el mapa
y escribe <b>su letra secreta</b> abajo. ¡Con las 8 letras se abre el Gran Cofre!</p>
{mapsvg}
<div style="display:flex;align-items:center;gap:4mm;justify-content:center;margin-top:1mm">
 <span style="font:600 13pt Fredoka;color:#7c3aed">Palabra secreta:</span>{word_boxes}
</div>'''
P_MAPA = add(mapa, tag="🗺️ El mapa", lc="#7c3aed", lcl="#ede9fe")

# ---------------------------------------------------------------- PERGAMINO
entries = {v[0]: v[1] for v in CODE.values()}
entries.update(DECOYS)
dec = "".join(f'<div class="dc"><span>{k}</span><b>{v}</b></div>' for k, v in sorted(entries.items()))
perg = f'''
<div style="display:flex;gap:6mm;align-items:center">
 <div style="flex:1">
  <h1>El Pergamino del Código Secreto</h1>
  <p style="font-size:13.5pt">Cuando resuelvas el <b>Hechizo del Cristal</b> de cada guardián, busca tu número en el
  pergamino. ¡A su lado está tu letra secreta!</p>
 </div>
 <div style="width:40mm">{unicorn("40mm")}</div>
</div>
<div style="background:#fffbeb;border:.8mm solid #fcd34d;border-radius:7mm;padding:7mm 7mm;margin-top:3mm">
 <div class="decoder">{dec}</div>
</div>
<div class="row" style="margin-top:7mm;align-items:center">
 <div style="width:42mm">{borron("42mm")}</div>
 <div class="lumi" style="flex:1;margin:0"><div class="bubble" style="font-size:13pt;background:#f3f4f6;border-color:#9ca3af">
 <b style="color:#4b5563">¡Cuidado!</b> Borrón ha escondido <b style="color:#4b5563">letras falsas</b> para despistarte.
 Si tu número <b style="color:#4b5563">no aparece</b> en el pergamino, ¡ups! Algo se ha escapado:
 revisa la operación con calma y vuelve a intentarlo. Los errores son pistas.</div></div>
</div>
<div class="box" style="margin-top:6mm;border-color:#a855f7">
 <h2 style="color:#7c3aed">Cómo se juega</h2>
 <div style="font-size:13pt;line-height:1.65">
 1. Lee la historia de cada lugar del mapa.<br>
 2. Aprende los trucos de Lumi.<br>
 3. Supera las pruebas y colorea la estrella de cada página.<br>
 4. Vence el Desafío del Guardián: ganarás un cristal y una letra secreta.<br>
 5. Con las 8 letras… ¡se abre el Gran Cofre!
 </div>
</div>'''
P_PERG = add(perg, tag="📜 El código secreto", lc="#b45309", lcl="#fef3c7")


# ---------------------------------------------------------------- helpers de nivel
DRAW = {1: "Dibuja a las hadas jardineras con sus grupos de setas.",
        2: "Dibuja el puente de piedras mágicas y a la Rana Saltarina.",
        3: "Dibuja la Cueva de Cristal llena de mariquitas luminosas.",
        4: "Dibuja a Nieve en la cima de la montaña con su chocolate caliente.",
        5: "Dibuja a Octavio sujetando 8 cosas con sus 8 tentáculos.",
        6: "Dibuja el Jardín del Arcoíris con sus 7 colores.",
        7: "Dibuja a Chispa trabajando en su forja del volcán.",
        8: "Dibuja el castillo y los tesoros de la Reina Aurora."}


def story_page(lv, paragraphs, mission):
    L = LV[lv]
    body = f'''
<div style="display:flex;gap:6mm;align-items:center;margin-bottom:5mm">
 <div style="flex:1">
  <div class="kicker">Capítulo {lv}</div>
  <h1 style="font-size:30pt">{L["name"]}</h1>
 </div>
 <div class="guard-emoji" style="width:36mm;height:36mm;font-size:56pt">{L["em"]}</div>
</div>
<div class="story">{"".join(f"<p>{p}</p>" for p in paragraphs)}</div>
<div class="muted">📖 Lee la historia en voz alta. ¡Pon voces a los personajes!</div>
<div class="mission" style="margin-top:4mm">
 {gem(L["lc"], L["lcl"], "16mm")}
 <div style="font-size:14pt"><b>Tu misión:</b> {mission}<br>
 <span class="muted">Premio: el cristal {L["crystal"]} y una letra secreta.</span></div>
</div>
<div class="drawbox">🎨 {DRAW[lv]}</div>
'''
    START[lv] = add(body, level=lv, cls="story-page")


def guardian_page(lv, speech, items_html, spell_text, spell_html, n_items, extra_note=""):
    L = LV[lv]
    code, letter = CODE[lv]
    pass_n = n_items - 1
    body = f'''
<div class="guard-top">
 <div class="guard-emoji">{L["em"]}</div>
 <div style="flex:1">
  <div class="kicker">Desafío del guardián</div>
  <h1 style="margin-bottom:1mm">{L["guard"][0].upper() + L["guard"][1:]}</h1>
  <div style="font-size:13pt">{speech}</div>
 </div>
</div>
<div class="box" style="padding:3.5mm 5mm;margin-bottom:3.5mm">{items_html}
 <div style="text-align:right;margin-top:1.5mm" class="score">Aciertos: ______ de {n_items}</div>
</div>
<div class="spell">
 <div style="display:flex;gap:5mm;align-items:center">
  <div style="flex:1">
   <h2>🔮 El Hechizo del Cristal</h2>
   <div style="font-size:13.5pt;margin-bottom:2mm">{spell_text}</div>
   <div class="codebox"><span>Número mágico:</span><span class="k"></span><span>Letra del pergamino:</span><span class="l"></span></div>
  </div>
  {spell_html}
 </div>
</div>
<div style="display:flex;gap:5mm;align-items:center;margin-top:3.5mm">
 {gem(L["lc"], L["lcl"], "21mm", outline=True)}
 <div style="flex:1;font-size:12pt">
  <b style="font-family:Fredoka;color:{L["lc"]}">¿{pass_n} o más aciertos?</b> ¡Cristal conseguido! Colorea el cristal
  {L["crystal"]} aquí y en el mapa, y escribe tu letra.<br>
  <span class="muted">¿Menos? No pasa nada: repasa con Lumi y vuelve mañana. Los guardianes siempre dan otra oportunidad.</span>
  <div class="seal" style="margin-top:2mm;font:500 10.5pt Fredoka"><span>Firma del guardián (familia):</span><span class="sign"></span><span>Fecha:</span><span class="sign" style="flex:.5"></span></div>
 </div>
</div>{extra_note}'''
    n = add(body, level=lv, tag=f'{L["em"]} Nivel {lv} · Desafío final')
    return n


def ops_row(op_list, labels=None, gap=None):
    html = ""
    res = []
    for i, (k, a, b) in enumerate(op_list):
        lab = labels[i] if labels else ""
        h, r = vop(k, a, b, lab)
        html += h
        res.append(r)
    st = f' style="gap:{gap}"' if gap else ""
    return f'<div class="ops"{st}>{html}</div>', res


def lab_list(start, n):
    return [chr(ord("a") + start + i) for i in range(n)]


def fmt_ops(op_list, res, labels):
    sym = {"+": "+", "-": "−", "x": "×"}
    return [f"{l}) {a} {sym[k]} {b} = {r}" for l, (k, a, b), r in zip(labels, op_list, res)]


# ================================================================ NIVEL 1
story_page(1, [
    "Inessa y Lumi entraron de puntillas en el Bosque de los Grupos. Allí viven las hadas jardineras, que lo "
    "plantan todo en grupos iguales: tres setas aquí, tres setas allá…",
    "Pero la niebla de Borrón les había borrado los números, y ahora ¡no sabían cuántas setas tenían!",
    "—Si las contamos una a una, tardaremos cien años —suspiró un hada.",
    "Entonces, desde una rama, habló el Búho Sabio:",
    "—Uh, uh. Para contar grupos iguales existe un hechizo rapidísimo. Se llama <b>MULTIPLICAR</b>. "
    "Apréndelo, Inessa, y te daré el primer cristal.",
], "descubrir qué es multiplicar, el truco del espejo y las tablas fáciles.")

mush = "".join(f'<div class="grp">{"<span>🍄</span>" * 3}</div>' for _ in range(4))
def emoji_array(r, c, emo):
    return (f'<div class="array" style="grid-template-columns:repeat({c},auto)">'
            + f"<span>{emo}</span>" * (r * c) + "</div>")


arr35 = emoji_array(3, 5, "🌸")
arr53 = emoji_array(5, 3, "🌸")
lesson1 = f'''
<h1>Lección mágica: ¿qué es multiplicar?</h1>
<div class="soft">
 <h3>Multiplicar es sumar grupos iguales</h3>
 <div style="display:flex;gap:6mm;align-items:center">
  <div class="groups">{mush}</div>
  <div style="font-size:14pt;line-height:1.55">
   Hay <b>4 grupos de 3</b> setas.<br>
   <span class="num">3 + 3 + 3 + 3 = 12</span><br>
   Más rápido: <span class="big" style="color:var(--lc)">4 × 3 = 12</span><br>
   <span class="muted">Se lee: «cuatro por tres, doce».</span>
  </div>
 </div>
</div>
<div class="soft">
 <h3>🪞 El truco del espejo</h3>
 <div style="display:flex;gap:12mm;align-items:center;justify-content:center">
  <div class="center">{arr35}<div class="num" style="margin-top:1.5mm;font-size:14pt">3 filas de 5<br><b>3 × 5 = 15</b></div></div>
  <div style="font-size:28pt">↔</div>
  <div class="center">{arr53}<div class="num" style="margin-top:1.5mm;font-size:14pt">5 filas de 3<br><b>5 × 3 = 15</b></div></div>
 </div>
 <div class="center" style="font-size:13.5pt;margin-top:2mm">Si giras las flores, ¡salen las mismas! <b>El orden no cambia el resultado.</b><br>
 Si sabes 3 × 5, también sabes 5 × 3. ¡Así solo tienes que aprender la mitad!</div>
</div>
<div class="soft">
 <h3>Las tablas fáciles</h3>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 6mm;font-size:13.5pt">
  <div><b class="num" style="color:var(--lc)">× 1</b> → se queda igual: <span class="num">7 × 1 = 7</span></div>
  <div><b class="num" style="color:var(--lc)">× 2</b> → es el doble: <span class="num">2 × 8 = 8 + 8 = 16</span></div>
  <div><b class="num" style="color:var(--lc)">× 5</b> → acaban en 0 o en 5: <span class="num">5, 10, 15, 20…</span></div>
  <div><b class="num" style="color:var(--lc)">× 10</b> → pon un 0 detrás: <span class="num">10 × 6 = 60</span></div>
 </div>
</div>
{lumi("¡Con el truco del espejo y las tablas fáciles <b>ya conoces muchísimas multiplicaciones</b> sin darte cuenta! Vamos a comprobarlo.")}
'''
add(lesson1, level=1)

# práctica 1.1
def groups_item(n, k, emo, lbl):
    g = "".join(f'<div class="grp">{f"<span>{emo}</span>" * k}</div>' for _ in range(n))
    return f'''<div class="opcard" style="display:flex;gap:4mm;align-items:center;width:100%;margin-bottom:3mm">
 <span class="lbl">{lbl}</span>
 <div class="groups" style="width:106mm;flex-wrap:nowrap;gap:2.2mm">{g}</div>
 <div style="font:500 12.5pt Fredoka;line-height:2.4;white-space:nowrap">
  Suma: <span class="ans" style="width:31mm"></span> = {blank("sm")}<br>
  Multiplica: {blank("sm")} × {blank("sm")} = {blank("sm")}
 </div></div>'''


def array_item(r, c, emo, lbl):
    a = emoji_array(r, c, emo)
    return f'''<div class="opcard" style="flex:1;display:flex;gap:4mm;align-items:center;justify-content:space-around"><span class="lbl">{lbl}</span>{a}
 <div style="font:500 12.5pt Fredoka;line-height:2.4;white-space:nowrap">{blank("sm")} filas de {blank("sm")}<br>{blank("sm")} × {blank("sm")} = {blank("sm")}</div></div>'''


p11 = (sec(1, "Cuenta los grupos de las hadas", "Escribe la suma y después la multiplicación.",
           groups_item(2, 4, "🍄", "a") + groups_item(5, 2, "🍓", "b") + groups_item(3, 5, "⭐", "c"))
       + sec(2, "Filas de flores", "¿Cuántas filas hay? ¿Cuántas flores en cada fila?",
             f'<div class="row">{array_item(2, 6, "🌷", "a")}{array_item(4, 3, "🌼", "b")}</div>')
       + sec(3, "¡Dibuja tú!", "",
             f'''<div class="row"><div class="opcard" style="flex:1"><span class="lbl">a</span>Dibuja <b>3 grupos de 4</b> corazones.
<div style="height:26mm"></div><div class="fact">3 × 4 = {blank()}</div></div>
<div class="opcard" style="flex:1"><span class="lbl">b</span>Dibuja <b>2 filas de 5</b> estrellas.
<div style="height:26mm"></div><div class="fact">2 × 5 = {blank()}</div></div></div>'''))
p = add(p11, level=1, star_=True)
sol(p, "Prueba 1", ["a) 4 + 4 = 8; 2 × 4 = 8", "b) 2 + 2 + 2 + 2 + 2 = 10; 5 × 2 = 10", "c) 5 + 5 + 5 = 15; 3 × 5 = 15"])
sol(p, "Prueba 2", ["a) 2 filas de 6 → 2 × 6 = 12", "b) 4 filas de 3 → 4 × 3 = 12"])
sol(p, "Prueba 3", ["a) 12", "b) 10"])

# práctica 1.2
neck = ""
neck_sol = []
for n, show in [(2, {0, 1, 3, 6, 9}), (3, {0, 1, 4, 7}), (4, {0, 1, 4, 8}), (5, {0, 2, 5, 9})]:
    vals = [n * k for k in range(1, 11)]
    neck += (f'<div style="display:flex;align-items:center;gap:2mm"><span class="tag" style="min-width:22mm;justify-content:center;white-space:nowrap">'
             f'De {n} en {n}</span>{necklace(vals, show, LV[1]["lc"], LV[1]["lcl"], width=158)}</div>')
    neck_sol.append(f"de {n} en {n}: " + ", ".join(str(v) for i, v in enumerate(vals) if i not in show))
mirror = [(2, 8), (5, 7), (10, 4), (3, 9), (2, 6), (5, 8)]
mir = '<div class="facts" style="grid-template-columns:1fr 1fr">' + "".join(
    f'<div class="fact"><span class="muted num" style="font-size:13pt;color:#5b4a75">{a} × {b} = {a * b}</span>'
    f'<span style="color:var(--lc)">🪞→</span><span>{b} × {a} =</span>{blank()}</div>' for a, b in mirror) + "</div>"
easy = [(7, 1), (2, 7), (5, 4), (10, 3), (2, 9), (5, 9), (1, 8), (10, 8), (2, 5), (5, 6), (3, 2), (4, 5)]
p12 = (sec(4, "Los collares de las hadas", "Cuenta saltando y escribe los números que faltan en las cuentas.", neck)
       + sec(5, "El espejo mágico", "Si sabes una, ¡ya sabes la otra!", mir)
       + sec(6, "Tablas fáciles", "", facts_grid([f"{a} × {b} =" for a, b in easy], 4)))
p = add(p12, level=1, star_=True)
sol(p, "Prueba 4", neck_sol)
sol(p, "Prueba 5", [str(a * b) for a, b in mirror])
sol(p, "Prueba 6", [f"{a}×{b}={a * b}" for a, b in easy])

# práctica 1.3 mapa de las tablas


def mult_table():
    h = '<tr><th class="corner">×</th>' + "".join(f"<th>{i}</th>" for i in range(1, 11)) + "</tr>"
    for r in range(1, 11):
        h += f"<tr><th>{r}</th>" + "".join(f'<td class="{"dia" if r == c else ""}"></td>' for c in range(1, 11)) + "</tr>"
    return f'<table class="mt">{h}</table>'


p13 = f'''
<h1>El Mapa de las Tablas</h1>
<p style="font-size:13pt">Este mapa esconde las 100 multiplicaciones. Escribe <b>con lápiz</b> los resultados que
<b>ya sabes</b>. Empieza por las filas del 1, del 2, del 5 y del 10. ¡Y usa el espejo: si sabes 2 × 7, también sabes
7 × 2!</p>
{mult_table()}
{lumi("¿Ves las casillas que han quedado vacías? <b>Esas son las que vamos a conquistar</b> en esta aventura. Al final del libro hay otro mapa igual… ¡ya verás cuánto has crecido!")}
'''
p = add(p13, level=1, star_=True)
sol(p, "Mapa de las Tablas", "es un diagnóstico: anota qué filas le cuestan. Fíjate sobre todo en las del 6, 7 y 8.")

# guardián 1
g1 = ["4 × 2 =", "5 × 6 =", "10 × 7 =", "2 × 9 =", "3 × 5 =", f"5 × {blank('sm')} = 40",
      "Si 9 × 5 = 45, entonces 5 × 9 =", "3 grupos de 6 son"]
g1h = facts_grid(g1[:6], 3) + f'<div class="facts" style="grid-template-columns:1fr 1fr;margin-top:2.8mm">{fact(g1[6])}{fact(g1[7])}</div>'
p = guardian_page(1, "«Uh, uh. Demuéstrame que sabes multiplicar y el cristal verde será tuyo.»", g1h,
                  "El Búho Sabio vive en un árbol con <b>7 ramas</b>. En cada rama hay <b>5 hojas mágicas</b>. "
                  "¿Cuántas hojas hay en total?",
                  '<div style="font-size:42pt">🌳</div>', 8)
sol(p, "Desafío del Búho", ["8", "30", "70", "18", "15", "8", "45", "18", "Hechizo: 7 × 5 = 35 → V"])

# ================================================================ NIVEL 2
story_page(2, [
    "Para cruzar el Río de las Sumas hay un puente de piedras mágicas. Cada piedra tiene un número… pero la niebla "
    "las ha desordenado y, si pisas una equivocada, ¡plof!, al agua.",
    "En la orilla esperaba la Rana Saltarina, la guardiana del puente.",
    "—Croac. Las piedras solo obedecen a quien sabe sumar números grandes. Recuerda: <b>cada número vive en su casa</b>. "
    "Si lo pones en la casa equivocada, el puente se hunde.",
    "Inessa miró el agua, que brillaba muy abajo. Respiró hondo y dio el primer salto.",
], "sumar números de 3 y 4 cifras, también con llevadas.")


def houses(num):
    s = str(num)
    places = ["UM", "C", "D", "U"][-len(s):]
    cols = {"UM": ("#f59e0b", "#fef3c7", "unidades de mil"), "C": ("#22c55e", "#dcfce7", "centenas"),
            "D": ("#ec4899", "#fce7f3", "decenas"), "U": ("#3b82f6", "#dbeafe", "unidades")}
    out = '<div style="display:flex;gap:3mm;justify-content:center">'
    for d, p in zip(s, places):
        c, l, name = cols[p]
        out += f'''<div style="text-align:center;width:34mm">
<svg style="width:34mm;height:13mm" viewBox="0 0 34 13"><polygon points="2,13 17,1 32,13" fill="{c}"/></svg>
<div style="background:{l};border:.6mm solid {c};border-top:none;border-radius:0 0 3mm 3mm;padding:1mm 0 2mm">
<div style="font:600 9pt Fredoka;color:{c}">{p}</div><div style="font:600 26pt/1.1 Fredoka">{d}</div>
<div style="font:500 8.5pt Fredoka;color:#5b4a75">{d} {name}</div></div></div>'''
    return out + "</div>"


ex2, _ = vop("+", 368, 257, solved=True, carries={1: "1", 2: "1"})
lesson2 = f'''
<h1>Lección mágica: cada número en su casa</h1>
<div class="soft">{houses(2486)}<div class="center" style="margin-top:2mm;font-size:13pt">El número <b class="num">2486</b> vive en 4 casas. ¡Cada cifra en la suya!</div></div>
<div class="row">
 <div class="col">
  <div class="soft" style="font-size:13.5pt">
   <h3>Las 3 reglas de la Rana</h3>
   <b>1.</b> Coloca los números <b>empezando por la derecha</b>: unidades debajo de unidades, decenas debajo de decenas…<br>
   <b>2.</b> Empieza a sumar <b>siempre por las unidades</b>.<br>
   <b>3.</b> En cada casa solo cabe <b>una cifra</b>. Si te sale 10 o más, escribe las unidades y la decena salta a
   la casa de al lado: <b>¡me llevo una!</b>
  </div>
 </div>
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {ex2}
 <div style="font-size:13.5pt;line-height:1.6">
  <b class="c-u">Unidades:</b> 8 + 7 = 15 → escribo <b>5</b> y me llevo <b style="color:#db2777">1</b><br>
  <b class="c-d">Decenas:</b> <span style="color:#db2777">1</span> + 6 + 5 = 12 → escribo <b>2</b> y me llevo <b style="color:#db2777">1</b><br>
  <b class="c-c">Centenas:</b> <span style="color:#db2777">1</span> + 3 + 2 = <b>6</b><br>
  <span class="big" style="color:var(--lc)">368 + 257 = 625</span>
 </div>
</div>
{lumi("La llevada es como una <b>mochila</b>: escríbela pequeñita arriba, en la casa de al lado, ¡y no te olvides de sumarla!")}
'''
add(lesson2, level=2)

s21 = [("+", 243, 524), ("+", 615, 372)]
s22 = [("+", 456, 238), ("+", 372, 145), ("+", 587, 264), ("+", 498, 336), ("+", 675, 289), ("+", 768, 457)]
h1, r1 = ops_row(s21, ["a", "b"])
h2, r2 = ops_row(s22, lab_list(2, 6))
p = add(sec(1, "Piedras sin llevadas", "Empieza siempre por las unidades (la casa azul).", h1)
        + sec(2, "Piedras con llevadas", "Escribe la llevada en la cajita de arriba. ¡Que no se escape!", h2),
        level=2, star_=True)
sol(p, "Pruebas 1 y 2", fmt_ops(s21 + s22, r1 + r2, lab_list(0, 8)))

s23 = [("+", 2314, 4563), ("+", 3528, 1347), ("+", 4675, 2183), ("+", 2749, 3586), ("+", 5896, 2437),
       ("+", 1608, 3795)]
h3, r3 = ops_row(s23, lab_list(0, 6))
e1, _ = vop("+", 3456, 278, empty=True)
e2, _ = vop("+", 1709, 594, empty=True)
colo = (f'<div class="ops"><div><div class="num center" style="font-size:14pt;margin-bottom:1.5mm">a) 3456 + 278</div>{e1}</div>'
        f'<div><div class="num center" style="font-size:14pt;margin-bottom:1.5mm">b) 1709 + 594</div>{e2}</div></div>')
p = add(sec(3, "Sumas de 4 cifras", "Cuatro casas: unidades de mil, centenas, decenas y unidades.", h3)
        + '<div class="row"><div>'
        + sec(4, "¡Colócalas tú!", "Escribe cada cifra en su casa, empezando por la derecha.", colo)
        + '</div><div class="col">'
        + sec(5, "El problema del río", "",
              problem("En el río nadan <b>1245</b> peces dorados y <b>2368</b> peces azules. ¿Cuántos peces hay en total?", h=30))
        + "</div></div>", level=2, star_=True)
sol(p, "Prueba 3", fmt_ops(s23, r3, lab_list(0, 6)))
sol(p, "Prueba 4", ["a) 3456 + 278 = 3734 (el 278 se coloca empezando por las unidades)", "b) 1709 + 594 = 2303"])
sol(p, "Prueba 5", "1245 + 2368 = 3613 peces")

sg2 = [("+", 352, 436), ("+", 479, 385), ("+", 693, 248), ("+", 3245, 2618), ("+", 4587, 3276), ("+", 2066, 1579)]
hg2, rg2 = ops_row(sg2, lab_list(0, 6))
sp2, _ = vop("+", 2486, 1357)
p = guardian_page(2, "«Croac. Salta por mis piedras sin caerte al agua y te daré el cristal azul.»", hg2,
                  "Para la última piedra hay que sumar <b>2486 + 1357</b>.", sp2, 6)
sol(p, "Desafío de la Rana", fmt_ops(sg2, rg2, lab_list(0, 6)) + ["Hechizo: 2486 + 1357 = 3843 → A"])

# ================================================================ NIVEL 3
story_page(3, [
    "Dentro de la Cueva de Cristal viven las mariquitas luminosas, que brillan en la oscuridad como farolillos. "
    "Cada mariquita tiene <b>6 patas</b>, y les encanta bailar.",
    "—¡Esta noche es la Gran Fiesta del Baile! —dijo la Reina Mariquita—. Pero Borrón nos ha borrado la tabla del 6 "
    "y no sabemos cuántas patas habrá en la pista.",
    "A Inessa la tabla del 6 le parecía difícil… pero Lumi le guiñó un ojo:",
    "—Tranquila. Tengo <b>dos trucos secretos</b> para ti.",
], "conquistar la tabla del 6.")


def dots_array(rows, cols, split, c1, c2, r=2.3):
    w = cols * 7 + 2
    h = rows * 7 + 2
    s = ""
    for i in range(rows):
        for j in range(cols):
            col = c1 if i < split else c2
            s += f'<circle cx="{4.5 + j * 7}" cy="{4.5 + i * 7}" r="{r}" fill="{col}"/>'
    return f'<svg style="width:{w * 1.0}mm;height:{h * 1.0}mm" viewBox="0 0 {w} {h}">{s}</svg>'


tab6 = ""
known = {1: "fácil", 2: "doble", 5: "acaba en 0 o 5", 10: "pon un 0"}
for k in range(1, 11):
    mark = (f'<span style="color:#16a34a">✔ ya la sabes ({known[k]})</span>' if k in known
            else '<span style="color:#dc2626">✨ nueva</span>')
    tab6 += f'<div class="num" style="font-size:12.5pt">6 × {k} = <b>{6 * k}</b> &nbsp;{mark}</div>'
lesson3 = f'''
<h1>Los trucos de Lumi para la tabla del 6</h1>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {dots_array(6, 7, 5, "#fca5a5", "#dc2626")}
 <div style="font-size:13.5pt">
  <h3>Truco 1: el 5 y uno más</h3>
  6 grupos son <b>5 grupos y uno más</b>. Si sabes la del 5, ¡sabes la del 6!<br>
  <span class="num" style="font-size:15pt">6 × 7 = <span style="color:#f87171">5 × 7</span> + <span style="color:#dc2626">7</span> = 35 + 7 = <b>42</b></span>
 </div>
</div>
<div class="soft">
 <h3>Truco 2: los pares que riman</h3>
 <div style="display:flex;gap:6mm;align-items:center">
  <div class="num" style="font-size:16pt;line-height:1.6;white-space:nowrap">
   6 × <span class="hl">2</span> = 1<span class="hl">2</span><br>6 × <span class="hl">4</span> = 2<span class="hl">4</span><br>
   6 × <span class="hl">6</span> = 3<span class="hl">6</span><br>6 × <span class="hl">8</span> = 4<span class="hl">8</span>
  </div>
  <div style="font-size:13.5pt">Cuando multiplicas el 6 por un número <b>par</b>, el resultado <b>termina en ese mismo
  número</b>, y delante va <b>su mitad</b>.<br><br>
  <span class="num">6 × 8 → termina en <b>8</b>, y la mitad de 8 es <b>4</b> → <b>48</b></span></div>
 </div>
</div>
<div class="row">
 <div class="soft col"><h3>Lo que ya sabes de la tabla del 6</h3>{tab6}</div>
 <div class="col">{lumi("Di la frase completa en voz alta: <b>«seis por siete, cuarenta y dos»</b>. ¡Tu oído también aprende!", "15mm")}
  <div style="text-align:center;font-size:54pt;line-height:1.2;margin-top:3mm">🐞</div>
  <div class="center muted" style="margin-top:2mm">Una mariquita = 6 patas</div></div>
</div>
'''
add(lesson3, level=3)

ft, ft_sol = ftable("Mariquitas", "Patas", 6, {1, 5, 10})
five = [3, 7, 8, 9]
five_h = "".join(f'<div class="fact" style="font-size:14pt">6 × {k} = 5 × {k} + {k} = {blank()} + {k} = {blank()}</div>'
                 for k in five)
rimas = (f'<div class="facts" style="grid-template-columns:1fr 1fr">'
         f'<div class="fact">6 × 2 = 1{blank("sm")}</div><div class="fact">6 × 4 = {blank("sm")}4</div>'
         f'<div class="fact">6 × 6 = 3{blank("sm")}</div><div class="fact">6 × 8 = {blank("sm")}8</div></div>')
wnums6 = [3, 7, 4, 9, 6, 8, 2, 5]
p = add(sec(1, "Patas de mariquita", "Completa: ¿cuántas patas tienen las mariquitas?", ft)
        + sec(2, "El 5 y uno más", "", f'<div style="display:grid;gap:2.6mm">{five_h}</div>')
        + '<div class="row" style="align-items:center"><div class="col">'
        + sec(3, "Los pares que riman", "Escribe la cifra que falta.", rimas)
        + '</div><div>' + sec(4, "La rueda del 6", "Multiplica cada número por 6 y escribe el resultado fuera.",
                               f'<div class="center">{wheel(6, wnums6, LV[3]["lc"], LV[3]["lcl"], 68)}</div>')
        + "</div></div>", level=3, star_=True)
sol(p, "Prueba 1", ", ".join(map(str, ft_sol)))
sol(p, "Prueba 2", [f"6×{k}: {5 * k} + {k} = {6 * k}" for k in five])
sol(p, "Prueba 3", ["12", "24", "36", "48"])
sol(p, "Prueba 4", ", ".join(f"{k}→{6 * k}" for k in wnums6))

mz6, path6 = maze(6, rng, LV[3]["lc"])
miss6 = [(6, 3), (6, 7), (9, 6), (6, 6), (6, 8), (4, 6)]
miss_h = ""
miss_s = []
for i, (a, b) in enumerate(miss6):
    if i % 3 == 2:
        miss_h += f'<div class="fact">{blank("sm")} × {b} = {a * b}</div>'
    else:
        miss_h += f'<div class="fact">{a} × {blank("sm")} = {a * b}</div>'
    miss_s.append(str(a if i % 3 == 2 else b))
rep3 = [("+", 467, 285), ("+", 3628, 1476)]
hr3, rr3 = ops_row(rep3, ["a", "b"])
p = add(sec(5, "El laberinto de las mariquitas",
            "Colorea el camino desde 🦄 hasta 💎 pisando <b>solo números de la tabla del 6</b>. Puedes ir a la derecha o hacia abajo.",
            f'<div style="display:flex;align-items:center;gap:3mm;justify-content:center"><span style="font-size:24pt;align-self:flex-start">🦄</span>{mz6}<span style="font-size:24pt;align-self:flex-end">💎</span></div>')
        + sec(6, "¿Qué número falta?", "", f'<div class="facts" style="grid-template-columns:repeat(3,1fr)">{miss_h}</div>')
        + sec(7, "Repaso del río", "¡Que no se te olviden las sumas!", hr3), level=3, star_=True)
sol(p, "Prueba 5 (camino)", ", ".join(map(str, path6)))
sol(p, "Prueba 6", miss_s)
sol(p, "Prueba 7", fmt_ops(rep3, rr3, ["a", "b"]))

g3 = ["6 × 3 =", "6 × 4 =", "6 × 6 =", "6 × 9 =", "6 × 8 =", "6 × 5 =", f"6 × {blank('sm')} = 24", "2 × 6 ="]
p = guardian_page(3, "«¡Bienvenida a la fiesta! Si sabes la tabla del 6, el cristal rojo será tuyo.»",
                  facts_grid(g3, 4), "En la pista bailan <b>7 mariquitas</b>. Cada una tiene <b>6 patas</b>. "
                  "¿Cuántas patas hay en la pista?", '<div style="font-size:30pt;line-height:1.1">🐞🐞🐞<br>🐞🐞🐞🐞</div>', 8)
sol(p, "Desafío de la Reina Mariquita", ["18", "24", "36", "54", "48", "30", "4", "12", "Hechizo: 7 × 6 = 42 → L"])

# ================================================================ NIVEL 4
story_page(4, [
    "La Montaña Nevada es altísima. En la cima vive <b>Nieve</b>, una osa polar que prepara el chocolate caliente "
    "más rico de todo el reino.",
    "Pero Borrón le ha hecho una trastada: ha mezclado los números de su tienda.",
    "—Tenía 1250 tazas de chocolate y he vendido 475… ¿cuántas me quedan? —lloraba Nieve—. ¡No me acuerdo de cómo "
    "se resta!",
    "Inessa se ajustó la bufanda. Para ayudar a Nieve había que <b>RESTAR</b>. ¡A escalar!",
], "restar números de 3 y 4 cifras, también cuando hay que pedir ayuda a la vecina.")

ex4a, _ = vop("-", 352, 127, solved=True, borrow={1: "4", 0: "12"})
ex4b, _ = vop("-", 503, 128, solved=True, borrow={2: "4", 1: "9", 0: "13"})
lesson4 = f'''
<h1>Lección mágica: restar en la montaña</h1>
<div class="soft" style="font-size:13.5pt">
 <h3>Las reglas de Nieve</h3>
 <b>1.</b> El número grande va <b>arriba</b>. Siempre se resta <b>el de arriba menos el de abajo</b>.<br>
 <b>2.</b> Empieza <b>por las unidades</b>, como en las sumas.<br>
 <b>3.</b> ¿Arriba hay un número más pequeño? <b>¡Pide ayuda a la vecina!</b> La casa de al lado te presta 1 decena
 (que son 10 unidades).
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {ex4a}
 <div style="font-size:13pt;line-height:1.55">
  <b class="c-u">Unidades:</b> 2 − 7 ¡no se puede! La decena vecina presta 1: el 5 se convierte en
  <b style="color:#db2777">4</b> y el 2 en <b style="color:#db2777">12</b>. → 12 − 7 = <b>5</b><br>
  <b class="c-d">Decenas:</b> 4 − 2 = <b>2</b><br>
  <b class="c-c">Centenas:</b> 3 − 1 = <b>2</b> &nbsp;&nbsp; <span class="big" style="color:var(--lc)">352 − 127 = 225</span>
 </div>
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {ex4b}
 <div style="font-size:13pt;line-height:1.55">
  <h3>La trampa del cero</h3>
  3 − 8 no se puede, y la decena es un <b>0</b>: ¡no tiene nada que prestar! Entonces pide a la centena:
  el 5 pasa a <b style="color:#db2777">4</b>, el 0 pasa a 10… y presta 1 a las unidades: queda en
  <b style="color:#db2777">9</b>, y el 3 se convierte en <b style="color:#db2777">13</b>.<br>
  13 − 8 = 5 · 9 − 2 = 7 · 4 − 1 = 3 → <b class="num">375</b>
 </div>
</div>
<div class="row">
 <div class="soft col" style="font-size:13.5pt"><h3>✅ La prueba mágica</h3>
 Para saber si tu resta está bien, <b>suma el resultado y el número de abajo</b>. ¡Te tiene que dar el de arriba!<br>
 <span class="num" style="font-size:15pt">225 + 127 = 352 ✔</span></div>
 <div class="col">{lumi("Si en tu cole restáis «llevando» de otra forma, ¡hazlo como en el cole! Lo importante es el resultado… y la prueba mágica sirve siempre.", "14mm")}</div>
</div>
'''
add(lesson4, level=4)

r41 = [("-", 586, 243), ("-", 794, 352), ("-", 463, 128), ("-", 652, 271), ("-", 734, 459), ("-", 821, 367)]
r42 = [("-", 600, 245), ("-", 405, 168)]
h41, x41 = ops_row(r41, lab_list(0, 6))
h42, x42 = ops_row(r42, ["g", "h"])
pr, _ = vop("+", 335, 128, cols=3)
p = add(sec(1, "Restas de 3 cifras", "Si arriba hay un número más pequeño, ¡pide ayuda a la vecina!", h41)
        + '<div class="row"><div>' + sec(2, "La trampa del cero", "", h42) + '</div><div>'
        + sec(3, "La prueba mágica", "Comprueba la resta <b>c</b>: ¿te da 463?", f'<div class="ops">{pr}</div>')
        + "</div></div>", level=4, star_=True)
sol(p, "Pruebas 1 y 2", fmt_ops(r41 + r42, x41 + x42, lab_list(0, 8)))
sol(p, "Prueba 3", "335 + 128 = 463 ✔ (la resta c está bien)")

r43 = [("-", 5876, 2341), ("-", 4352, 1728), ("-", 6215, 3487), ("-", 7043, 2516), ("-", 8000, 3456)]
h43, x43 = ops_row(r43, lab_list(0, 5))
e3, _ = vop("-", 3250, 785, empty=True)
colo4 = f'<div><div class="num center" style="font-size:14pt;margin-bottom:1.5mm">f) 3250 − 785</div>{e3}</div>'
h43 = h43[:-6] + colo4 + "</div>"
warm = facts_grid(["6 × 7 =", "6 × 4 =", "6 × 8 =", "6 × 6 ="], 4)
p = add(sec(4, "Restas de 4 cifras", "La <b>f</b> la colocas tú: ¡cada cifra en su casa, empezando por la derecha!", h43)
        + sec(5, "El problema de Nieve", "",
              problem("Nieve tenía <b>1250</b> tazas de chocolate y ha vendido <b>475</b>. ¿Cuántas tazas le quedan?", h=28))
        + sec(6, "Calentamiento de la Cueva", "¿Te acuerdas de la tabla del 6?", warm), level=4, star_=True)
sol(p, "Prueba 4", fmt_ops(r43, x43, lab_list(0, 5)) + ["f) 3250 − 785 = 2465"])
sol(p, "Prueba 5", "1250 − 475 = 775 tazas")
sol(p, "Prueba 6", ["42", "24", "48", "36"])

rg4 = [("-", 875, 432), ("-", 562, 238), ("-", 914, 576), ("-", 7684, 3251), ("-", 6372, 2845), ("-", 5004, 1238)]
hg4, xg4 = ops_row(rg4, lab_list(0, 6))
sp4, _ = vop("-", 4521, 1367)
p = guardian_page(4, "«¡Brrr! Ayúdame con estas restas y te regalaré el cristal celeste… y una taza de chocolate.»", hg4,
                  "Para llegar a la cima hay que resolver <b>4521 − 1367</b>. ¡Haz también la prueba mágica en un papel!",
                  sp4, 6)
sol(p, "Desafío de Nieve", fmt_ops(rg4, xg4, lab_list(0, 6)) + ["Hechizo: 4521 − 1367 = 3154 → I"])

# ================================================================ NIVEL 5
story_page(5, [
    "En el Lago Turquesa vive <b>Octavio</b>, un pulpo bromista con <b>8 tentáculos</b>. Con cada uno sujeta una "
    "cosa: una concha, una perla, un pincel… ¡y hasta una tetera!",
    "—Borrón me ha dejado sin la tabla del 8 —dijo Octavio, rascándose la cabeza con tres tentáculos a la vez—. "
    "Mis amigos y yo vamos a hacer una carrera y no sé cuántos tentáculos habrá en la salida.",
    "Lumi sonrió:",
    "—La tabla del 8 tiene el truco más divertido de todos: <b>doble, doble y doble</b>.",
], "conquistar la tabla del 8.")

c1, _ = chain(3)
c1 = c1.replace('<span class="ball"></span>', '<span class="ball given">{}</span>', 3).format(6, 12, 24)
c2, _ = chain(7)
c2 = c2.replace('<span class="ball"></span>', '<span class="ball given">{}</span>', 3).format(14, 28, 56)
units8 = " ".join(f'{v // 10 if v >= 10 else ""}<span class="hl">{v % 10}</span>' for v in range(8, 81, 8))
tab8 = ""
known8 = {1: "fácil", 2: "doble", 5: "acaba en 0", 6: "¡la Cueva! 6 × 8", 10: "pon un 0"}
for k in range(1, 11):
    mark = (f'<span style="color:#16a34a">✔ {known8[k]}</span>' if k in known8 else '<span style="color:#7c3aed">✨ nueva</span>')
    tab8 += f'<div class="num" style="font-size:12.5pt">8 × {k} = <b>{8 * k}</b> &nbsp;{mark}</div>'
lesson5 = f'''
<h1>El truco del pulpo: doble, doble y doble</h1>
<div class="soft">
 <div style="font-size:13.5pt;margin-bottom:3mm">Para multiplicar por 8, calcula el <b>doble</b> del número… otra vez el
 <b>doble</b>… ¡y otra vez el <b>doble</b>! (Funciona porque 8 = 2 × 2 × 2.)</div>
 <div style="display:flex;gap:8mm;justify-content:center">
  <div><div class="num" style="margin-bottom:1mm;font-size:14pt"><b>8 × 3</b></div>{c1}</div>
  <div><div class="num" style="margin-bottom:1mm;font-size:14pt"><b>8 × 7</b></div>{c2}</div>
 </div>
 <div class="muted" style="margin-top:2mm">Bonus: la tabla del 4 es <b>doble y doble</b>: 4 × 6 → 6, 12, 24.</div>
</div>
<div class="soft" style="font-size:13.5pt">
 <h3>El patrón secreto del 8</h3>
 Mira las unidades de la tabla del 8: <span class="num" style="font-size:15pt">{units8}</span><br>
 ¡Bajan de 2 en 2: <b>8, 6, 4, 2, 0</b>… y vuelven a empezar!
</div>
<div class="row">
 <div class="soft col"><h3>Lo que ya sabes de la tabla del 8</h3>{tab8}</div>
 <div class="col">
  <div class="soft" style="text-align:center"><h3>La rima que lo cambia todo</h3>
   <div class="num" style="font-size:22pt;color:var(--lc)">5, 6, 7, 8</div>
   <div class="num" style="font-size:22pt"><b>56 = 7 × 8</b></div>
   <div class="muted">Los números van en orden: cinco, seis, siete, ocho.</div></div>
  {lumi("¡Ya solo te quedan <b>4 nuevas</b>: 8 × 3, 8 × 4, 8 × 8 y 8 × 9!", "14mm")}
 </div>
</div>
'''
add(lesson5, level=5)

ft8, ft8_sol = ftable("Pulpos", "Tentáculos", 8, {1, 5, 10})
chs = ""
ch_sol = []
for k in [3, 4, 6, 7, 9]:
    h, vals = chain(k)
    chs += f'<div style="display:flex;align-items:center;gap:2mm"><span class="num" style="width:16mm;font-size:13pt"><b>8 × {k}</b></span>{h}</div>'
    ch_sol.append(f"8×{k}: " + " → ".join(map(str, vals)))
wnums8 = [4, 7, 3, 9, 6, 8, 2, 5]
p = add(sec(1, "Tentáculos en el lago", "", ft8)
        + '<div class="row" style="align-items:flex-start"><div>'
        + sec(2, "Doble, doble y doble", "El último número es el resultado.", f'<div style="display:grid;gap:3mm">{chs}</div>')
        + '</div><div class="col">'
        + sec(3, "La rueda del 8", "", f'<div class="center">{wheel(8, wnums8, LV[5]["lc"], LV[5]["lcl"], 66)}</div>')
        + "</div></div>", level=5, star_=True)
sol(p, "Prueba 1", ", ".join(map(str, ft8_sol)))
sol(p, "Prueba 2", ch_sol)
sol(p, "Prueba 3", ", ".join(f"{k}→{8 * k}" for k in wnums8))

mz8, path8 = maze(8, rng, LV[5]["lc"])
mix68 = [(8, 4), (6, 7), (8, 9), (6, 9), (8, 3), (6, 4), (8, 8), (7, 6), (9, 8), (6, 8)]
rep5 = [("-", 724, 358), ("-", 5310, 2645)]
hr5, rr5 = ops_row(rep5, ["a", "b"])
p = add(sec(4, "El laberinto del lago",
            "Colorea el camino desde 🦄 hasta 💎 pisando <b>solo números de la tabla del 8</b>. A la derecha o hacia abajo.",
            f'<div style="display:flex;align-items:center;gap:3mm;justify-content:center"><span style="font-size:24pt;align-self:flex-start">🦄</span>{mz8}<span style="font-size:24pt;align-self:flex-end">💎</span></div>')
        + sec(5, "Mezcla del 6 y del 8", "", facts_grid([f"{a} × {b} =" for a, b in mix68], 5, "sm"))
        + sec(6, "Repaso de la montaña", "", hr5), level=5, star_=True)
sol(p, "Prueba 4 (camino)", ", ".join(map(str, path8)))
sol(p, "Prueba 5", [str(a * b) for a, b in mix68])
sol(p, "Prueba 6", fmt_ops(rep5, rr5, ["a", "b"]))

g5 = ["8 × 3 =", "8 × 4 =", "8 × 6 =", "8 × 8 =", "8 × 9 =", "8 × 5 =", f"8 × {blank('sm')} = 16", "6 × 6 ="]
p = guardian_page(5, "«¡Glu, glu! Si me ayudas con la tabla del 8, el cristal violeta será tuyo.»",
                  facts_grid(g5, 4), "En la carrera hay <b>7 pulpos</b>. Cada uno tiene <b>8 tentáculos</b>. "
                  "¿Cuántos tentáculos hay en la salida?", '<div style="font-size:30pt;line-height:1.1">🐙🐙🐙<br>🐙🐙🐙🐙</div>', 8)
sol(p, "Desafío de Octavio", ["24", "32", "48", "64", "72", "40", "2", "36", "Hechizo: 7 × 8 = 56 → E"])

# ================================================================ NIVEL 6
story_page(6, [
    "¡Qué tristeza! El Jardín del Arcoíris estaba completamente gris. La niebla de Borrón había borrado sus "
    "<b>7 colores</b>.",
    "El Hada Iris volaba de flor en flor, preocupada:",
    "—Un arcoíris tiene 7 colores y una semana tiene 7 días. Necesito la tabla del 7 para volver a pintarlo todo.",
    "—La tabla del 7 es la más difícil… —dijo Inessa en voz bajita.",
    "—¿Seguro? —rio Lumi—. Mira bien… ¡<b>ya te sabes casi toda</b>!",
], "conquistar la tabla del 7 y mezclarla con la del 6 y la del 8.")

how7 = {1: ("✔", "fácil"), 2: ("✔", "doble: 7 + 7"), 3: ("✨", "3 semanas = 21 días"),
        4: ("✔", "doble y doble: 7 → 14 → 28"), 5: ("✔", "la del 5 (Bosque)"), 6: ("✔", "espejo de 6 × 7 (Cueva)"),
        7: ("✨", "«Siete por siete, cuarenta y nueve… ¡y el arcoíris llueve!»"),
        8: ("✔", "espejo de 8 × 7 (Lago) y 5, 6, 7, 8"), 9: ("✨", "truco del 9 (abajo)"), 10: ("✔", "pon un 0")}
rows7 = ""
for k in range(1, 11):
    ic, t = how7[k]
    col = "#16a34a" if ic == "✔" else "#c026d3"
    bg = "#fff" if ic == "✔" else "#fdf4ff"
    rows7 += (f'<tr style="background:{bg}"><td class="num" style="font-size:14pt;padding:1.2mm 3mm;white-space:nowrap">7 × {k} = <b>{7 * k}</b></td>'
              f'<td style="color:{col};font-size:14pt;padding:1.2mm 2mm">{ic}</td><td style="font-size:12.5pt;padding:1.2mm 3mm">{t}</td></tr>')
lesson6 = f'''
<h1>La tabla del 7: ¡ya sabes casi toda!</h1>
<table style="width:100%;border-collapse:collapse;border:.5mm solid #f0abfc;border-radius:4mm;overflow:hidden">{rows7}</table>
<div class="center" style="font:600 14pt Fredoka;color:var(--lc);margin:3mm 0">Solo hay 3 nuevas: 7 × 3, 7 × 7 y 7 × 9</div>
<div class="row">
 <div class="soft col" style="font-size:13.5pt">
  <h3>El truco del 9</h3>
  Para multiplicar por 9 (por ejemplo, <b>7 × 9</b>):<br>
  <b>1.</b> El resultado empieza por <b>uno menos</b>: 7 → <b>6</b><br>
  <b>2.</b> Las dos cifras <b>suman 9</b>: 6 + <b>3</b> = 9<br>
  <span class="big" style="color:var(--lc)">7 × 9 = 63</span>
 </div>
 <div class="soft col" style="font-size:13.5pt">
  <h3>¿Se te olvida alguna?</h3>
  Usa un truco que ya conoces:<br>
  <span class="num">7 × 4 = 7 × 2 × 2 → 14 → 28</span><br>
  <span class="num">7 × 6 = 5 × 7 + 7 = 35 + 7 = 42</span><br>
  <span class="num">7 × 9 = 7 × 10 − 7 = 70 − 7 = 63</span>
 </div>
</div>
{lumi("¿Lo ves? La tabla del 7 no era un monstruo. <b>La mayoría ya las habías conquistado</b> en el Bosque, en la Cueva y en el Lago.")}
'''
add(lesson6, level=6)

pattern = ["Y.MMMM.Y", ".MPMMPM.", "MPPMMPPM", "MMMMMMMM", ".MPPPPM.", "..MPPM..", "...MM...", "Y......Y"]
opsc = {"P": ["6 × 7", "7 × 6"], "M": ["7 × 8", "8 × 7"], "Y": ["7 × 7"],
        ".": ["7 × 3", "3 × 7", "7 × 4", "4 × 7", "7 × 9", "9 × 7", "7 × 5", "5 × 7", "7 × 2", "7 × 10"]}
pix = ""
for row in pattern:
    for ch in row:
        pix += f"<div>{rng.choice(opsc[ch])}</div>"
legend = ('<div class="legend"><span><i style="background:#f9a8d4"></i>42 → rosa</span>'
          '<span><i style="background:#a78bfa"></i>56 → morado</span>'
          '<span><i style="background:#fde047"></i>49 → amarillo</span>'
          '<span><i style="background:#bae6fd"></i>otro resultado → azul</span></div>')
p = add(f'''<h1>El cristal escondido</h1>
<p style="font-size:13pt">El Hada Iris ha escondido un dibujo con su magia. Resuelve cada multiplicación y
<b>colorea la casilla</b> según su resultado. ¿Qué aparecerá?</p>
{legend}
<div class="pix" style="grid-template-columns:repeat(8,20mm);grid-auto-rows:20mm;width:max-content;margin-top:4mm">{pix}</div>
{lumi("Pista: casi todas las multiplicaciones se repiten. ¡Cuantas más veces las digas, antes se quedarán en tu cabeza!", "14mm")}
''', level=6, star_=True)
sol(p, "Cristal escondido", "aparece un cristal (diamante) morado con caras rosas, chispas amarillas en las esquinas y fondo azul.")

wnums7 = [3, 6, 9, 4, 7, 2, 8, 5]
miss7 = [(7, 3), (7, 9), (7, 7), (8, 7)]
miss7_h = "".join(f'<div class="fact">{a} × {blank("sm")} = {a * b}</div>' for a, b in miss7)
race = []
last = None
while len(race) < 24:
    a = rng.choice([6, 7, 8])
    b = rng.choice([2, 3, 4, 5, 6, 7, 8, 9])
    if (a, b) == last:
        continue
    if rng.random() < .35:
        a, b = b, a
    race.append((a, b))
    last = (a, b)
rec = ('<table style="border-collapse:separate;border-spacing:2mm 1mm;font:500 11pt Fredoka;margin-top:2mm">'
       '<tr><td></td><td>Fecha</td><td>Tiempo</td><td>Aciertos</td></tr>'
       + "".join(f'<tr><td style="color:var(--lc)"><b>Intento {i}</b></td>' + '<td><span class="ans lg" style="height:7mm"></span></td>' * 3 + "</tr>" for i in (1, 2, 3))
       + "</table>")
p = add('<div class="row" style="align-items:center"><div>'
        + sec(1, "La rueda del 7", "", f'<div class="center">{wheel(7, wnums7, LV[6]["lc"], LV[6]["lcl"], 62)}</div>')
        + '</div><div class="col">' + sec(2, "¿Qué número falta?", "", f'<div style="display:grid;gap:3mm">{miss7_h}</div>')
        + "</div></div>"
        + sec(3, "Carrera contra ti misma",
              "Pide a papá o mamá que te cronometren. <b>Solo compites contra ti</b>: repítela otro día e intenta mejorar tu tiempo y tus aciertos.",
              facts_grid([f"{a} × {b} =" for a, b in race], 4, "sm") + rec), level=6, star_=True)
sol(p, "Prueba 1", ", ".join(f"{k}→{7 * k}" for k in wnums7))
sol(p, "Prueba 2", [str(b) for a, b in miss7])
sol(p, "Prueba 3 (carrera)", [str(a * b) for a, b in race])

g6 = ["7 × 3 =", "7 × 4 =", "7 × 9 =", "6 × 7 =", "8 × 7 =", "6 × 8 =", f"7 × {blank('sm')} = 35", "8 × 8 ="]
p = guardian_page(6, "«¡Devuélvele los colores a mi jardín y el cristal rosa será tuyo!»",
                  facts_grid(g6, 4), "El arcoíris tiene <b>7 colores</b>, y el Hada Iris pinta <b>7 arcoíris</b>. "
                  "¿Cuántas franjas de color pinta en total?", '<div style="font-size:34pt;line-height:1.1">🌈🌈<br>🌈🌈</div>', 8)
sol(p, "Desafío del Hada Iris", ["21", "28", "63", "42", "56", "48", "5", "64", "Hechizo: 7 × 7 = 49 → N"])

# ================================================================ NIVEL 7
story_page(7, [
    "En lo alto del volcán vive <b>Chispa</b>, una dragona que fabrica coronas, escudos y campanas. Chispa es enorme "
    "y trabaja con números enormes.",
    "—¡Necesito 6 cajas con 47 gemas cada una para las coronas de la reina! —rugió, echando un poquito de humo—. "
    "Pero mis tablas se quedaron en la niebla.",
    "Inessa sonrió. Ahora ya era una experta en tablas.",
    "—Las multiplicaciones grandes son como una pizza —dijo Lumi—: <b>se hacen por trocitos</b>.",
], "multiplicar números de 2 cifras por 1 cifra.")

ex7a, _ = vop("x", 23, 3, solved=True)
ex7b, _ = vop("x", 47, 6, solved=True, carries={1: "4"})
lesson7 = f'''
<h1>Lección mágica: multiplicar por trocitos</h1>
<div class="soft">
 <h3>Paso 1: rompe el número en trocitos</h3>
 <div style="display:flex;gap:4mm;align-items:center;justify-content:center;font:500 16pt Fredoka">
  <span><b>23 × 3</b></span><span>→</span>
  <span style="background:#fce7f3;border:.5mm solid #ec4899;border-radius:3mm;padding:2mm 4mm">20 × 3 = <b>60</b></span>
  <span>+</span>
  <span style="background:#dbeafe;border:.5mm solid #3b82f6;border-radius:3mm;padding:2mm 4mm">3 × 3 = <b>9</b></span>
  <span>=</span><span class="big" style="color:var(--lc)">69</span>
 </div>
 <div class="center muted" style="margin-top:2mm">23 son 2 decenas (20) y 3 unidades. Multiplicas cada trocito y luego los juntas.</div>
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {ex7a}
 <div style="font-size:13.5pt;line-height:1.6">
  <h3>Paso 2: en columna</h3>
  <b class="c-u">Primero las unidades:</b> 3 × 3 = <b>9</b><br>
  <b class="c-d">Después las decenas:</b> 3 × 2 = <b>6</b><br>
  <span class="big" style="color:var(--lc)">23 × 3 = 69</span>
 </div>
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {ex7b}
 <div style="font-size:13.5pt;line-height:1.6">
  <h3>Paso 3: con llevadas</h3>
  <b class="c-u">Unidades:</b> 6 × 7 = 42 → escribo <b>2</b> y me llevo <b style="color:#db2777">4</b><br>
  <b class="c-d">Decenas:</b> 6 × 4 = 24, y ahora sumo la mochila: 24 + <span style="color:#db2777">4</span> = <b>28</b><br>
  <span class="big" style="color:var(--lc)">47 × 6 = 282</span>
 </div>
</div>
{lumi("Ojo: la llevada se suma <b>después</b> de multiplicar. ¡Primero multiplica, luego suma la mochila!")}
'''
add(lesson7, level=7)

tro = [(32, 3, True), (41, 2, True), (24, 4, True), (53, 3, False), (36, 5, False)]
tro_h = ""
tro_s = []
for i, (n, m, given) in enumerate(tro):
    d, u = n // 10 * 10, n % 10
    if given:
        tro_h += (f'<div class="fact" style="font-size:14pt"><span class="lbl-in" style="color:var(--lc);width:6mm">{"abcde"[i]})</span>'
                  f'{n} × {m} = {d} × {m} + {u} × {m} = {blank()} + {blank("sm")} = {blank()}</div>')
    else:
        tro_h += (f'<div class="fact" style="font-size:14pt"><span style="color:var(--lc);width:6mm">{"abcde"[i]})</span>'
                  f'{n} × {m} = {blank()} × {m} + {blank("sm")} × {m} = {blank()} + {blank("sm")} = {blank()}</div>')
    tro_s.append(f"{'abcde'[i]}) {d}×{m} + {u}×{m} = {d * m} + {u * m} = {n * m}")
m71 = [("x", 21, 4), ("x", 43, 2), ("x", 13, 3), ("x", 31, 3)]
h71, x71 = ops_row(m71, lab_list(5, 4), gap="3mm")
p = add(sec(1, "Por trocitos", "En la <b>d</b> y la <b>e</b> rompes tú el número.", f'<div style="display:grid;gap:3.2mm">{tro_h}</div>')
        + sec(2, "En columna, sin llevadas", "Primero las unidades, después las decenas.", h71)
        + lumi("¿Te has fijado? En la Prueba 1 y la Prueba 2 haces lo mismo: <b>multiplicar cada trocito</b>. En columna solo lo escribes más ordenado.", "14mm"),
        level=7, star_=True)
sol(p, "Prueba 1", tro_s)
sol(p, "Prueba 2", fmt_ops(m71, x71, lab_list(5, 4)))

m72 = [("x", 27, 3), ("x", 35, 4), ("x", 18, 6), ("x", 25, 7), ("x", 34, 8), ("x", 56, 6), ("x", 69, 7), ("x", 87, 8)]
h72, x72 = ops_row(m72, lab_list(0, 8), gap="3mm")
rr7, _ = vop("-", 6031, 2574)
p = add(sec(3, "Con llevadas", "Escribe la llevada en la cajita de arriba y súmala después de multiplicar.", h72)
        + '<div class="row"><div class="col">'
        + sec(4, "El problema de Chispa", "", problem("Chispa fabrica <b>8 escudos</b>. Cada escudo lleva <b>15 piedras</b> brillantes. ¿Cuántas piedras necesita?", h=30))
        + '</div><div>' + sec(5, "Repaso", "", f'<div class="ops">{rr7}</div>') + "</div></div>",
        level=7, star_=True)
sol(p, "Prueba 3", fmt_ops(m72, x72, lab_list(0, 8)))
sol(p, "Prueba 4", "15 × 8 = 120 piedras")
sol(p, "Prueba 5", "6031 − 2574 = 3457")

mg7 = [("x", 42, 2), ("x", 33, 3), ("x", 26, 4), ("x", 38, 6), ("x", 54, 7), ("x", 49, 8)]
hg7, xg7 = ops_row(mg7, lab_list(0, 6), gap="3mm")
sp7, _ = vop("x", 47, 6)
p = guardian_page(7, "«¡GRRR! Bueno… en realidad soy muy simpática. Ayúdame en la forja y el cristal naranja será tuyo.»",
                  hg7, "Chispa necesita <b>6 cajas</b> con <b>47 gemas</b> cada una. ¿Cuántas gemas son en total?", sp7, 6)
sol(p, "Desafío de Chispa", fmt_ops(mg7, xg7, lab_list(0, 6)) + ["Hechizo: 47 × 6 = 282 → T"])

# ================================================================ NIVEL 8
story_page(8, [
    "¡Por fin, el Castillo de Numeria! La <b>Reina Aurora</b> esperaba en la torre más alta, rodeada de tesoros: "
    "gemas, monedas y estrellas.",
    "—Quiero repartirlos entre todos los habitantes del reino —dijo la reina—, pero sin que nadie se enfade: "
    "<b>a todos lo mismo</b>. Y Borrón me ha borrado las divisiones.",
    "El cuerno de Lumi brilló con fuerza.",
    "—Inessa, este es el último cristal. Dividir es repartir en partes iguales… ¡y es <b>la multiplicación al revés</b>!",
], "aprender a dividir.")


def triangle(a, b, c, size=34, given=True):
    t = (f'<svg style="width:{size}mm;height:{size * .9:.1f}mm" viewBox="0 0 100 90">'
         f'<polygon points="50,5 95,85 5,85" fill="#fef9c3" stroke="#a16207" stroke-width="2.5" stroke-linejoin="round"/>'
         f'<text x="50" y="56" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="19" fill="#a16207">{c}</text>'
         f'<text x="30" y="79" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="16" fill="#2e1a47">{a}</text>'
         f'<text x="70" y="79" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="16" fill="#2e1a47">{b}</text></svg>')
    return t


boxes12 = "".join('<div style="border:.6mm solid #a16207;border-radius:3mm;padding:2mm;background:#fff">' + emoji_array(2, 2, "💎") + '</div>' for _ in range(3))
lesson8 = f'''
<h1>Lección mágica: dividir es repartir</h1>
<div class="soft">
 <div style="display:flex;gap:5mm;align-items:center;justify-content:center">
  {emoji_array(3, 4, "💎")}
  <div style="font-size:24pt">→</div>
  <div style="display:flex;gap:3mm">{boxes12}</div>
  <div style="font-size:13.5pt;white-space:nowrap"><b>12 gemas</b> entre <b>3 cofres</b>:<br>¡a cada cofre le tocan <b>4</b>!<br>
  <span class="big" style="color:var(--lc)">12 ÷ 3 = 4</span><br><span class="muted">Se lee: «doce entre tres, cuatro».</span></div>
 </div>
</div>
<div class="soft" style="display:flex;gap:6mm;align-items:center">
 {triangle(3, 4, 12, 38)}
 <div style="font-size:13.5pt">
  <h3>La familia de números</h3>
  Con 3, 4 y 12 puedes hacer <b>4 operaciones</b>:<br>
  <span class="num" style="font-size:15pt;line-height:1.6">3 × 4 = 12 &nbsp;·&nbsp; 4 × 3 = 12<br>12 ÷ 3 = 4 &nbsp;·&nbsp; 12 ÷ 4 = 3</span>
 </div>
</div>
<div class="soft" style="font-size:13.5pt">
 <h3>El gran secreto: dividir es multiplicar al revés</h3>
 <div class="num" style="font-size:15.5pt;line-height:1.7">42 ÷ 6 = ? &nbsp;→&nbsp; piensa: <b>¿6 por cuánto da 42?</b>
 &nbsp;→&nbsp; 6 × <b>7</b> = 42 &nbsp;→&nbsp; <b style="color:var(--lc)">42 ÷ 6 = 7</b></div>
</div>
{lumi("¡Por eso las tablas son tan importantes! <b>Te sirven para multiplicar y también para dividir.</b> Todo lo que has aprendido en el viaje te va a ayudar ahora.")}
'''
START_8_LESSON = add(lesson8, level=8)

rep = [(10, 2, "⭐ estrellas", "hadas"), (12, 3, "💎 gemas", "cofres"), (15, 5, "🌸 flores", "jarrones")]
rep_h = ""
for i, (a, b, what, who) in enumerate(rep):
    cont = "".join('<div style="width:22mm;height:15mm;border:.5mm dashed #a16207;border-radius:4mm;background:#fff"></div>' for _ in range(b))
    rep_h += (f'<div class="opcard" style="margin-bottom:3mm"><span class="lbl">{"abc"[i]}</span>'
              f'<div style="font-size:12.5pt;margin-bottom:1.5mm">Reparte <b>{a} {what}</b> entre <b>{b} {who}</b>. Dibuja puntitos en cada uno.</div>'
              f'<div style="display:flex;gap:4mm;align-items:center"><div style="display:flex;gap:2.5mm;flex:1">{cont}</div>'
              f'<div class="fact" style="font-size:14pt">{a} ÷ {b} = {blank("sm")}</div></div></div>')
fam_h = ""
for a, b, c in [(6, 7, 42), (8, 7, 56), (6, 8, 48)]:
    lines = "".join(f'<div style="display:flex;gap:1.2mm;align-items:center;font:500 12pt Fredoka">{blank("xs")} {s} {blank("xs")} = {blank("xs")}</div>'
                    for s in ["×", "×", "÷", "÷"])
    fam_h += (f'<div class="opcard" style="display:flex;flex-direction:column;align-items:center;gap:1.5mm">{triangle(a, b, c, 20)}'
              f'<div style="display:grid;gap:1.5mm">{lines}</div></div>')
d8 = [(24, 6), (48, 8), (35, 7), (18, 6), (32, 8), (63, 7), (54, 6), (64, 8), (28, 7), (42, 7), (36, 6), (72, 8)]
p = add(sec(1, "Repartos de la reina", "", rep_h)
        + sec(2, "Familias de números", "Escribe las 4 operaciones de cada familia.", f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm">{fam_h}</div>')
        + sec(3, "Divide con las tablas", "Piensa: ¿qué número multiplicado me da…?", facts_grid([f"{a} ÷ {b} =" for a, b in d8], 4, "sm")),
        level=8, star_=True)
sol(p, "Prueba 1", ["a) 5", "b) 4", "c) 3"])
sol(p, "Prueba 2", ["6×7=42, 7×6=42, 42÷6=7, 42÷7=6", "8×7=56, 7×8=56, 56÷8=7, 56÷7=8", "6×8=48, 8×6=48, 48÷6=8, 48÷8=6"])
sol(p, "Prueba 3", [str(a // b) for a, b in d8])

g84, _ = galera(84, 4, solved=True)
g17, _ = galera(17, 5, solved=True)
lesson8b = f'''
<h1>La casita de la división</h1>
<div class="soft" style="display:flex;gap:8mm;align-items:center">
 <div style="transform:scale(1.25);transform-origin:left center;margin-right:12mm">{galera(84, 4)[0]}</div>
 <div style="font-size:13pt;line-height:1.55">
  <b style="color:var(--lc)">Dividendo</b> (84): lo que repartes. Va a la izquierda.<br>
  <b style="color:var(--lc)">Divisor</b> (4): entre cuántos repartes. Va dentro de la casita.<br>
  <b style="color:var(--lc)">Cociente</b>: lo que le toca a cada uno. Va debajo del divisor.<br>
  <b style="color:#c026d3">Resto</b>: lo que sobra. Siempre más pequeño que el divisor.
 </div>
</div>
<div class="row">
 <div class="soft col">
  <h3>Ejemplo 1: 84 ÷ 4</h3>
  <div style="display:flex;gap:4mm;align-items:center">{g84}
  <div style="font-size:12.5pt;line-height:1.5"><b>1.</b> Decenas: 8 ÷ 4 = <b>2</b><br><b>2.</b> Unidades: 4 ÷ 4 = <b>1</b><br>Cociente <b>21</b>, resto 0.</div></div>
 </div>
 <div class="soft col">
  <h3>Ejemplo 2: 17 ÷ 5</h3>
  <div style="display:flex;gap:4mm;align-items:center">{g17}
  <div style="font-size:12.5pt;line-height:1.5">¿5 por cuánto se acerca a 17 <b>sin pasarse</b>? 5 × 3 = 15.<br>Cociente <b>3</b>. Sobran 17 − 15 = <b style="color:#c026d3">2</b>.</div></div>
 </div>
</div>
<div class="row">
 <div class="soft col" style="font-size:13pt"><h3>✅ La prueba de la división</h3>
  cociente × divisor + resto = dividendo<br><span class="num" style="font-size:14.5pt">3 × 5 + 2 = 17 ✔</span></div>
 <div class="box col" style="font-size:12.5pt;border-style:dashed"><h3>⭐ Para expertas: 72 ÷ 3</h3>
  7 ÷ 3 = <b>2</b> (2 × 3 = 6, sobra <b>1</b>). Ese 1 se junta con el 2: <b>12</b>.<br>
  12 ÷ 3 = <b>4</b>. Cociente: <b>24</b>.</div>
</div>
{lumi("Si en tu cole colocan la división de otra manera, ¡hazlo como en el cole! Los pasos son los mismos.", "14mm")}
'''
add(lesson8b, level=8)

def galeras(lst, labels):
    h = ""
    res = []
    for (a, b), l in zip(lst, labels):
        g, r = galera(a, b, l)
        h += g
        res.append((a, b, r))
    return f'<div class="ops" style="gap:3mm">{h}</div>', res


def fmt_div(res, labels):
    out = []
    for (a, b, (q, r)), l in zip(res, labels):
        out.append(f"{l}) {a} ÷ {b} = {q}" + (f" resto {r}" if r else ""))
    return out


ga, ra = galeras([(48, 2), (69, 3), (86, 2), (96, 3)], lab_list(0, 4))
gb, rb = galeras([(17, 5), (23, 4), (38, 6), (45, 7)], lab_list(4, 4))
gc, rc = galeras([(72, 3), (85, 5)], lab_list(8, 2))
p = add(sec(4, "Divisiones exactas", "Primero divide las decenas y después las unidades.", ga)
        + sec(5, "Divisiones con resto", "¿Qué número de la tabla se acerca más sin pasarse? Lo que sobra es el resto.", gb)
        + '<div class="row"><div>' + sec(6, "Para expertas ⭐", "¡Mira el ejemplo de 72 ÷ 3!", gc) + '</div><div class="col">'
        + sec(7, "El tesoro de la reina", "", problem("La reina reparte <b>48 estrellas</b> entre <b>4 hadas</b>. ¿Cuántas estrellas recibe cada hada?", h=22))
        + "</div></div>", level=8, star_=True)
sol(p, "Pruebas 4, 5 y 6", fmt_div(ra + rb + rc, lab_list(0, 10)))
sol(p, "Prueba 7", "48 ÷ 4 = 12 estrellas")

g8f = facts_grid(["36 ÷ 6 =", "56 ÷ 7 =", "64 ÷ 8 ="], 3)
g8g, r8g = galeras([(84, 2), (39, 3), (29, 4)], lab_list(3, 3))
sp8, _ = galera(63, 3)
p = guardian_page(8, "«Ayúdame a repartir mis tesoros con justicia y el último cristal, el dorado, será tuyo.»",
                  g8f + '<div style="height:3mm"></div>' + g8g,
                  "La reina tiene <b>63 estrellas</b> y quiere repartirlas entre las <b>3 torres</b> del castillo. "
                  "¿Cuántas estrellas pondrá en cada torre?", sp8, 6)
sol(p, "Desafío de la Reina Aurora", ["a) 6", "b) 8", "c) 8"] + fmt_div(r8g, lab_list(3, 3)) + ["Hechizo: 63 ÷ 3 = 21 → E"])

# ================================================================ GRAN FINAL
final = f'''
<div style="display:flex;gap:5mm;align-items:center">
 <div style="flex:1"><div class="kicker">El Gran Final</div><h1 style="font-size:30pt">¡La luz vuelve a Numeria!</h1></div>
 <div style="width:34mm">{unicorn("34mm")}</div>
</div>
<div class="story" style="font-size:14pt">
 <p style="font-size:14.5pt">Inessa colocó los 8 cristales en el cuerno de Lumi, uno a uno: verde, azul, rojo, celeste, violeta, rosa,
 naranja y dorado. ¡FLASH! Una luz de mil colores llenó todo el reino y los números volvieron a brillar.</p>
 <p style="font-size:14.5pt">Entonces, detrás de una roca, asomó una nubecita gris con los ojos llorosos. Era Borrón.</p>
 <p style="font-size:14.5pt">—Yo… borré los números porque nunca los entendí —dijo bajito—. Todos los sabían menos yo.</p>
 <p style="font-size:14.5pt">Inessa se acordó de lo difícil que le parecía la tabla del 7 al principio. Se sentó a su lado y sonrió:
 —¿Quieres que te enseñe un truco?</p>
</div>
<div class="row" style="align-items:stretch">
 <div style="width:34mm;display:flex;align-items:center">{borron("34mm")}</div>
 <div class="box col" style="margin:0"><h2>Enséñale a Borrón</h2>
 <div style="font-size:12.5pt">Explícale a Borrón (o a papá o mamá) <b>tu truco favorito</b>. Escríbelo o dibújalo aquí:</div>
 <div style="height:40mm"></div></div>
</div>
<div class="spell" style="margin-top:5mm;border-color:#7c3aed;background:#faf5ff">
 <h2 style="color:#7c3aed">🔑 La palabra secreta</h2>
 <div style="font-size:12.5pt;margin-bottom:3mm">Escribe tus 8 letras en orden. Ponte delante del Gran Cofre y <b>di la palabra en voz alta</b>.
 Pista: es lo que tú has sido durante toda la aventura.</div>
 <div style="display:flex;gap:3mm;justify-content:center">{word_boxes}</div>
</div>
'''
P_FIN = add(final, lc="#7c3aed", lcl="#ede9fe", tag="🏰 El Gran Final")

mtf = f'''
<h1>El Mapa de las Tablas… ¡otra vez!</h1>
<p style="font-size:13pt">¿Te acuerdas del mapa del Bosque? Ahora rellénalo <b>entero</b>. Después compáralo con el primero
(página %%MT1%%): <b>¡mira cuánto has crecido!</b></p>
{mult_table()}
<div style="display:flex;gap:4mm;align-items:center;margin-top:4mm">
 <div style="font:600 13pt Fredoka;color:var(--lc)">Mis tablas favoritas ahora son:</div><span class="sign"></span>
</div>
'''
P_MTF = add(mtf, lc="#7c3aed", lcl="#ede9fe", tag="🏰 El Gran Final", star_=True)
sol(P_MTF, "Mapa final", "cada casilla es fila × columna. Compáralo con el de la pág. %%MT1%% y celebra lo conseguido.")

dipl = f'''
<div class="diploma">
 <div style="width:52mm">{unicorn("52mm")}</div>
 <div class="kicker" style="color:#a21caf;margin-top:3mm">Reino de Numeria</div>
 <div style="font:700 44pt/1 Fredoka;color:#7c3aed;margin-top:2mm">DIPLOMA</div>
 <div style="font:600 19pt Fredoka;color:#c026d3;margin-top:1mm">de Gran Maga de los Números</div>
 <div style="font-size:13pt;margin-top:7mm">Se entrega a</div>
 <div style="font:700 40pt/1.1 Fredoka;color:#2e1a47;margin-top:1mm">Inessa</div>
 <div style="font-size:14pt;line-height:1.55;margin-top:5mm;max-width:150mm">por encontrar los <b>8 cristales mágicos</b> de Numeria,
 conquistar las tablas del <b>6</b>, del <b>7</b> y del <b>8</b>, sumar, restar, multiplicar y dividir como una auténtica
 maga y demostrar que es muy <b style="color:#c026d3">VALIENTE</b>.</div>
 <div style="display:flex;gap:3mm;justify-content:center;margin-top:7mm">{gems_row}</div>
 <div style="display:flex;gap:12mm;width:100%;margin-top:auto;font:500 11pt Fredoka;color:#5b4a75">
  <div style="flex:1;text-align:center"><div style="font:600 18pt Fredoka;color:#a21caf">Lumi 🦄</div><div style="border-top:.4mm solid #c4b5fd;padding-top:1mm">Unicornio guardián</div></div>
  <div style="flex:1;text-align:center"><div style="height:9mm"></div><div style="border-top:.4mm solid #c4b5fd;padding-top:1mm">Firma de la familia</div></div>
  <div style="flex:1;text-align:center"><div style="height:9mm"></div><div style="border-top:.4mm solid #c4b5fd;padding-top:1mm">Fecha</div></div>
 </div>
</div>'''
P_DIP = add(dipl, numbered=False)

# ================================================================ CARTAS
cards = [
    (6, 3, "5 × 3 + 3 = 15 + 3"), (6, 4, "Par que rima: acaba en 4 y delante su mitad, 2"),
    (6, 5, "La mitad de 6 × 10 = 60"), (6, 6, "Par que rima: acaba en 6 y delante su mitad, 3"),
    (6, 7, "5 × 7 + 7 = 35 + 7"), (6, 8, "Par que rima: acaba en 8 y delante su mitad, 4"),
    (6, 9, "Truco del 9: 5 y 4 suman 9"), (7, 3, "3 semanas = 21 días"),
    (7, 4, "Doble y doble: 7 → 14 → 28"), (7, 5, "La mitad de 70"),
    (7, 7, "¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!"), (7, 8, "5, 6, 7, 8 → 56 = 7 × 8"),
    (7, 9, "Truco del 9: 6 y 3 suman 9"), (8, 3, "Doble, doble, doble: 3 → 6 → 12 → 24"),
    (8, 4, "Doble, doble, doble: 4 → 8 → 16 → 32"), (8, 5, "La mitad de 80"),
    (8, 8, "Doble, doble, doble: 8 → 16 → 32 → 64"), (8, 9, "Truco del 9: 7 y 2 suman 9"),
]


def card_html(a, b, hint):
    return (f'<div class="card"><div class="front"><div class="q1">{a} × {b}</div><div class="q2">({b} × {a})</div></div>'
            f'<div><div class="a1">{a * b}</div><div class="hint">{hint}</div></div></div>')


special = [
    '<div class="card"><div class="front"><div style="font-size:26pt">🦄</div><div class="q2" style="font-weight:600;color:#a21caf">Comodín de Lumi</div></div>'
    '<div><div class="hint" style="font-size:11pt">¡Inventa tú una multiplicación para papá o mamá!</div></div></div>',
    '<div class="card"><div class="front"><div style="font-size:26pt">🤗</div><div class="q2" style="font-weight:600;color:#a21caf">Carta del abrazo</div></div>'
    '<div><div class="hint" style="font-size:11pt">Si sale esta carta… ¡abrazo de unicornio para todos!</div></div></div>',
]
all_cards = [card_html(*c) for c in cards] + special
howto = ('<div style="display:flex;gap:4mm;align-items:center;margin-bottom:3mm"><div style="flex:1;font-size:11pt">'
         '<b style="font-family:Fredoka;color:#7c3aed;font-size:14pt">Cartas mágicas</b> · Recorta por la línea gris, '
         '<b>dobla por la línea rosa</b> y pega. Delante: la pregunta. Detrás: la respuesta y el truco.<br>'
         'Juega con 3 montones: <b>⭐ Lo sé</b> · <b>🌙 Casi</b> · <b>🌱 Todavía no</b>. ¡Haz que todas lleguen a ⭐!'
         '</div></div>')
P_CART = add(howto + f'<div class="cards">{"".join(all_cards[:10])}</div>', lc="#7c3aed", lcl="#ede9fe",
             tag="✂️ Material mágico")
add('<div style="height:3mm"></div>' + f'<div class="cards">{"".join(all_cards[10:])}</div>', lc="#7c3aed", lcl="#ede9fe",
    tag="✂️ Material mágico")

# ================================================================ TABLERO
specials = {5: ("🌈", "¡Arcoíris! Avanza 2"), 9: ("☁️", "Niebla de Borrón: retrocede 2"),
            13: ("🦄", "Lumi te lleva: avanza 3"), 17: ("☁️", "Niebla: retrocede 1"),
            21: ("⭐", "Di la tabla del 7 entera: avanza 2"), 26: ("☁️", "Niebla: vuelve a la 22")}
facts_b = []
for a in (6, 7, 8):
    for b in (2, 3, 4, 5, 6, 7, 8, 9):
        facts_b.append((a, b))
rng.shuffle(facts_b)
sqs = {}
fi = 0
for i in range(1, 31):
    if i == 1:
        sqs[i] = '<div class="sq" style="background:#dcfce7;border-color:#16a34a"><span class="n">1</span>🏠<span class="sp">Salida</span></div>'
    elif i == 30:
        sqs[i] = '<div class="sq" style="background:#fef9c3;border-color:#a16207"><span class="n">30</span>🏰<span class="sp">¡Castillo!</span></div>'
    elif i in specials:
        e, t = specials[i]
        bg = "#f3f4f6" if e == "☁️" else "#fdf4ff"
        sqs[i] = f'<div class="sq" style="background:{bg}"><span class="n">{i}</span><span style="font-size:15pt">{e}</span><span class="sp">{t}</span></div>'
    else:
        a, b = facts_b[fi]
        fi += 1
        if rng.random() < .4:
            a, b = b, a
        sqs[i] = f'<div class="sq"><span class="n">{i}</span>{a} × {b}</div>'
order = []
for r in range(5):
    row = list(range(r * 6 + 1, r * 6 + 7))
    if r % 2 == 1:
        row.reverse()
    order.append(row)
order.reverse()  # salida abajo
board = "".join(sqs[i] for row in order for i in row)
tokens = "".join(
    f'<div style="width:20mm;height:20mm;border-radius:50%;border:.6mm dashed #8b7aa8;display:flex;align-items:center;justify-content:center;font-size:24pt">{e}</div>'
    for e in ["🦄", "🐉", "🐙", "🐸"])
tab = f'''
<h1>Carrera al Castillo</h1>
<div class="board">{board}</div>
<div class="row" style="margin-top:4mm">
 <div class="box col" style="font-size:11.5pt;margin:0"><h3>Cómo se juega</h3>
 Para 2 o más jugadores (¡Inessa contra papá, mamá o quien se atreva!). Necesitáis un dado y las fichas.<br>
 <b>1.</b> Por turnos, tira el dado y avanza siguiendo los números (empieza abajo, en la salida 🏠).<br>
 <b>2.</b> Di en voz alta el resultado de tu casilla. Si aciertas, te quedas. Si fallas, vuelves a donde estabas… ¡y ya
 has aprendido ese resultado!<br>
 <b>3.</b> Las casillas especiales tienen sorpresas. <b>4.</b> Gana quien llegue primero al castillo 🏰.</div>
 <div style="width:46mm"><h3 class="center">Fichas para recortar</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm;justify-items:center">{tokens}</div></div>
</div>'''
P_TAB = add(tab, lc="#7c3aed", lcl="#ede9fe", tag="🎲 Material mágico")

# ================================================================ SOLUCIONES
P_SOL = len(pages) + 1
items = "".join(f'<div class="it"><b>Pág. {p} · {t}:</b> {x}</div>' for p, t, x in SOL)
sol_body = f'''<h1 style="color:#7c3aed">Soluciones (solo para la familia)</h1>
<p class="muted">Corrige con calma y en positivo: primero lo que está bien, después «aquí hay una pista para revisar».
Palabra secreta: <b>VALIENTE</b>.</p>
<div class="sol">{items}</div>'''
# el solucionario puede ocupar más de una página: lo partimos a mano
sol_pages = []
chunk = []
size = 0
LIMIT = 3900
for p_, t, x in SOL:
    s = len(t) + len(x) + 40
    if size + s > LIMIT and chunk:
        sol_pages.append(chunk)
        chunk, size = [], 0
    chunk.append((p_, t, x))
    size += s
if chunk:
    sol_pages.append(chunk)
for i, ch in enumerate(sol_pages):
    items = "".join(f'<div class="it"><b>Pág. {p} · {t}:</b> {x}</div>' for p, t, x in ch)
    head = ('<h1 style="color:#7c3aed">Soluciones (solo para la familia)</h1><p class="muted">Corrige con calma y en positivo: '
            'primero lo que está bien, después «aquí hay una pista para revisar». Palabra secreta: <b>VALIENTE</b>.</p>') if i == 0 else ""
    add(head + f'<div class="sol">{items}</div>', lc="#7c3aed", lcl="#ede9fe", tag="🔑 Soluciones")

# ---------------------------------------------------------------- ensamblar
html = "\n".join(pages)
P_MT1 = START[1] + 4
repl = {"%%CARTA%%": P_CARTA, "%%MAPA%%": P_MAPA, "%%PERG%%": P_PERG, "%%FIN%%": P_FIN, "%%MTF%%": P_MTF,
        "%%DIP%%": P_DIP, "%%CART%%": P_CART, "%%TAB%%": P_TAB, "%%SOL%%": P_SOL, "%%MT1%%": P_MT1}
for i in range(1, 9):
    repl[f"%%L{i}%%"] = START[i]
for k, v in repl.items():
    html = html.replace(k, str(v))
doc = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Inessa y la Magia de los Números</title>
<style>{CSS}</style></head><body>{html}</body></html>'''
open("inessa.html", "w").write(doc)
print("pages", len(pages))
