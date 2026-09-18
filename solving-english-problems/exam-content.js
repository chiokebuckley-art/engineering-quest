// Placement exam item bank for Solving English Problems.
// Six skill areas × three tiers × three original items. The correct option is always index 0 here;
// exam.js shuffles options with a seeded generator before anything is shown. All wording is original.
export const AREAS=[
 {id:'words',title:'Small common words',short:'Small words',icon:'◌',blurb:'the, of, in, because, unless — the little words that carry most of the meaning.'},
 {id:'parts',title:'Word parts',short:'Word parts',icon:'⬡',blurb:'Prefixes, roots and suffixes that unlock long words: re-, un-, port, -ful, bio-.'},
 {id:'jobs',title:'Word jobs & sentence parts',short:'Sentence parts',icon:'▱',blurb:'Nouns, verbs, adjectives, subjects, predicates, fragments and run-ons.'},
 {id:'build',title:'Building sentences & meaning',short:'Building',icon:'▤',blurb:'Putting words in order, connectors, and what a sentence really claims.'},
 {id:'reading',title:'Reading & understanding',short:'Reading',icon:'♧',blurb:'Reading short texts, finding evidence, inferring, and spotting weak claims.'},
 {id:'symbols',title:'Punctuation & symbols',short:'Symbols',icon:'✒',blurb:'End marks, commas, apostrophes, quotation marks, and signs like %, × and ≠.'},
];
export const TIERS=3;
const I=(id,area,tier,prompt,options,why,read)=>({id,area,tier,prompt,options,why,read:read||prompt});
export const ITEMS=[
 // ---- words
 I('w1a','words',1,'The cat is ___ the box. The cat is inside.',['in','on','under','by'],'“In” means inside a space.'),
 I('w1b','words',1,'Which word means “more than one, but not all”?',['some','a','the','it'],'“Some” points to a few of a group.'),
 I('w1c','words',1,'The ball is ___ the table. It rests on top.',['on','in','under','from'],'“On” means resting on a surface.'),
 I('w2a','words',2,'We stayed inside ___ it was raining.',['because','although','unless','until'],'“Because” gives the reason.'),
 I('w2b','words',2,'In which sentence does “it” point back to the kite?',['Sam flew the kite, and it rose high.','Sam flew the kite, and it was cold.','It was Sam who flew the kite.','It rained on Sam.'],'Only the first “it” is the kite; the others are the weather or a filler.'),
 I('w2c','words',2,'Choose the word that means “not any”.',['none','some','each','both'],'“None” means not one.'),
 I('w3a','words',3,'“The bridge will hold unless the river rises.” When will the bridge NOT hold?',['If the river rises','If the river stays low','Whenever it rains','Never'],'“Unless” means “except if”.'),
 I('w3b','words',3,'Which sentence uses “whereas” correctly?',['Cats purr, whereas dogs bark.','Cats purr whereas they are happy.','Whereas the cat, it purred.','Cats purr, whereas.'],'“Whereas” contrasts two complete ideas.'),
 I('w3c','words',3,'“Each student received a book” means…',['Every single student got a book','One student got all the books','The students shared one book','No student got a book'],'“Each” treats the members one by one.'),
 // ---- parts
 I('p1a','parts',1,'“Replay” means…',['play again','stop playing','play badly','play first'],'“Re-” means again.'),
 I('p1b','parts',1,'Which word part means “not”?',['un-','re-','-ful','-er'],'“Un-” makes a word negative: unhappy.'),
 I('p1c','parts',1,'“Careful” means “full of ___”.',['care','fear','fun','hope'],'“-ful” means full of.'),
 I('p2a','parts',2,'“Transport” has the root “port”, which means…',['carry','see','build','say'],'“Port” means carry, as in portable.'),
 I('p2b','parts',2,'A “submarine” travels ___ the sea.',['under','over','around','across'],'“Sub-” means under.'),
 I('p2c','parts',2,'Which prefix means “before”?',['pre-','post-','mis-','inter-'],'“Pre-” means before: preview, prepay.'),
 I('p3a','parts',3,'“Thermometer” joins therm (heat) and meter (measure). It measures…',['heat','light','sound','distance'],'“Therm” means heat.'),
 I('p3b','parts',3,'“Biology” is the study of…',['life','earth','sound','light'],'“Bio” means life; “-logy” means the study of.'),
 I('p3c','parts',3,'In “audible”, “aud” means…',['hear','see','touch','carry'],'“Aud” means hear, as in audio.'),
 // ---- jobs
 I('j1a','jobs',1,'Which word is a naming word (a noun)?',['dog','run','happy','quickly'],'A noun names a person, place or thing.'),
 I('j1b','jobs',1,'Which word tells what someone does (a verb)?',['jumps','tree','blue','very'],'A verb is a doing word.'),
 I('j1c','jobs',1,'In “the fluffy cat”, which word describes the cat?',['fluffy','the','cat','none of them'],'An adjective describes a noun.'),
 I('j2a','jobs',2,'Which one is a complete sentence?',['The dog ran home.','Running home fast.','Because the dog.','After the long walk.'],'A sentence needs a subject and a verb and a complete thought.'),
 I('j2b','jobs',2,'Who is the subject in “My sister paints bright pictures”?',['My sister','paints','bright','pictures'],'The subject is who the sentence is about.'),
 I('j2c','jobs',2,'Which word is an adverb in “She sang softly”?',['softly','she','sang','none of them'],'An adverb describes a verb: sang how? softly.'),
 I('j3a','jobs',3,'Which sentence is a run-on?',['We left early, the road was icy.','We left early because the road was icy.','We left early. The road was icy.','Because the road was icy, we left early.'],'Two complete sentences joined with only a comma is a run-on.'),
 I('j3b','jobs',3,'Which sentence is complex (one main part plus one dependent part)?',['Although it rained, we played.','It rained and we played.','It rained.','We played, and then we ate.'],'“Although it rained” cannot stand alone; it depends on the main part.'),
 I('j3c','jobs',3,'In “The coach handed the team a trophy”, the direct object is…',['a trophy','the team','the coach','handed'],'The trophy is what was handed; the team received it.'),
 // ---- build
 I('b1a','build',1,'Put the words in order: is · cat · the · asleep',['The cat is asleep.','Asleep the is cat.','Cat the asleep is.','Is the asleep cat.'],'Who or what, then what is happening.'),
 I('b1b','build',1,'Which sentence says the dog is the one sleeping?',['The dog sleeps on the bed.','The bed sleeps on the dog.','Sleeps the bed the dog.','On the dog the bed sleeps.'],'Word order tells who does what.'),
 I('b1c','build',1,'“Only Mia ate the cake.” Who ate the cake?',['Mia','Everyone','No one','Mia’s friend'],'“Only” before Mia means nobody else did.'),
 I('b2a','build',2,'Which sentence means the same as “Unless you hurry, we will miss the bus”?',['If you do not hurry, we will miss the bus.','If you hurry, we will miss the bus.','We will miss the bus whether or not you hurry.','Hurry after we miss the bus.'],'“Unless” = “if not”.'),
 I('b2b','build',2,'“Mia ate only the cake.” What did Mia eat?',['The cake and nothing else','Everything except the cake','Some of the cake','The cake and the pie'],'Moving “only” changes what it limits.'),
 I('b2c','build',2,'Which sentence keeps the meaning of “The man with the telescope saw the bird”?',['A man who had a telescope saw the bird.','The man saw a bird that had a telescope.','The bird used a telescope.','The man saw through the bird.'],'“With the telescope” describes the man here.'),
 I('b3a','build',3,'Which sentence best follows “First, soak the beans overnight.”?',['Then rinse them and simmer for an hour.','Beans are a kind of legume.','Yesterday I went hiking.','Finally, buy the beans.'],'Steps in order need a connector like “then”.'),
 I('b3b','build',3,'“Few students passed” and “A few students passed”: which is more hopeful?',['A few students passed','Few students passed','They mean the same','Neither mentions students'],'“A few” counts some successes; “few” stresses how small the number is.'),
 I('b3c','build',3,'Which sentence has two possible meanings?',['Visiting relatives can be tiring.','The train left at noon.','My cousin lives in Ohio.','Snow fell all night.'],'Relatives who visit, or the act of visiting them — both readings work.'),
 // ---- reading
 I('r1a','reading',1,'Read: “Ben has a red hat. The hat is on his head.” Where is the hat?',['On Ben’s head','In a box','On the bed','Under the hat'],'The second sentence says where.'),
 I('r1b','reading',1,'Read: “Ana sees a bug. The bug is big.” What does Ana see?',['A big bug','A big dog','A red hat','A bus'],'Both sentences are about the bug.'),
 I('r1c','reading',1,'Read: “Tom ran to the gate. He was late for the bus.” Why did Tom run?',['He was late.','He saw a dog.','It was raining.','He was tired.'],'The second sentence gives the reason.'),
 I('r2a','reading',2,'Read: “Lena checked the sky, grabbed her umbrella, and left.” What can you work out?',['She thought it might rain.','It was sunny.','She forgot something.','She stayed home.'],'An umbrella after checking the sky hints at rain.'),
 I('r2b','reading',2,'Read: “The pond froze, so the ducks moved to the river.” What made the ducks move?',['The pond froze.','The river froze.','The ducks were hungry.','The river was warm.'],'“So” links the cause to the result.'),
 I('r2c','reading',2,'Read: “Maya practiced every day. By spring she could play the whole song.” The main idea is…',['Practice helped Maya learn the song.','Spring is a season.','Maya dislikes music.','Songs are long.'],'The two sentences together make one point.'),
 I('r3a','reading',3,'Read: “The mayor called the plan a triumph, though the report she cited counted only the first month.” What does the writer suggest?',['The mayor’s evidence is incomplete.','The plan failed.','The report was fake.','The mayor wrote the report.'],'“Only the first month” quietly limits the evidence.'),
 I('r3b','reading',3,'Read: “Sales rose 50% after the ad — from two units to three.” Which is true?',['The percentage makes a tiny change sound big.','Sales tripled.','The ad failed.','Fifty units were sold.'],'Two to three is one extra unit.'),
 I('r3c','reading',3,'A writer says “Nobody could possibly disagree.” This is…',['An overstatement that hides other views.','Proof the claim is true.','A neutral fact.','A question.'],'Strong words are not evidence.'),
 // ---- symbols
 I('s1a','symbols',1,'Which mark ends a question?',['?','.','!',','],'A question mark ends a question.'),
 I('s1b','symbols',1,'Which sentence shows excitement?',['We won!','We won.','We won?','We, won'],'An exclamation mark shows strong feeling.'),
 I('s1c','symbols',1,'In “Sam, Ali, and Jo”, the commas…',['separate items in a list','end the sentence','show a question','join two sentences'],'Commas keep list items apart.'),
 I('s2a','symbols',2,'Which sentence is written correctly?',['It’s cold, so the dog wants its blanket.','Its cold, so the dog wants it’s blanket.','It’s cold, so the dog wants it’s blanket.','Its cold, so the dog wants its blanket.'],'“It’s” = it is; “its” = belonging to it.'),
 I('s2b','symbols',2,'What does % mean in “25% of the class”?',['25 out of every 100','25 students','25 dollars','25 degrees'],'Percent means per hundred.'),
 I('s2c','symbols',2,'In: She said, “Wait here.” — the quotation marks show…',['the exact words she spoke','a list','a question','emphasis'],'Quotation marks wrap spoken words.'),
 I('s3a','symbols',3,'In “3 × 4 = 12”, the symbol × means…',['multiplied by','divided by','plus','minus'],'× is the multiplication sign.'),
 I('s3b','symbols',3,'What does the semicolon do in “The tide rose; the boats lifted”?',['Joins two related complete sentences','Ends a question','Starts a list','Shows possession'],'A semicolon links two complete, related ideas.'),
 I('s3c','symbols',3,'In “x ≠ y”, the symbol ≠ means…',['is not equal to','is greater than','is approximately','is equal to'],'The slash through = means not equal.'),
];
export const BY_ID=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
