import {ENTRIES,WORLDS,BY_ID} from './content.js';
// Editorial foundation sequence, not a claim of full state-standard grade coverage.
export const GRADE_TITLES=['Things, places & simple messages','Little words that build sentences','Connections & word building','Compare, describe & explain','Words with more than one job','Reading with precision','The language of learning','How words and sounds work','Reasoning from context','Scientific and logical language','Relationships in mathematics','Sets, arguments & notation','Advanced meaning and notation'];
const kindergarten=new Set(['dog','puppy','share','before','after','beside','in','on','under','with','and','or','not','this','that','.','?','!','+','−','=']);
export function gradeFor(e){
 if(e.level===1)return kindergarten.has(e.term)?0:1;
 if(e.world==='little')return 2;
 if(e.world==='everyday')return 2;
 if(e.world==='connections')return e.level===2?2:5;
 if(e.world==='parts'){if(e.level===2)return ['un-','re-','pre-','mis-','-ful','-less','-er','-ly'].includes(e.term)?2:3;return ['in-','im-','anti-','inter-','intra-','sub-','super-','trans-','micro-','macro-','mono-','poly-'].includes(e.term)?5:6;}
 if(e.world==='senses')return e.level===2?3:e.level===3?4:9;
 if(e.world==='precision')return e.level===2?3:e.level===3?5:9;
 if(e.world==='academic')return e.level===2?3:e.level===3?6:8;
 if(e.world==='language')return e.level===2?3:e.level===3?7:8;
 if(e.world==='punctuation')return e.level===2?2:e.level===3?4:9;
 if(e.world==='math')return e.level===2?2:e.level===3?4:9;
 if(e.world==='digital')return e.level===2?3:e.level===3?6:9;
 if(e.world==='advanced'){if(['∠','°','⊥','∥','≅','∼','Δ','∝'].includes(e.term))return 10;if(['∈','∉','⊆','∪','∩','∅','⇒','⇔','∀','∃','¬','∧','∨','ℝ','ℤ','ℕ'].includes(e.term))return 11;return 12;}
 return 1;
}
export const LESSONS=[];
for(let grade=0;grade<=12;grade++){
 // K starts with concrete nouns before relationships and notation.
 const order=grade===0?['everyday','little','punctuation','math','digital']:WORLDS.map(w=>w.id);
 for(const world of order){const es=ENTRIES.filter(e=>gradeFor(e)===grade&&e.world===world);for(let i=0;i<es.length;i+=3){const part=es.slice(i,i+3);LESSONS.push({id:`g${grade}.${world}.${Math.floor(i/3)+1}`,grade,world,entries:part.map(e=>e.id),title:part.map(e=>e.term).join(' · ')});}}
}
export const gradeName=g=>g===0?'Kindergarten':`Grade ${g}`;
export const defaultCourse=()=>({version:1,configured:false,target:2,passed:{},work:{}});
export function getCourse(profile){return profile.course||(profile.course=defaultCourse());}
export function coursePlan(profile){let c=getCourse(profile),lessons=LESSONS.filter(l=>l.grade<=c.target);let next=lessons.find(l=>!c.passed[l.id]);return {lessons,next,done:lessons.filter(l=>c.passed[l.id]).length,total:lessons.length,complete:!next};}
export function unlocked(profile,id){const plan=coursePlan(profile);return plan.lessons.some(l=>l.id===id)&&(Boolean(getCourse(profile).passed[id])||plan.next?.id===id);}
export function workFor(profile,id){const c=getCourse(profile);return c.work[id]||(c.work[id]={item:0,phase:'teach',step:0,feedback:null,checks:0});}
export function completeLesson(profile,id,now=Date.now()){let l=LESSONS.find(l=>l.id===id),c=getCourse(profile),w=c.work[id];if(!l||!unlocked(profile,id)||!w||w.item<l.entries.length)return false;if(!c.passed[id]){c.passed[id]={at:now};profile.xp+=30;}delete c.work[id];return true;}
const simple={
rescue:['To rescue is to bring someone out of danger.','A puppy is stuck in a deep hole. Helping it get out to a safe place is a rescue.','🐕 🛟','Petting a safe puppy is kind, but it is not a rescue. Rescue involves danger or serious trouble.','Tell a grown-up how you could get help for a trapped animal.'],
observe:['To observe is to watch or notice carefully.','Watch a seed each day. Notice its new leaves and how tall it grows. You are gathering information by observing.','🌱 👀','Guessing what a plant looks like without looking is different from observing it.','Look carefully at one leaf. Describe its shape, color, and edges.'],
sort:['To sort is to put things into groups using a rule.','Put red buttons together and blue buttons together. Color is your sorting rule. You could instead group big and small buttons.','🔴 🔴 🔵 🔵','Moving things around without a grouping rule is not sorting them.','Sort a few toys by size, then explain your rule.'],
between:['Between means in the space separating things.','If a puppy sits between two chairs, there is a chair on each side of it.','🪑 🐕 🪑','Beside one chair tells us it is next to that chair. Between two chairs tells us about both sides.','Place a pencil between two books.'],
through:['Through can mean moving into something and out the other side.','A train enters a tunnel, travels inside, and comes out. It went through the tunnel.','🚂 → 🚇 →','Going around a tunnel is different: you do not travel inside it.','Move your hand through a loop made with your other hand.'],
curious:['Curious means wanting to find out more.','A child asks why a seed needs water. The child wants to understand, so we call the child curious.','🌱 ❓','Already knowing an answer is not the same as wanting to find out. Curiosity can lead to questions.','Ask a question about something you can see.'],
brave:['Brave means facing something difficult or frightening.','Admitting a mistake can feel scary. Telling the truth anyway can be brave.','💛','Being brave does not mean feeling no fear or taking unnecessary risks. Asking for help can be brave.','Name a time you did something helpful even though you felt nervous.'],
'×':['Times means multiply in these examples.','Three groups with four counters in each group have twelve counters altogether. We write 3 × 4 = 12.','●●●●  ●●●●  ●●●●','3 + 4 combines just three and four. 3 × 4 combines three equal groups of four.','Make two equal groups of three objects. Count the total.'],
'÷':['Divide can mean sharing into equal groups.','Share twelve counters equally among three people. Each person gets four, so 12 ÷ 3 = 4.','12 → 4 + 4 + 4','If one person gets more, the groups are not equal. You can also ask how many equal groups fit.','Share six objects equally between two pretend people.'],
'½':['One half means one of two equal parts of a whole.','Cut a sandwich into two equal parts. Each part is one half. A group can also be split in half.','½ + ½ = 1','Two unequal pieces are not each one half. The parts must be equal in the amount being measured.','Split eight objects into two equal groups. One group is half of eight.'],
'⏸':['Pause means stop playing for now and keep your place.','Pause a story recording when you need a break. You can continue from that place later.','▶ → ⏸ → ▶','Pause does not usually erase the recording or start it over.','Pretend to pause a song, then continue where you stopped.'],
'▶':['Play means start or continue the recording.','On a video player, pressing the triangle starts the video moving and its sound playing.','▶ 🎵','A triangle can have other meanings elsewhere. Look at the player controls to understand this use.','Point out the play control on a music or video player with a grown-up.'],
'🔍':['This magnifying-glass sign often means search.','On a word app, the sign helps you find where to type the word you want to look up.','🔍 → 📖','In another app it might mean zoom in. Check the nearby label to tell what it does.','Say a word you would like to search for and what you hope to learn.'],
'dog':['A dog is an animal that can bark.','A dog can be big or small. Fur color and size do not decide whether it is a dog.','🐕','A cat can have four legs and fur too. That does not make the cat a dog.','Point to a dog in a book or name a dog you know.'],
'puppy':['A puppy is a young dog.','A puppy grows into an adult dog. Puppy tells us about age, not just size.','🐕 🐕‍🦺','A small adult dog is still an adult. Small does not always mean young.','Tell someone how a puppy and an adult dog are alike and different.'],
'share':['To share is to let others use or have something with you.','Two children can share one box of crayons. Each can use crayons from that box.','🖍️ 👧 👦','Keeping every crayon for yourself is not sharing. Sharing does not always mean cutting something in half.','Show how you could share a toy without breaking it into pieces.'],
'before':['Before tells us what comes earlier.','Put on socks before shoes. Socks come first; shoes come later.','🧦 → 👟','Putting shoes on first reverses this order. Before does not mean at the same time.','Say what you do before going to bed.'],
'after':['After tells us what comes later.','Put on shoes after socks. Socks come first; shoes come later.','🧦 → 👟','After is about order. It does not tell us how many minutes later.','Say what you do after waking up.'],
'beside':['Beside means next to.','If you sit beside a friend, you sit next to that friend.','👧 🐕','A dog inside a box is in the box. A dog next to the box is beside it.','Put a pencil beside a book.'],
'in':['In can mean inside.','Imagine a toy in a box. The sides of the box surround the toy.','📦','A toy beside the box is next to it. A toy in the box is inside it.','Put a small object in a cup. Then move it out.'],
'on':['On can mean resting on a surface.','A cup on a table touches the table, and the table holds it up.','☕','A cup under the table is lower down. It is not resting on the tabletop.','Put your hand on the table. Feel the surface.'],
'under':['Under means lower than something.','A dog under a table has the tabletop above it.','🐕','On top of the table is different from under the table.','Place one hand above the other. Which hand is under?'],
'with':['With can mean together with.','Walking with your sister means you are walking together.','👧 👦','Walking alone means your sister is not accompanying you.','Name someone you would like to read with.'],
'and':['And joins things or ideas.','Apples and pears includes apples plus pears. The word connects the two.','🍎 + 🍐','If you choose apples or pears, you have a choice. And joins them.','Join two things you like using and.'],
'or':['Or can offer a choice.','Choose an apple or a pear: either fruit can answer the request.','🍎 / 🍐','Sometimes or allows both. Listen to the whole instruction to know what is allowed.','Offer someone a choice using or.'],
'not':['Not tells us that something is not true.','The dog is not asleep means the dog is awake, not sleeping.','🐕 👀','The dog is asleep says something different. Adding not changes the message.','Change The door is open by adding not.'],
this:['This points to something nearby.','This book means the nearby book we are talking about, perhaps the one in your hand.','📖','That book over there points farther away.','Point to something close and call it this.'],
that:['That can point to something farther away.','That tree over there means the tree we are pointing to in the distance.','🌳','This usually points closer in this kind of sentence.','Point to something farther away and call it that.'],
the:['The points to the particular thing we mean.','Imagine two doors. Close the blue door tells us which door. The helps us refer to an identifiable thing.','🚪','A door could introduce one door without saying which. The door points to one we can identify.','Point to one object and ask someone to pick up the object.'],
a:['A introduces one thing without saying exactly which one.','I need a pencil means one pencil will do. You have not identified a particular pencil.','✏️ ✏️','I need the red pencil identifies a particular one.','Ask for a book, then ask for the book on a particular shelf.'],
an:['An does the same job as a before a vowel sound.','An apple starts with a vowel sound. An hour does too: the h is silent.','🍎','A unicorn begins with a y sound. Choose a or an by sound.','Say an apple and a banana aloud.'],
is:['Is connects one person or thing to what it is or is like now.','The puppy is small links puppy with small. It tells us something about the puppy.','🐕','The puppy was small points to the past. Is describes the present in this example.','Finish: My favorite toy is…'],
are:['Are connects you or more than one thing to a description now.','The dogs are friendly tells us about the dogs. You are kind tells us about you.','🐕 🐕','Use is with the dog and are with the dogs in these examples.','Finish: My shoes are…'],
was:['Was tells us about a past state of one person or thing.','The room was quiet yesterday tells us how it used to be. It could be noisy now.','🕰️','The room is quiet describes now. Was points back in time.','Finish: Yesterday I was…'],
were:['Were tells us about you or several people or things in the past.','The kittens were sleepy tells us about them at an earlier time.','🐈 🐈','Are describes now in these examples; were describes an earlier time.','Finish: Yesterday we were…'],
of:['Of connects related things. It can tell us a part or what something contains.','The roof of the house links the roof to the house it belongs to. A cup of water tells what is in the cup.','🏠','Of does not name an object by itself. Ask: which two things is it connecting?','Point to the cover of a book. Say what of connects.'],
to:['To can show where someone or something is going.','Walk to the door: the door is where the walk is headed.','🚶 → 🚪','From the door tells where the walk starts. To the door tells its destination.','Describe a trip from your chair to a door.'],
from:['From can show where something starts or comes from.','A letter from Grandma tells who sent it. A train from Nashville started there.','✉️ → 🏠','To identifies a destination; from identifies a source in these examples.','Name something that comes from a tree.'],
for:['For can show who is meant to receive something.','This gift is for you means you are supposed to receive it.','🎁','A gift from you identifies who gave it. A gift for you identifies who receives it.','Pretend to give a gift. Say who it is for.'],
but:['But connects ideas that go against an expectation.','The bag is small but heavy. Small might make us expect light; heavy surprises us.','👜','And simply joins the descriptions. But points out the contrast.','Finish: The puppy is small, but…'],
it:['It lets us refer back to a thing without saying its name again.','I found the ball and carried it. It stands for the ball.','⚽','If several things were mentioned, it may be unclear. Ask which thing the word refers to.','Replace the second ball: I found the ball. I kicked the ball.'],
some:['Some means an amount without saying exactly how much.','Some apples are left tells us there are apples left, but gives no exact count.','🍎 🍎 🍎','Three apples tells an exact count. Some apples does not.','Ask for some water, then explain why you did not give an exact amount.'],
all:['All means the whole group or amount we are talking about.','All four dogs came inside means none of those four stayed outside.','🐕 🐕 🐕 🐕','Some dogs came inside could leave others outside. All includes the entire named group.','Point to all the fingers on one hand.'],
'.':['A period helps show that a statement has ended.','The dog is asleep. The dot tells the reader this statement is complete.','The dog is asleep.','A question mark asks a question instead.','Say a short statement. End it with a period when you write it.'],
'?':['A question mark shows that a sentence asks a question.','Where is the puppy? asks us to give information.','Where is the puppy?','The puppy is here. tells us something instead of asking.','Ask someone a question and draw its ending mark.'],
'!':['An exclamation mark can show a strong feeling or urgent message.','Watch out! is an urgent warning. The mark adds emphasis.','Watch out!','A quiet statement can end with a period. An exclamation mark is not needed after every sentence.','Say Watch out with urgency, then say a quiet statement.'],
'+':['Plus means add in this math use.','Two apples plus one apple makes three apples. We join the amounts.','🍎 🍎 + 🍎 = 🍎 🍎 🍎','The plus sign does not say to take something away.','Use two fingers on one hand and one on the other. Count them together.'],
'−':['Minus means take away or find a difference in this use.','Start with three counters. Take away one. Two remain: 3 − 1 = 2.','● ● ● − ● = ● ●','Adding one would make more; subtracting one makes one fewer here.','Put down three objects. Take one away.'],
'=':['Equals means the two sides have the same value.','Two plus one has the same value as three. Both sides show an amount of three.','● ● + ● = ● ● ●','Equals does not just announce an answer. You can also write 3 = 2 + 1.','Show three fingers on one hand and three objects. The amounts match.']
};
const approaches={
connections:'Look at the two ideas joined by this word. Decide whether the connection is a reason, a contrast, a time order, or a condition. Changing the connector changes that relationship.',
senses:'Keep the spelling, then change the setting. The sentence gives clues that select this particular meaning. A different setting can select a different meaning of the same word.',
parts:'Find the base word, then separate the added part. Predict how the part changes the base meaning. Recombine the parts and check the whole word in a sentence; letter patterns alone are not proof.',
precision:'Compare the exact claim with a nearby meaning. Ask what must be true for this word to fit. The distinction below matters more than memorizing a similar-sounding definition.',
academic:'Turn the definition into an action or a question. Ask what a person using this concept would do or look for. Then connect that action to the worked example.',
language:'Identify the layer of language this term describes: sounds, writing, word structure, sentence structure, meaning, or use. Look for that feature in the example.',
punctuation:'Read the sentence aloud. Notice what the mark groups, separates, ends, or emphasizes. Then imagine replacing it with another mark and consider how the message changes.',
math:'Translate the notation into spoken words. Identify the quantities it connects and the operation or relationship it states. Read the complete expression, not just the mark.',
advanced:'Name the subject and read the notation around this symbol. Its meaning depends on that setting. Translate the entire statement into words before using it.',
digital:'Locate this sign on a label, screen, or measurement. Read the surrounding text or unit. The same shape can do a different job in a different system.',
little:'Find the other words this small word connects or points to. Think about who, what, where, or when. It may describe a relationship instead of something you can picture.',
everyday:'Picture the action, object, or feeling. Identify the feature that makes this word fit. Then compare it with the contrasting idea below.'
};
export function teachingFor(e){const authored=simple[e.term]&&!(e.term==='!'&&e.world==='math')&&!(e.term==='−'&&e.id==='math.21')?simple[e.term]:null;
 if(authored)return {simple:authored[0],why:authored[1],picture:authored[2],contrast:authored[3],activity:authored[4],example:e.examples[0],second:e.examples[1]};
 return {simple:e.meaning,why:approaches[e.world]||'Connect this meaning to the example, then explain the difference from another sense.',picture:WORLDS.find(w=>w.id===e.world)?.icon||'📖',contrast:e.trap,activity:e.kind==='symbol'?'Read the example aloud using words in place of the symbol. Explain what information the symbol adds.':e.kind==='part'?'Break a word in the example into parts. Say what this part contributes.':'Say the example in your own words. Explain why this meaning fits, then make a new example.',example:e.examples[0],second:e.examples[1]};
}
export function courseQuestion(e,phase,index=0){const t=teachingFor(e);const alternatives=ENTRIES.filter(x=>x.world===e.world&&x.id!==e.id&&gradeFor(x)<=Math.max(gradeFor(e),1)&&teachingFor(x).simple!==t.simple);const fallback=ENTRIES.filter(x=>x.id!==e.id&&teachingFor(x).simple!==t.simple);const wrong=(alternatives[index%Math.max(1,alternatives.length)]||fallback[index%fallback.length]);const meanings=[t.simple,teachingFor(wrong).simple];if((e.id.length+index)%2)meanings.reverse();return {prompt:phase==='guided'?`Let's explain “${e.term}” together.`:`What does “${e.term}” mean here?`,example:phase==='guided'||index===0?t.example:t.second,choices:meanings,answer:t.simple,why:t.why};}
