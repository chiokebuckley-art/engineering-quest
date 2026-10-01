from pathlib import Path
from PIL import Image, ImageDraw, ImageStat
import json, re

import argparse
parser=argparse.ArgumentParser(description='Rebuild the reviewed Visual Library WebP pairs (requires Pillow).')
parser.add_argument('source',type=Path,help='Extracted 265-card archive directory')
parser.add_argument('--destination',type=Path,default=Path(__file__).resolve().parents[1])
args=parser.parse_args()
root=args.source
dest=args.destination
out=dest/'public/assets/visual-library';out.mkdir(parents=True,exist_ok=True)
cards=json.loads((root/'manifest.json').read_text())
ocr=json.loads(Path(__file__).with_name('visual-library-ocr.json').read_text())
corrections=json.loads((root/'scientific-corrections.json').read_text())
# Individually reviewed vertical diagram bounds, in manifest order. These are intentionally
# separate records: illustrations have different header lengths, plots and comparison panels.
vertical=[
(.34,.82),(.33,.78),(.35,.74),(.35,.82),(.33,.83),(.29,.81),(.32,.83),(.34,.80),(.31,.82),(.32,.82),(.40,.73),(.31,.84),(.39,.77),(.33,.83),(.33,.81),(.33,.81),(.35,.83),(.38,.80),(.34,.82),(.31,.80),
(.29,.85),(.37,.81),(.29,.83),(.34,.79),(.38,.76),(.34,.75),(.36,.78),(.31,.84),(.27,.85),(.31,.81),(.31,.82),(.31,.81),(.31,.83),(.28,.86),(.40,.78),(.30,.85),(.42,.87),(.37,.83),(.37,.78),(.34,.83),
(.30,.83),(.28,.83),(.30,.84),(.37,.84),(.28,.94),(.34,.82),(.32,.83),(.30,.83),(.33,.83),(.36,.82),(.31,.83),(.31,.83),(.38,.84),(.26,.79),(.25,.80),(.22,.82),(.32,.81),(.30,.82),(.32,.82),(.30,.82),
(.28,.81),(.30,.82),(.25,.83),(.24,.84),(.25,.83),(.23,.84),(.43,.80),(.42,.78),(.22,.86),(.22,.82),(.25,.84),(.27,.85),(.23,.83),(.25,.83),(.23,.83),(.24,.84),(.28,.85),(.26,.88),(.32,.81),(.31,.81),
(.24,.88),(.24,.82),(.24,.80),(.26,.84),(.26,.84),(.30,.86),(.27,.82),(.33,.83),(.33,.83),(.34,.79),(.24,.87),(.28,.87),(.26,.84),(.25,.84),(.26,.84),(.30,.84),(.23,.87),(.26,.83),(.29,.81),(.27,.88),
(.35,.82),(.27,.83),(.25,.83),(.26,.83),(.39,.81),(.23,.86),(.29,.85),(.32,.86),(.26,.82),(.29,.84),(.35,.83),(.34,.83),(.36,.84),(.34,.83),(.29,.85),(.31,.83),(.27,.85),(.32,.84),(.20,.89),(.30,.85),
(.41,.78),(.29,.84),(.34,.83),(.37,.85),(.38,.80),(.29,.85),(.36,.84),(.39,.81),(.35,.79),(.25,.84),(.27,.85),(.26,.85),(.29,.85),(.32,.85),(.35,.79),(.25,.86),(.40,.81),(.32,.84),(.39,.81),(.23,.86),
(.28,.84),(.31,.84),(.36,.80),(.32,.81),(.21,.84),(.34,.84),(.40,.84),(.38,.84),(.38,.85),(.35,.83),(.30,.83),(.28,.84),(.34,.84),(.37,.84),(.30,.84),(.22,.84),(.24,.87),(.24,.90),(.23,.87),(.28,.86),
(.34,.90),(.23,.88),(.28,.88),(.29,.90),(.31,.88),(.33,.88),(.39,.86),(.42,.86),(.43,.87),(.33,.85),(.29,.87),(.46,.82),(.29,.88),(.29,.88),(.28,.88),(.26,.87),(.29,.86),(.29,.87),(.30,.87),(.25,.84),
(.24,.81),(.24,.83),(.25,.84),(.23,.84),(.44,.88),(.29,.83),(.41,.84),(.28,.94),(.38,.90),(.24,.83),(.29,.83),(.25,.82),(.24,.84),(.24,.81),(.22,.87),(.30,.86),(.34,.84),(.25,.87),(.30,.87),(.29,.85),
(.25,.78),(.26,.84),(.25,.86),(.28,.80),(.34,.84),(.32,.79),(.33,.81),(.35,.80),(.32,.84),(.33,.84),(.32,.84),(.24,.90),(.24,.86),(.28,.94),(.38,.88),(.42,.84),(.38,.85),(.25,.87),(.24,.87),(.39,.85),
(.25,.90),(.32,.91),(.20,.89),(.41,.86),(.32,.84),(.35,.84),(.30,.85),(.25,.88),(.35,.85),(.27,.89),(.26,.88),(.31,.90),(.32,.88),(.26,.86),(.34,.82),(.37,.84),(.31,.87),(.28,.86),(.32,.92),(.46,.90),
(.29,.80),(.24,.94),(.27,.91),(.24,.89),(.23,.91),(.37,.91),(.31,.89),(.29,.93),(.29,.84),(.23,.87),(.46,.85),(.24,.87),(.31,.93),(.36,.92),(.32,.87),(.39,.84),(.37,.83),(.39,.90),(.27,.83),(.32,.90),
(.25,.89),(.34,.89),(.40,.72),(.29,.88),(.32,.87)
]
# Second pixel review: retain complete graph/object bounds for these individual cards.
for index,bounds in {38:(.24,.79),160:(.30,.86),161:(.24,.88),172:(.20,.87),173:(.21,.88),174:(.22,.88),176:(.20,.87),185:(.25,.88),189:(.23,.88),190:(.22,.89),201:(.20,.89),203:(.22,.86),204:(.24,.88),205:(.21,.84),206:(.23,.88),207:(.24,.82),210:(.24,.87),211:(.23,.89),212:(.24,.91),213:(.25,.88),214:(.25,.88),215:(.25,.84),220:(.20,.90),223:(.26,.87),224:(.24,.90),225:(.25,.84),226:(.25,.87),227:(.24,.88),228:(.25,.88),233:(.25,.88),234:(.27,.88),235:(.27,.88),236:(.23,.88),237:(.23,.92),238:(.24,.89),239:(.27,.89),244:(.24,.91),246:(.25,.89),247:(.24,.89),248:(.22,.88),250:(.33,.87),252:(.23,.90),253:(.25,.89),254:(.24,.88),260:(.22,.89),264:(.24,.87)}.items():
 vertical[index]=bounds
