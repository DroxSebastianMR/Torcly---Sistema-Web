import sys
sys.path.insert(0, 'tmp/pdfs/python-deps')
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fontTools.ttLib import TTFont as Font
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

for weight in [400,500,600,700]:
 p=Path(f'tmp/pdfs/fonts/Inter-{weight}.ttf')
 f=Font(str(p))
 for record in f['name'].names:
  if record.nameID in (1,4,6):
   record.string=f'Inter-{weight}'.encode(record.getEncoding())
 f.save(p)
 pdfmetrics.registerFont(TTFont(f'Inter{weight}',str(p)))
W,H=595.28,841.89
OUT=Path('output/pdf/torcly-guia-de-color.pdf')
C=canvas.Canvas(str(OUT),pagesize=(W,H))
C.setTitle('Torcly | Identidad visual: color y tipografía')
C.setAuthor('Torcly')
C.setSubject('Especificación visual de la plataforma de gestión empresarial')
forest='#102C25';primary='#17634C';accent='#00D492';ink='#1B2925';muted='#61706A';bg='#F7F8FA';border='#DCE4DF';soft='#EAF0EC'
def rect(x,y,w,h,color,r=0):
 C.setFillColor(HexColor(color))
 if r:C.roundRect(x,H-y-h,w,h,r,stroke=0,fill=1)
 else:C.rect(x,H-y-h,w,h,stroke=0,fill=1)
def text(x,y,s,size=11,color=ink,weight=400):
 C.setFillColor(HexColor(color));C.setFont(f'Inter{weight}',size);C.drawString(x,H-y-size,s)
def para(x,y,s,width=511,size=10.5,color=muted,leading=16,weight=400):
 style=ParagraphStyle('p',fontName=f'Inter{weight}',fontSize=size,leading=leading,textColor=HexColor(color))
 p=Paragraph(s,style);w,h=p.wrap(width,1000);p.drawOn(C,x,H-y-h);return h
def logo(x,y,size=27,color=forest):
 text(x,y,'torcly',size,color,700)
 text(x+pdfmetrics.stringWidth('torcly','Inter700',size),y,'.',size,accent,700)
def header(section,title,sub):
 rect(0,0,W,H,bg);logo(42,29)
 text(335,40,'SISTEMA DE GESTIÓN EMPRESARIAL',8,muted,500)
 rect(42,83,511,1,border)
 text(42,107,section,9,primary,600)
 text(42,133,title,29,forest,600)
 para(42,181,sub,size=10.5,leading=16)
def footer(n):
 rect(42,788,511,1,border)
 text(42,801,'IDENTIDAD VISUAL / COLOR Y TIPOGRAFÍA',7.5,muted,500)
 text(426,801,f'V1.1  /  {n:02d} - 04',7.5,muted,500)
def rgb(h):return ', '.join(str(int(h[i:i+2],16)) for i in (1,3,5))

header('01 / PALETA INSTITUCIONAL','Sistema de color',
'La identidad visual de Torcly establece una paleta de verdes y tonos neutros para mantener consistencia entre la marca, la navegación y las operaciones del sistema.')
# Dark identity field
rect(42,236,511,142,forest,9);logo(64,269,52,'#FFFFFF')
text(283,270,'IDENTIFICACIÓN DE MARCA',8,'#B9CFC4',600)
para(283,294,'El punto esmeralda se conserva como elemento distintivo del identificador visual.',239,10.5,'#FFFFFF',17)
text(42,406,'Colores principales',15,forest,600)
for i,(name,col,role) in enumerate([
 ('Verde institucional',forest,'Estructura de navegación y paneles de acceso.'),
 ('Verde de acción',primary,'Acciones principales, enlaces y foco de interacción.'),
 ('Esmeralda de marca',accent,'Punto del identificador y acentos gráficos de marca.')]):
 x=42+174*i
 rect(x,445,163,80,col,7)
 text(x,542,name,10.2,ink,600)
 text(x,565,col,19,forest,600)
 text(x,595,'RGB '+rgb(col),9,muted)
 para(x,620,role,158,10,muted,15)
rect(42,686,511,68,soft,7)
text(57,697,'CRITERIO DE APLICACIÓN',8.5,primary,600)
para(57,717,'El verde institucional define la estructura visual. El verde de acción identifica operaciones. El esmeralda se reserva para la marca y no sustituye los estados operativos.',481,10,ink,15)
footer(1);C.showPage()

