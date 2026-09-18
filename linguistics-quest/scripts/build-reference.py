"""Build licensed, lazy-loaded WordNet shards from an explicitly supplied wordnet.zip."""
import sys,zipfile,json,gzip,re,unicodedata,hashlib
from pathlib import Path
src=Path(sys.argv[1]); out=Path(__file__).resolve().parents[1]/'data';out.mkdir(exist_ok=True)
z=zipfile.ZipFile(src); groups={};synsets=0; senses=0
for pos in ['noun','verb','adj','adv']:
 for line in z.read('wordnet/data.'+pos).decode().splitlines():
  if not line or line[0].isspace():continue
  meta,gloss=line.split(' | ',1);parts=meta.split();n=int(parts[3],16)
  words=[re.sub(r'\([aps]\)$','',parts[4+2*i]).replace('_',' ') for i in range(n)]
  examples=re.findall(r'"([^"]+)"',gloss)
  definition=re.sub(r';?\s*"[^"]*"','',gloss).strip(' ;')
  record=[parts[2]+parts[0],pos,definition,examples,words];synsets+=1
  for w in set(words):
   w=w.lower();bucket=w[0] if w[0] in 'abcdefghijklmnopqrstuvwxyz' else '_'
   groups.setdefault(bucket,{}).setdefault(w,[]).append(record);senses+=1
for bucket,data in groups.items():
 b=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode();(out/(bucket+'.json.gz')).write_bytes(gzip.compress(b,mtime=0))
(out/'WORDNET-LICENSE.txt').write_bytes(z.read('wordnet/LICENSE'))
symbols=[]
for cp in range(0x110000):
 c=chr(cp);cat=unicodedata.category(c)
 if cat[0] in 'PS':
  name=unicodedata.name(c,None)
  if name:symbols.append([c,name,f'U+{cp:04X}',cat])
(out/'symbols.json').write_text(json.dumps(symbols,ensure_ascii=False,separators=(',',':')))
summary={'source':'Princeton WordNet 3.0','headwords':sum(len(x) for x in groups.values()),'senses':senses,'synsets':synsets,'shards':len(groups),'archiveSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'unicodeVersion':unicodedata.unidata_version,'symbols':len(symbols)}
(out/'manifest.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary))