assert len(vertical)==len(cards)
aliases={0:['round circle'],10:['oval','ellipse'],13:['star','five point star'],17:['rectangular prism','cuboid'],21:['square based pyramid','square pyramid'],22:['triangle prism'],25:['trapezium','trapezoid'],29:['heptagon'],30:['nonagon'],31:['decagon'],32:['hendecagon','undecagon'],33:['dodecagon'],40:['annulus','ring'],42:['circular segment'],43:['tetrahedron'],44:['elliptical cross section'],56:['pipe annulus'],70:['von karman vortex street','karman vortex street'],88:['bent molecular geometry','bent'],89:['linear molecular geometry','linear'],96:['buckminsterfullerene','c60'],98:['graphene'],99:['carbon nanotube','cnt'],155:['sinusoid','sine wave'],156:['cosine wave'],163:['dirac comb','impulse train'],164:['dirac delta','unit impulse','delta function'],169:['damped sine wave'],179:['bpsk'],180:['qpsk'],181:['16 qam'],202:['smith chart'],217:['yagi','yagi uda antenna']}
data=[];audit=[]
for i,c in enumerate(cards):
 im=Image.open(root/c['file']).convert('RGB');w,h=im.size
 lesson=im.copy();lesson.thumbnail((1050,1050));lesson.save(out/f'{i:03}-learn.webp',quality=85)
 # Basic geometry uses the unannotated object panel; the comparison and advanced cards
 # retain their complete schematic, with all detected text removed before cropping.
 left,right=(.025,.535) if i<44 and i not in [3,4,5,6,35,36,37,38,39] else (.05,.985)
 top,bottom=vertical[i]
 if i<44 and i not in [3,4,5,35,36,37,38,39]:left=.05;right=.50
 if i in [14,17,27,34]:right=.525
 if i==24:right=.516
 if i==32:right=.495
 if i==6:left,right,top,bottom=.05,.49,.32,.77
 if i==22:left,right,top,bottom=.04,.516,.32,.75
 if i in [6,13,16,28,29,31,33,38,39,40,41]:bottom=min(bottom,.79)
 if i in [85,87,94,95,96,97,100,104,120,122,151]:top=max(.20,top-.035)
 rect=[round(left*w),round(top*h),round(right*w),round(bottom*h)]
 masks=[]
 for line in ocr[c['slug']]:
  a,b,x,y=line['box']
  # Preserve graph symbols and numerals; OCR occasionally calls a circular drawing O.
  text=line['text'].strip()
  if len(text)==1 or (y-b>.10 and len(text)<8):continue
  box=[max(0,round(a*w)-8),max(0,round(b*h)-7),min(w,round(x*w)+8),min(h,round(y*h)+7)]
  # Sample the rectangle corners so dark plots keep a dark background.
  points=[im.getpixel((max(0,box[0]-2),max(0,box[1]-2))),im.getpixel((min(w-1,box[2]+2),max(0,box[1]-2))),im.getpixel((max(0,box[0]-2),min(h-1,box[3]+2))),im.getpixel((min(w-1,box[2]+2),min(h-1,box[3]+2)))]
  color=tuple(sorted(p[ch] for p in points)[2] for ch in range(3))
  ImageDraw.Draw(im).rectangle(box,fill=color);masks.append(box)
 if i==220:
  box=[465, 883, 820, 946]
  ImageDraw.Draw(im).rectangle(box,fill=(177,224,205));masks.append(box)
 quiz=im.crop(rect);quiz.thumbnail((1050,1050));quiz.save(out/f'{i:03}-quiz.webp',quality=88)
 definition=corrections.get(c['slug'],{}).get('definition',c['planned_on_image_definition'])
 chapter=None
 if c['domain']=='k12':
  chapter='solids' if 16<=i<=23 or i==43 else 'triangles' if i in [3,4,5,6,37,38,39] else 'circles' if i in [0,10,34,35,36,40,41,42,44] else 'polygons'
 # The supplied definition states the distinguishing visual relationships. Keep its
 # scientific wording intact; separate semicolon clauses into identifying features.
 features=[s.strip().rstrip('.')+'.' for s in definition.split(';') if s.strip()]
 if i==22:features=['Two matching triangular ends.', 'Three rectangular side faces.', 'The cross-section stays the same along the length.']
 if i==21:features=['One square base.', 'Four triangular sides meet at a single apex.']
 if i==0:features=['One continuous curved boundary.', 'Every boundary point is equally far from the center.']
 if i==1:features=['Four equal sides.', 'Four square corners (right angles).']
 if i==17:features=['Six rectangular faces.', 'Matching opposite faces and twelve straight edges.']
 if i==18:features=['One curved surface with no edges or corners.', 'A round cross-section through the center.']
 if i==19:features=['Two matching circular bases.', 'A curved side joins the bases.']
 if i==20:features=['One circular base.', 'The curved side narrows to a single apex.']
 related={'Fluids and continuum':('calculus','rates'),'Molecules and lattices':('geometry','solids'),'Phase diagrams and thermodynamics':('calculus','area'),'Astrophysics and spacetime':('precalc','conics'),'Core physical shapes':('calculus','motion'),'Waveforms and pulses':('trig','graphs'),'Spectra and filters':('precalc','explog'),'Antennas and fields':('linalg','vectors'),'Digital, control, and power':('linalg','vectors')}.get(c['family'])
 data.append(dict(id=c['slug'],name=c['name'],domain=c['domain'],tier=c['tier'],family=c['family'],definition=definition,features=features,aliases=list(dict.fromkeys(aliases.get(i,[])+[re.sub(r'\s*\([^)]*\)', '', c['name']).strip()])),lessonArt=f'assets/visual-library/{i:03}-learn.webp',quizArt=f'assets/visual-library/{i:03}-quiz.webp',**({'chapter':chapter} if chapter else {}),**({'related':{'academy':related[0],'chapter':related[1]}} if related else {})))
 audit.append(dict(id=c['slug'],sourceSha256=c['sha256'],sourceSize=[w,h],crop=rect,textMasks=masks,reviewed=True))
(dest/'src/content/visual-library.json').write_text(json.dumps(data,indent=2)+'\n')
(dest/'docs/visual-library-art-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('Prepared',len(data),'lesson and quiz image pairs')