header('02 / PALETA DE SOPORTE','Superficies y contenido',
'Los tonos neutros organizan la información, separan áreas funcionales y establecen la jerarquía de lectura en formularios, tablas y paneles de gestión.')
colors=[('Fondo general',bg,'Superficie base de las pantallas.'),('Superficie de contenido','#FFFFFF','Tarjetas, formularios y áreas de trabajo.'),('Texto principal',ink,'Títulos, datos y contenido de lectura.'),('Texto secundario',muted,'Descripciones y etiquetas auxiliares.'),('Superficie secundaria',soft,'Agrupaciones y controles secundarios.'),('Borde y separación',border,'Divisores y delimitación de contenedores.')]
for i,(name,col,role) in enumerate(colors):
 x=42+(i%2)*264;y=238+(i//2)*151
 rect(x,y,247,134,'#FFFFFF',7)
 rect(x+12,y+12,40,40,col,5)
 if col=='#FFFFFF':
  C.setStrokeColor(HexColor(border));C.roundRect(x+12,H-y-52,40,40,5,fill=0,stroke=1)
 text(x+63,y+13,col,13,forest,600)
 text(x+63,y+36,'RGB '+rgb(col),8.5,muted)
 text(x+12,y+66,name,11,ink,600)
 para(x+12,y+89,role,223,9.5,muted,14)
text(42,706,'Jerarquía de superficies',12,forest,600)
para(42,731,'El contenido utiliza fondos claros y texto oscuro. Los bordes delimitan grupos de información sin competir visualmente con los datos ni con las acciones.',511,10,muted,15)
footer(2);C.showPage()

header('03 / SISTEMA TIPOGRÁFICO','Tipografía institucional',
'Inter se define como familia tipográfica principal de la interfaz. Su aplicación uniforme permite distinguir niveles de información y mantener continuidad entre los módulos del sistema.')
rect(42,239,511,142,forest,9)
text(64,258,'Inter',43,'#FFFFFF',600)
text(64,324,'ABCDEFGHIJKLMN  abcdefghijklmn',15,'#FFFFFF')
text(64,351,'0123456789  /  S/  %  @',12,'#B9CFC4')
text(371,266,'PESOS DEFINIDOS',8,accent,600)
for j,(label,weight) in enumerate([('Regular / 400',400),('Medium / 500',500),('Semibold / 600',600),('Bold / 700',700)]):text(371,288+j*19,label,10,'#FFFFFF',weight)
text(42,408,'Jerarquía de interfaz',15,forest,600)
rect(42,443,511,27,soft,4)
for x,label in [(54,'ELEMENTO'),(258,'TAMAÑO / LÍNEA'),(393,'PESO'),(459,'APLICACIÓN')]:text(x,451,label,7.5,primary,600)
rows=[('Título de página','30 / 36 px','600','Módulo'),('Título de sección','20 / 28 px','600','Agrupación'),('Contenido general','14 / 20 px','400','Lectura'),('Etiquetas y botones','14 / 20 px','500','Interacción'),('Texto auxiliar','12 / 16 px','400','Ayuda')]
for i,row in enumerate(rows):
 y=482+i*35
 for x,s in zip([54,258,393,459],row):text(x,y,s,9,ink,500 if x==54 else 400)
 rect(42,y+25,511,.5,border)
text(42,682,'Criterios de composición',12,forest,600)
para(42,707,'Los encabezados utilizan mayúscula inicial. Las mayúsculas sostenidas se reservan para rótulos breves. Las tablas numéricas mantienen alineación a la derecha y formatos consistentes de moneda, fecha y cantidad.',511,10,muted,15)
text(42,765,'Los tamaños especificados corresponden a la interfaz web y se expresan en píxeles CSS.',8,muted)
footer(3);C.showPage()

header('04 / APLICACIÓN EN EL SISTEMA','Componentes y consistencia',
'La combinación de color y tipografía establece una estructura común para la navegación, la consulta de información y la ejecución de operaciones.')
rect(42,237,511,235,'#FFFFFF',8)
rect(42,237,139,235,forest,8);rect(171,237,10,235,forest)
logo(59,259,28,'#FFFFFF')
text(59,313,'GESTIÓN COMERCIAL',7,'#B9CFC4',600)
rect(53,338,117,32,primary,5);text(65,347,'Productos',10,'#FFFFFF',500)
text(65,390,'Inventario',10,'#B9CFC4');text(65,424,'Ventas',10,'#B9CFC4')
text(204,258,'Productos',24,ink,600)
text(204,296,'Administración del catálogo comercial',9,muted)
rect(204,324,326,60,bg,5)
text(218,337,'Catálogo de productos',11,ink,600)
text(218,357,'Consulta y mantenimiento de registros',9,muted)
rect(204,407,132,34,primary,5);text(220,417,'Nuevo producto',10,'#FFFFFF',500)
rect(348,407,112,34,soft,5);text(366,417,'Ver catálogo',10,primary,500)
text(42,492,'Referencia de composición visual de un módulo de gestión.',8,muted)
for y,num,title,desc in [
 (529,'01','Jerarquía de acciones','La acción principal utiliza fondo verde y texto blanco. Las acciones secundarias emplean superficies neutras.'),
 (595,'02','Lectura y contraste','El esmeralda se aplica sobre fondos oscuros o como detalle gráfico. Para texto sobre blanco se utiliza verde de acción o texto principal.'),
 (661,'03','Estados del sistema','Los mensajes operativos deben incluir texto o iconografía. El color no debe ser el único indicador de éxito, advertencia o error.')]:
 text(42,y,num,10,primary,600);text(72,y,title,11,ink,600);para(72,y+21,desc,481,10,muted,15)
para(42,746,'Especificación digital: HEX/RGB en sRGB. El esmeralda #00D492 es una referencia aproximada del color de marca definido en OKLCH (76.5% 0.177 163.223).',511,8,muted,12)
footer(4);C.save()
print(OUT.resolve())


