export const WORLDS = [
 ['little','Little words, big meaning','the · of · is','Start with the words that hold a sentence together.','🌱',1,'A small word can change who, when, or how many. Read the whole sentence before choosing its meaning.'],
 ['everyday','Everyday explorers','actions · feelings · things','Build clear pictures of everyday words.','🐾',1,'Connect a word to something you can do, see, or feel. Notice the difference between an example and a definition.'],
 ['connections','Connection canyon','because · although · unless','Follow cause, contrast, time, and conditions.','🌉',2,'Connecting words tell you how ideas relate. Ask: is this a reason, a contrast, a choice, or a condition?'],
 ['senses','Many-meaning marsh','bank · light · right','Let the sentence tell you which meaning fits.','🔎',2,'One spelling can have several meanings. Substitute your proposed meaning into the sentence and check whether it still makes sense.'],
 ['parts','Word workshop','prefixes · roots · suffixes','Build and take apart useful word families.','🧩',2,'Word parts are clues, not a guarantee. Some look-alike letter groups are unrelated; confirm your prediction in context.'],
 ['precision','Precision peaks','infer · imply · affect','Untangle easily confused words and ideas.','🏔️',3,'Close meanings are not always interchangeable. Look at who is acting, what evidence is available, and what the sentence actually claims.'],
 ['academic','Knowledge observatory','analyze · evidence · model','Understand the language of learning and science.','🔭',3,'Academic words name thinking tools. A model represents something; a hypothesis can be tested; evidence supports a conclusion.'],
 ['language','Language laboratory','lemma · syntax · pragmatics','Discover how language makes meaning.','💬',3,'Language has sounds, word parts, sentence structures, meanings, and social uses. These layers work together when you understand a message.'],
 ['punctuation','Punctuation port','. , ? ! : ;','Read the signals that organize writing.','✒️',1,'Punctuation helps organize meaning. A mark can have different jobs in writing, mathematics, and computer code.'],
 ['math','Number constellation','+ − × ÷ =','Translate arithmetic and algebra into words.','✨',1,'Read both sides of a mathematical relationship. The equals sign states that two expressions have the same value.'],
 ['advanced','Symbol summit','∈ ∑ ∫ ⇒','Explore geometry, sets, logic, and calculus.','🪐',4,'Always identify the subject and convention. A symbol is a written form, not a single universal meaning.'],
 ['digital','Signals & systems','@ # % ° Ω','Decode digital, scientific, and everyday signs.','📡',2,'Units, signs, and digital symbols depend on their setting. Read neighboring letters and numbers before interpreting a mark.']
].map(([id,name,teaser,description,icon,level,lesson])=>({id,name,teaser,description,icon,level,lesson}));
// Original plain-language instructional entries. Fields: term | meaning | context 1 | context 2 | misconception | level.
const rows={
little:`
the|Points to a particular person or thing the listener can identify.|Please close the door next to you.|The dog we met is back.|The does not mean any one of a kind.|1
a|Introduces one nonspecific member of a group, before a consonant sound.|We saw a dog in the park.|I need a pencil to write.|A is chosen by sound: a unicorn, but an hour.|1
an|Introduces one nonspecific member of a group, before a vowel sound.|She ate an apple.|We waited an hour.|The sound matters, not just the first letter.|1
is|Links one subject to a present description or identity.|The puppy is small.|My brother is a swimmer.|Is can also help another verb, as in is running.|1
are|Links you or a plural subject to a present description or identity.|The dogs are friendly.|You are the leader.|Are does not always describe an action.|1
was|Links I, he, she, it, or a singular subject to a past description or state.|The room was quiet yesterday.|I was tired after the walk.|Was points to the past, not the present.|1
were|Links you or a plural subject to a past description or state.|We were ready before lunch.|The kittens were sleepy.|Were is also used in some imagined situations.|1
of|Shows a relationship such as belonging, a part, or contents.|The roof of the house is red.|She drank a cup of water.|Of has no single picture that fits every use.|1
to|Indicates a destination in this use.|We walked to the library.|Send the letter to Grandma.|To also has other uses, including to run.|1
from|Indicates a source or starting point.|The train came from Nashville.|I got a letter from my friend.|From identifies where something starts or comes from.|1
in|Inside a space or area in this use.|The toy is in the box.|The fish swims in the pond.|In can also refer to time, as in in June.|1
on|Touching and supported by a surface in this use.|The cup is on the table.|A book rests on the shelf.|On has many other uses, as in on Tuesday.|1
under|In a lower position than something.|The dog sleeps under the table.|We stood under the bridge.|Under can also mean less than a limit.|1
with|Together with or accompanied by.|I walked with my sister.|The puppy stayed with us.|With can also identify a tool, as in with a spoon.|1
for|Indicates an intended recipient in this use.|This gift is for you.|I left food for the dog.|For can also indicate duration or purpose.|1
and|Joins items or ideas together.|Ian and Myla read.|We need paper and a pencil.|And combines; it does not set up a contrast.|1
or|Presents alternatives in this use.|Choose an apple or a pear.|We can walk or ride.|In logic, or can include both alternatives.|1
but|Joins ideas that contrast.|The bag is small but heavy.|It rained, but we played inside.|But points out a difference from what you might expect.|1
not|Makes a statement negative.|The dog is not asleep.|This is not my coat.|Not changes the truth of the statement it applies to.|1
it|Refers to a thing or animal already identified in this use.|I found the ball and carried it.|The puppy is small; it fits here.|The word it needs a clear reference in these examples.|1
they|Refers to people already identified; can also refer to one person.|The children said they were ready.|Sam said they would arrive soon.|They can be plural or singular.|2
this|Points to one nearby thing in this use.|This book in my hand is new.|This chair beside me is yours.|This can also refer to an idea just mentioned.|1
that|Points to one more distant thing in this use.|That bird across the field is blue.|That house over there is old.|That has other grammatical jobs in other sentences.|1
some|An unspecified amount or number.|There are some apples left.|Please pour some water.|Some does not specify an exact number.|1
all|Every member or the whole amount in the named group.|All four dogs came inside.|We used all the paint in the can.|All applies to the group or amount the sentence identifies.|1
each|Every member considered individually.|Give each child a pencil.|Each puppy has a bowl.|Each directs attention to members one at a time.|2
any|One or more without selecting a particular member in this use.|Choose any card from the deck.|You may sit in any empty chair.|Any behaves differently in questions and negative sentences.|2
only|Limits the statement to the named person, thing, or amount.|Only Mia has the key.|We have only two tickets.|Moving only can change what is limited.|2
as|In the role of in this use.|She works as a teacher.|Use the box as a seat.|As also appears in comparisons and time clauses.|2
by|Identifies the doer in this use.|The cake was baked by Dad.|The picture was drawn by Ella.|By can also refer to location, method, or a deadline.|2`,
everyday:`
dog|A domesticated animal often kept as a companion.|The dog wagged its tail.|We took the dog for a walk.|Not every four-legged animal is a dog.|1
puppy|A young dog.|The puppy is learning to sit.|A tiny puppy followed its mother.|Puppy names an age stage, not a breed.|1
rescue|To bring someone or something out of danger.|We will rescue the stranded puppy.|The team came to rescue the hikers.|Rescue involves helping out of danger or difficulty.|1
share|To use or have something together with others.|We share the crayons.|The children share a room.|Sharing does not always mean cutting into equal pieces.|1
observe|To look at or notice something carefully.|Observe how the seed grows.|We observe the birds without touching them.|Observing means gathering information, not just guessing.|1
compare|To examine similarities and differences.|Compare the two leaves.|We compare the lengths of the sticks.|Compare does not mean only finding what is different.|2
sort|To arrange things into groups using a rule.|Sort the buttons by color.|We sort books by subject.|The sorting rule must be stated or inferred.|1
before|Earlier in time than something.|Wash your hands before dinner.|We arrived before the game began.|Before can describe location in other contexts.|1
after|Later in time than something.|We read after lunch.|The sun appeared after the rain.|After does not tell you the exact amount of time.|1
between|In the space separating identified things.|The puppy sat between two chairs.|The path runs between the houses.|Between is not limited to every situation with exactly two things.|1
beside|Next to something.|Sit beside me.|The lamp is beside the bed.|Beside differs from besides, meaning in addition.|1
through|From one side or end to another inside something.|The train went through the tunnel.|We walked through the doorway.|Through describes a path, not just a destination.|1
similar|Alike in some ways.|These leaves have similar shapes.|Our shoes are similar colors.|Similar does not mean identical.|2
identical|Exactly alike in the relevant features.|The two printed patterns are identical.|These keys have identical shapes.|Identical needs a clear basis for comparison.|2
fragile|Easily broken or damaged.|The glass ornament is fragile.|Carry the fragile model carefully.|Fragile does not mean already broken.|2
curious|Eager to find out or learn in this use.|The curious child asked why.|A curious puppy sniffed the box.|Curious can also mean unusual in another context.|1
frustrated|Upset because something is difficult or blocked.|I felt frustrated when the puzzle would not fit.|She was frustrated by the delay.|Being frustrated does not mean being incapable.|2
patient|Able to wait or persist calmly in this use.|Be patient while the glue dries.|The patient teacher explained again.|Patient can also mean a person receiving medical care.|2
brave|Willing to act despite fear or difficulty.|The brave child asked for help.|It was brave to admit the mistake.|Brave does not require having no fear.|1
fair|Treating people justly in this use.|We agreed on a fair rule.|Each player got a fair turn.|Fair does not always mean identical treatment.|2
increase|To become or make greater.|We increase the volume.|The plants increase in height.|Increase describes a change upward, not a final size.|2
decrease|To become or make smaller.|Decrease the brightness.|The number of clouds began to decrease.|Decrease describes a change downward.|2`,
connections:`
because|Introduces a reason.|We stayed inside because it rained.|The ice melted because it warmed up.|A stated reason can still need evidence.|2
therefore|Signals a conclusion from earlier information.|All the lights are off; therefore, the room is dark.|The tank is empty; therefore, we need more water.|Therefore signals reasoning but does not guarantee it is sound.|3
although|Introduces a contrast that does not stop the main event.|Although it rained, we took a walk.|Although the box is small, it is heavy.|Although does not mean because.|2
unless|Except if; introduces a condition that changes what follows.|We will play outside unless it rains.|The door stays locked unless you use the key.|Unless it rains means if it does not rain in this example.|3
if|Introduces a condition or possibility.|If it rains, we will go inside.|If you press the switch, the lamp turns on.|If does not say the condition has happened.|2
then|At the next time or step in this use.|Wash the cup, then dry it.|We ate, then walked home.|Then can also introduce the result of a condition.|2
than|Introduces the second part of a comparison.|The tree is taller than the fence.|Five is greater than three.|Than compares; then often concerns time or sequence.|2
while|During the time that in this use.|Read while I cook.|The dog slept while we talked.|While can also contrast two ideas.|2
since|From a particular past time until a later time in this use.|I have lived here since May.|The shop has been open since nine.|Since can also introduce a reason.|2
until|Up to a particular time.|Wait until the light turns green.|We played until sunset.|Until sets an endpoint for a period or action.|2
despite|Even with a condition that might prevent something.|We walked despite the rain.|She smiled despite the delay.|Despite normally takes a noun phrase or an -ing form.|3
however|Signals a contrast with the preceding idea.|The path is short. However, it is steep.|I like the design. However, it costs too much.|However has other uses, such as however you like.|3
otherwise|If the stated condition is not met in this use.|Wear a coat; otherwise, you may get cold.|Save the file; otherwise, you may lose changes.|Otherwise can also mean in other respects.|3
both|The two members together.|Both doors are open.|Both children have pencils.|Both refers to two, not an unspecified large group.|2
neither|Not one and not the other of two.|Neither door is open.|Neither answer fits the question.|Neither rules out both members of a pair.|3
either|One or the other of two in this use.|You can use either entrance.|Either route will take us home.|Either also appears in negative constructions.|2
except|Leaving out the named exception.|Everyone came except Sam.|All the lights work except this one.|Except excludes; accept means to receive or agree.|2
whether|Introduces alternatives or uncertainty.|I do not know whether it will rain.|Decide whether to walk or ride.|Whether is different from weather.|3`,
senses:`
bank|The land along the edge of a river.|We sat on the bank beside the water.|The canoe reached the muddy bank.|This meaning does not refer to a financial business.|2
bank|A business that holds money and provides financial services.|She deposited money at the bank.|The bank opened a savings account.|This meaning does not refer to the side of a river.|2
light|Visible radiation that lets us see.|Light came through the window.|The lamp produces light.|Here light is not a description of weight.|2
light|Not heavy in this use.|The empty bag is light.|This light box is easy to carry.|A light object need not be bright.|2
right|Correct in this use.|You gave the right answer.|That is the right spelling.|Right can also name a direction or an entitlement.|2
right|The side opposite left.|Turn right at the corner.|Raise your right hand.|A right turn is not necessarily a correct decision.|2
right|An entitlement or justified claim in this use.|Every child has a right to learn.|She asserted her right to speak.|This noun does not name a direction.|3
mean|To signify or express.|What does this sign mean?|By soon, I mean before lunch.|Mean can also describe unkindness or a mathematical average.|2
mean|An arithmetic average in this use.|The mean of 2 and 6 is 4.|Find the mean by adding the values and dividing by their count.|A mean is not always one of the original values.|3
mean|Unkind in this use.|That was a mean remark.|Do not be mean to the new student.|Here mean does not describe an average.|2
charge|To ask for a price in this use.|The shop will charge five dollars.|They charge a fee for delivery.|Charge also has electrical and legal meanings.|3
charge|A physical property involved in electrical interactions.|An electron has negative charge.|Like electric charges repel.|Electrical charge is not the same quantity as current.|4
cell|A basic structural unit of living things.|A leaf contains many cells.|The microscope reveals a single cell.|Cell can also name a compartment or an electrical device.|3
cell|A box at a row-and-column intersection in a table.|Type the number in this spreadsheet cell.|The selected cell is in column B.|Here cell is a table position, not a living structure.|3
volume|The amount of three-dimensional space occupied.|Find the volume of the box.|The liquid has a volume of 200 mL.|Volume is different from surface area.|3
volume|The loudness level of a sound in everyday use.|Turn down the volume of the music.|The television volume is too high.|This use does not measure space inside a container.|2
scale|A tool for measuring weight or mass in this use.|Put the flour on the kitchen scale.|The scale displayed two kilograms.|Scale can also mean a size ratio or a sequence of notes.|2
scale|The relationship between sizes in a representation and reality.|The map scale shows one inch for a mile.|We built a model at a smaller scale.|A scale drawing changes size while preserving chosen proportions.|3
plot|The sequence of events in a story.|The plot follows a lost puppy.|The novel has a surprising plot.|Plot can also mean a graph or a small piece of land.|3
plot|To mark points or data on a graph.|Plot the temperature for each day.|We plot distance against time.|Here plot is an action involving data.|3
product|The result of multiplying numbers.|The product of 3 and 4 is 12.|Find the product of the two factors.|In everyday language, a product can be an item made for use or sale.|2
root|The part of a plant that usually takes in water from soil.|The root grew deeper into the soil.|Water reaches the plant through its roots.|Root can also mean a word base or a mathematical solution.|2
root|A word part that carries a central meaning.|The root bio relates to life.|We recognized the root graph in the word.|Not every apparent letter group is a meaningful root.|3
root|A number that gives a specified value when raised to a given power.|Three is the positive square root of nine.|Two is the cube root of eight.|Root can also mean a solution of an equation.|4`,
parts:`
un-|Not, in words such as unhappy.|Unhappy means not happy.|An unfair rule is not fair.|Un- can also reverse an action, as in untie.|2
re-|Again or back, in words such as reread.|Reread the page to read it again.|Rebuild the tower after it falls.|The letters re are not a prefix in every word.|2
pre-|Before, in words such as preview.|A preview comes before the main showing.|Preheat the oven before cooking.|A word beginning with pre does not always split the same way.|2
mis-|Wrongly or badly, in words such as misread.|To misread is to read incorrectly.|A misprint is a printing error.|Mis- does not simply mean not.|2
dis-|Not, opposite, or reversal in words such as disconnect.|Disconnect means break the connection.|Disagree means not agree.|The exact meaning depends on the word.|2
non-|Not; absence of a quality or category.|Nonfiction is writing not presented as invented fiction.|A nonmetal is not a metal.|Non- does not automatically mean opposite.|2
in-|Not, in words such as inactive.|Inactive means not active.|Incorrect means not correct.|In- can also mean in or into, as in inject through a related form.|3
im-|A form of the negative prefix in-, as in impossible.|Impossible means not possible.|Impolite means not polite.|Im- does not have this role in every word beginning im.|3
anti-|Against or opposing.|An antifreeze substance resists freezing.|An antibiotic acts against susceptible bacteria.|Antibiotics do not act against all kinds of microbes.|3
inter-|Between or among.|International means between nations.|Interconnect means connect things with one another.|Inter- differs from intra-, meaning within.|3
intra-|Within.|Intracellular means within a cell.|An intramural contest occurs within an institution.|Intra- differs from inter-, meaning between.|3
sub-|Under or below in these words.|A submarine travels under water.|Subzero means below zero.|Sub- can also suggest a smaller division.|2
super-|Above or beyond in these words.|Supersonic means faster than the speed of sound.|Superhuman means beyond ordinary human ability.|Super- does not simply mean good in every word.|3
trans-|Across or through in these words.|Transatlantic means across the Atlantic.|Transport carries something from one place to another.|Use the full word to check the exact meaning.|3
micro-|Small in general word formation.|A microscope helps us see very small things.|A microorganism is a microscopic organism.|As an SI prefix, micro- specifically means one millionth.|3
macro-|Large or considered on a large scale.|Macroeconomics studies an economy at a broad scale.|A macroscopic object can be seen without a microscope.|Macro- does not mean the same as long.|3
mono-|One or single.|A monorail uses a single rail system.|A monologue is an extended speech by one person.|Meaning still depends on the complete word.|3
bi-|Two in these words.|A bicycle has two wheels.|Bilateral means involving two sides.|Biannual can be confused with biennial; check the full term.|2
tri-|Three.|A triangle has three angles.|A tricycle has three wheels.|The letters tri are not always a prefix.|2
poly-|Many.|A polygon has many sides.|A polymer contains many linked units.|Poly- does not specify an exact number.|3
-ful|Having or full of a quality.|Helpful means giving help.|Hopeful means having hope.|The suffix is spelled with one l.|2
-less|Without.|Careless means without enough care.|A leafless tree has no leaves.|The suffix describes absence; it does not mean fewer.|2
-er|A person or thing that performs an action in these words.|A teacher teaches.|A builder builds.|-er also forms comparisons, as in taller.|2
-est|The greatest degree in a comparison.|The tallest tree is taller than the others.|The fastest runner finished first.|The comparison depends on which group is being compared.|2
-ly|In a particular manner in these words.|Slowly means in a slow manner.|Calmly means in a calm manner.|Not every word ending -ly is an adverb: friendly is an adjective.|2
-ness|A state or quality.|Kindness is the quality of being kind.|Darkness is the state of being dark.|A suffix can change a word's grammatical role.|2
-ment|An action, process, or result in these words.|Movement is the action of moving.|Development is a process of developing.|Do not assume every ending ment can be removed meaningfully.|3
-able|Capable of or suitable for something.|Washable means able to be washed.|Readable means able or easy to be read.|Some words change spelling when the suffix is added.|2
-tion|An action, process, or result in these words.|Creation is an act or result of creating.|Pollution is a process or state of polluting.|A shared suffix does not make the entire word meanings identical.|3
bio|A combining form associated with life.|Biology studies living things.|Biodegradable material can be broken down by living organisms.|A bio clue helps, but the rest of the word matters.|3
geo|A combining form associated with Earth.|Geology studies Earth.|Geothermal heat comes from within Earth.|Geo does not simply mean rock in every word.|3
graph|A root associated with writing or recording.|An autograph is someone's own written signature.|A seismograph records ground motion.|Graph has related meanings in mathematics.|3
phon|A root associated with sound.|A microphone receives sound.|Phonetics studies speech sounds.|Phon does not mean letter.|3
photo|A combining form associated with light.|Photosynthesis uses light energy.|A photodetector detects light.|Photo is not always a reference to a photograph.|3
therm|A root associated with heat.|A thermometer measures temperature.|Thermal energy relates to temperature and microscopic motion.|Temperature and heat are related but different quantities.|3
hydro|A combining form associated with water.|Hydroelectric power uses moving water.|Hydrology studies water.|A word containing hydro may need a technical definition.|3
auto-|Self or one's own.|An autobiography is a person's account of their own life.|An automatic process can act by itself under set conditions.|Auto is also a shortened word for automobile.|3
tele-|At a distance.|A telescope helps us see distant objects.|Telecommunication carries information over a distance.|Tele- does not mean television in every word.|3
-ology|A field of study in these words.|Biology is the study of life.|Geology is the study of Earth.|Not every word ending in similar letters can be decoded mechanically.|3`,
precision:`
affect|To influence or change something, usually a verb.|Rain can affect our plans.|Sleep can affect attention.|Affect is usually a verb; effect is usually a noun.|3
effect|A result or consequence, usually a noun.|The new rule had an effect.|We measured the effect of temperature.|Effect can also be a verb meaning bring about.|3
infer|To draw a conclusion from evidence or reasoning.|I infer from the wet road that it rained.|Readers infer the character's feelings from her actions.|The reader infers; a speaker can imply.|3
imply|To suggest something without stating it directly.|Her remark may imply disagreement.|The dark clouds imply a chance of rain to the observer.|An implication is not always proof.|3
literal|Using the ordinary direct meaning in this use.|A literal reading of frozen lake describes ice.|I literally placed the book on the shelf.|Figurative expressions often do not describe literal events.|3
figurative|Using words beyond their ordinary direct meaning for an effect.|A heart of gold is a figurative expression.|The homework was a mountain is figurative.|A figurative comparison is not necessarily a false attempt at a factual claim.|3
possible|Able to happen or be true.|Rain tomorrow is possible.|It is possible to solve the puzzle.|Possible does not mean likely or certain.|2
probable|Likely to happen or be true.|Rain is probable with these clouds.|Given the evidence, that explanation is probable.|Probable is stronger than merely possible but not certain.|3
necessary|Required for a stated purpose or result.|Water is necessary for this plant to live.|A ticket is necessary to enter this event.|A necessary condition may not be sufficient by itself.|3
sufficient|Enough to meet a stated need or condition.|Ten dollars is sufficient to buy the five-dollar book.|We have sufficient fuel for this short trip.|Sufficient does not mean necessary or excessive.|3
correlation|An association in how variables vary.|There is a correlation between height and shoe size.|The data show a correlation between two measurements.|Correlation alone does not establish causation.|4
causation|A relationship in which one factor brings about a change in another.|Heating caused the ice to melt; this is causation.|The experiment investigates causation, not just association.|An observed sequence alone does not prove a causal link.|4
accurate|Close to the true or accepted value in this use.|The accurate measurement is close to the reference.|The clock is accurate to within a second.|Repeated measurements can be consistent but inaccurate.|3
precise|Closely agreeing across repeated measurements in this use.|The precise readings cluster closely together.|This instrument gives precise repeated results.|Precision does not ensure closeness to the true value.|4
valid|Having a logical structure where true premises guarantee the conclusion.|The argument is valid even though a premise is false.|Check whether this deduction is valid.|A valid deductive argument need not have true premises.|4
sound|Deductively valid and having true premises.|A sound argument needs true premises and valid reasoning.|The deduction is sound because both requirements are met.|Sound here does not refer to something you hear.|4`,
academic:`
analyze|To examine parts and their relationships.|Analyze the sentence by identifying its parts.|We analyze the results for patterns.|Analysis involves relationships, not just splitting things apart.|3
evidence|Information used to support or challenge a claim.|The measurements provide evidence.|We looked for evidence that the plant grew.|Evidence can vary in quality and strength.|3
claim|A statement presented as true.|Her claim was that the bridge is safe.|We tested the claim with measurements.|A claim is not automatically established fact.|3
hypothesis|A proposed explanation or prediction that can be tested.|Our hypothesis predicts faster growth in light.|The experiment tests the hypothesis.|A hypothesis is not merely any random guess.|3
theory|A broad explanatory framework supported by evidence in science.|Atomic theory explains properties of matter.|A scientific theory can generate testable predictions.|In everyday use, theory can mean a guess; the scientific use is stronger.|4
model|A representation used to describe, explain, or predict.|The globe is a model of Earth.|The mathematical model predicts motion.|A model simplifies and has limitations.|3
variable|A quantity or feature that can take different values.|Temperature is a variable in the experiment.|Let the variable x represent the unknown distance.|Variables are not always unknown values.|3
constant|A quantity held fixed in a stated context.|We kept the water volume constant.|In this formula, pi is a constant.|A factor can be constant in one experiment and variable in another.|3
context|The surrounding information or situation that helps determine meaning.|Use the context to interpret bank.|The context of the conversation changed the joke's meaning.|An isolated word may not reveal its intended sense.|2
define|To state what a word or concept means.|Define triangle before using the term.|We define speed as distance traveled per unit time.|An example helps explain a definition but may not define the category.|2
interpret|To work out or explain a meaning.|Interpret the chart using its labels.|We interpret the message in context.|An interpretation should fit the available evidence.|3
summarize|To state the main points briefly.|Summarize the paragraph in one sentence.|We summarize the findings at the end.|A summary preserves central meaning while leaving out details.|2
contrast|To examine or show differences.|Contrast the two methods.|The paragraph contrasts winter and summer.|Comparison can include similarities as well as differences.|3
classify|To place into categories using relevant features.|Classify the animals by shared traits.|We classify triangles by their angles.|The classification depends on the rules chosen.|3
assumption|Something accepted as a starting point without establishing it in that argument.|Our estimate uses the assumption of steady speed.|We questioned the hidden assumption.|An assumption can be reasonable without being proven.|4
ambiguous|Having more than one plausible interpretation.|The ambiguous message could refer to either person.|The instruction is ambiguous about when to start.|Ambiguous means multiple interpretations, not necessarily no meaning.|3
explicit|Stated directly and clearly.|The sign gives explicit instructions.|She made an explicit request to stop.|Explicit here does not mean adult content.|3
implicit|Suggested or understood without being directly stated.|The invitation carried an implicit offer of help.|The rule contains an implicit assumption.|Implicit meanings depend on context and can be misunderstood.|4
relevant|Connected to the question or purpose at hand.|Choose evidence relevant to the claim.|That detail is relevant to our decision.|Something can be true but irrelevant to a particular question.|3
consistent|Compatible or not contradicting within a stated context.|Her account is consistent with the recording.|Use a consistent rule for sorting.|Consistency alone does not prove truth.|3`,
language:`
linguistics|The scientific study of language.|Linguistics examines how people use language.|We study speech sounds in linguistics.|Linguistics includes more than learning foreign languages.|3
corpus|A collection of language samples used for study.|The researchers searched a corpus of conversations.|A written corpus can contain newspaper articles.|The plural of corpus is corpora.|3
lemma|A dictionary-style headword representing related inflected forms.|Run is the lemma for runs and running.|The forms walks and walked share the lemma walk.|A lemma is not the same unit as a word family or word sense.|3
token|One occurrence of a word in a text in this linguistic use.|In dog dog, there are two word tokens.|Count every occurrence when counting tokens.|Computing and AI use token with other segmentation rules.|3
type|A distinct word form counted once in this linguistic use.|Dog dog has one word type but two tokens.|Cat and cats are two written word-form types.|Type counts depend on normalization and tokenization choices.|3
word family|A base word and related forms grouped by chosen rules.|Help, helpful, and helpless can form a word family.|Word family counts depend on which derivatives are included.|Word families and lemmas are different counting units.|3
sense|A particular meaning of a word or expression.|Bank has a river-edge sense.|Choose the sense that fits the sentence.|Knowing one sense does not prove you know every sense.|3
morpheme|A smallest unit that carries meaning or grammatical function.|Dogs contains dog and the plural morpheme -s.|Unhappy contains two morphemes.|A morpheme need not be a complete standalone word.|3
phoneme|A sound category that can distinguish words in a language.|Changing one phoneme turns pat into bat in English.|The sounds /p/ and /b/ can distinguish words.|A phoneme is not a written letter.|3
grapheme|A unit of a writing system used to represent language.|The letter b is an English grapheme.|In some analyses, sh is a grapheme representing one sound.|Grapheme analysis can vary by writing system and framework.|3
phonetics|The study of the production and physical properties of speech sounds.|Phonetics examines how the lips produce a sound.|We measure sound waves in phonetics.|Phonetics and phonology overlap but ask different questions.|4
phonology|The study of how sound systems work in languages.|Phonology studies patterns of sound contrasts.|English phonology restricts some sound sequences.|Phonology is not simply spelling.|4
morphology|The study of word structure and meaningful word parts.|Morphology examines un-help-ful.|We study plural endings in morphology.|A syllable is not necessarily a morpheme.|3
syntax|The patterns and rules for combining words into phrases and sentences.|Syntax distinguishes dog bites man from man bites dog.|We changed the syntax by rearranging the phrase.|Syntax concerns structure, not just punctuation.|3
semantics|The study of meaning in language.|Semantics examines the meanings of words and sentences.|We compared the semantics of the two expressions.|Meaning also depends on use and context, studied in pragmatics.|3
pragmatics|The study of how context and use contribute to meaning.|Pragmatics explains why Can you pass the salt? can be a request.|Tone and situation matter in pragmatics.|The intended action can go beyond literal sentence meaning.|4
noun|A word class often naming a person, place, thing, or idea.|Puppy is a noun in The puppy sleeps.|Kindness is an abstract noun.|Word classes depend on grammatical behavior, not just meanings.|2
verb|A word class expressing actions, events, or states.|Runs is a verb in She runs.|Seems is a verb in It seems fine.|Not all verbs describe visible physical actions.|2
adjective|A word class that typically describes or classifies a noun.|Small is an adjective in a small dog.|The word wooden is an adjective in wooden chair.|Some words belong to different classes in different uses.|2
adverb|A word class that can modify verbs, adjectives, other adverbs, or clauses.|Slowly is an adverb in Walk slowly.|Very modifies tall in very tall.|Adverbs do not all end in -ly.|3
pronoun|A word that can refer to a person or thing without repeating its name.|She refers to Maya in Maya said she was ready.|It stands for the book already mentioned.|A pronoun's reference must be recoverable from context.|2
preposition|A word that typically introduces a phrase showing a relationship.|Under is a preposition in under the table.|Of begins a prepositional phrase in the roof of the house.|Prepositions express more than physical locations.|3
synonym|A word with the same or a similar meaning in a given context.|Large and big are near synonyms in a big box.|Happy and glad can be synonyms in some sentences.|Synonyms are not interchangeable in every context.|2
antonym|A word with an opposite meaning in a relevant comparison.|Hot and cold are antonyms.|Open and closed can be antonyms.|Some opposites allow degrees; others name contrasting states.|2
homophone|A word pronounced like another word but differing in meaning.|Sea and see are homophones for many speakers.|To and two are homophones in common English pronunciation.|Pronunciation varies by dialect.|3
polysemy|The presence of multiple related meanings in one word.|Head can mean a body part or the leader of a group: polysemy.|The meanings of foot can illustrate polysemy.|Unrelated same-form words are often analyzed as homonyms.|4
idiom|An expression whose overall meaning is not fully predicted from its parts.|Spill the beans is an idiom meaning reveal a secret.|Under the weather is an idiom for feeling unwell.|Idioms must be learned in use, not just word by word.|3
metaphor|A comparison that presents one thing in terms of another without a literal claim of identity.|Time is a river is a metaphor.|Calling a learner a sponge uses metaphor.|A metaphor highlights some similarities, not every feature.|3
register|A variety of language associated with a situation or purpose.|A job application usually uses a formal register.|Friends may use an informal register.|Different registers can be appropriate in different settings.|4
dialect|A systematic variety of a language associated with a community or region.|A dialect can differ in vocabulary and grammar.|Speakers may switch between dialect features.|A dialect is not broken or inferior language.|4`,
punctuation:`
.|A period marks the end of a statement in this use.|The dog is asleep.|We walked home.|A period also occurs in abbreviations and decimal notation.|1
?|A question mark ends a direct question.|Where is the puppy?|Are you ready?|Indirect questions do not automatically need a question mark.|1
!|An exclamation mark can signal strong feeling or emphasis.|Watch out!|What a wonderful surprise!|In mathematics, ! can instead mean factorial.|1
,|A comma separates items or parts of a sentence.|We need apples, pears, and grapes.|After lunch, we read.|A comma is not simply placed wherever you pause to breathe.|2
'|An apostrophe can show omitted letters in a contraction.|Do not becomes don't.|It is becomes it's.|Its is possessive; it's means it is or it has.|2
'|An apostrophe can mark possession in this use.|The dog's bowl is full.|Maya's book is on the table.|Ordinary plural nouns usually do not need an apostrophe.|2
“ ”|Quotation marks enclose direct speech or quoted wording in this use.|She said, “Come inside.”|The sign reads “Keep left.”|Quotation conventions differ among languages and styles.|2
:|A colon introduces an explanation or list after an appropriate lead-in.|Bring these things: water, a hat, and a map.|The answer is simple: practice.|A colon also separates hours and minutes in time notation.|3
;|A semicolon can join closely related independent clauses.|The rain stopped; we went outside.|The room was quiet; everyone was reading.|Each side can stand as a sentence in this use.|3
—|An em dash sets off a break or added explanation.|The puppy—our newest friend—fell asleep.|One thing mattered—getting home.|An em dash is different from a hyphen or minus sign.|3
-|A hyphen joins parts of some compound words.|It was a well-known story.|We saw a blue-green bird.|A hyphen is not always interchangeable with a dash or minus sign.|2
( )|Parentheses enclose extra information in writing.|Maya (our guide) led the way.|The trip (about an hour) was pleasant.|In mathematics parentheses often group expressions.|2
…|An ellipsis can show omitted words or trailing speech.|The quoted passage begins “We walked … home.”|“I thought perhaps…” she began.|Omitting words must not distort the original meaning.|3
/|A slash separates alternatives in this use.|The form asks for yes/no.|The switch is labeled on/off.|A slash can also indicate division or part of a path.|2
[ ]|Square brackets can mark editorial additions inside a quotation.|The quote reads “She [Maya] returned.”|The editor added “[emphasis added]” to the quotation.|Brackets have different meanings in mathematics and programming.|4`,
math:`
+|Add the quantities on either side.|3 + 2 = 5.|7 + 1 = 8.|Plus can have different uses in programming.|1
−|Subtract the quantity that follows in this use.|8 − 3 = 5.|10 − 4 = 6.|The same sign can also indicate a negative number.|1
×|Multiply in this arithmetic use.|3 × 4 = 12.|2 × 5 = 10.|Multiplication is not the same operation as addition.|1
÷|Divide the quantity on the left by the quantity on the right.|12 ÷ 3 = 4.|10 ÷ 2 = 5.|Division by zero is undefined in ordinary arithmetic.|1
=|The expressions on both sides have the same value.|3 + 2 = 5.|7 = 4 + 3.|Equals does not mean the answer comes next.|1
≠|The expressions have different values.|3 ≠ 5.|2 + 2 ≠ 7.|Not equal says nothing by itself about which value is larger.|2
<|The value on the left is smaller than the value on the right.|3 < 5.|−2 < 1.|Read the relationship from left to right.|2
>|The value on the left is larger than the value on the right.|8 > 2.|5 > −1.|The sign compares values, not the number of digits alone.|2
≤|Less than or equal to.|x ≤ 5 allows x to be 5.|3 ≤ 3 is true.|The equality case is included.|3
≥|Greater than or equal to.|x ≥ 2 allows x to be 2.|5 ≥ 4 is true.|The equality case is included.|3
≈|Approximately equal to.|3.14159 ≈ 3.14.|1.999 ≈ 2.|Approximately equal is not exact equality.|3
%|Per hundred.|25% means 25 out of 100.|50% equals one half.|The quantity being compared must be identified.|2
½|One of two equal parts of a whole.|½ of eight is four.|Two halves make one whole.|Equal parts matter when defining halves.|1
²|Raised to the second power in this use.|5² means 5 × 5.|3² equals 9.|Squaring a number does not mean multiplying it by two.|3
³|Raised to the third power in this use.|2³ means 2 × 2 × 2.|4³ equals 64.|Cubing a number does not mean multiplying it by three.|3
√|The principal nonnegative square root for a nonnegative real input.|√9 = 3.|√16 = 4.|The equation x² = 9 has two real solutions, but √9 is 3.|3
π|The ratio of a circle's circumference to its diameter.|The circumference is π times the diameter.|π is approximately 3.14159.|Pi is not exactly 3.14 or 22/7.|3
±|Indicates both plus and minus cases.|x = ±3 means x is 3 or −3.|The solutions are 2 ± 1.|In measurements, ± often expresses an uncertainty or tolerance.|4
( )|Group expressions to specify an operation order.|(2 + 3) × 4 = 20.|10 ÷ (2 + 3) = 2.|Parentheses also have uses in writing and function notation.|2
:|Expresses a ratio in this use.|A ratio of 2:3 compares two quantities.|The mixture uses water and juice in a 4:1 ratio.|The order of the compared quantities matters.|3
−|Marks a negative number in this use.|−3 is less than zero.|The temperature is −2 degrees.|A negative sign can belong to a number without showing subtraction between two expressions.|2
!|Factorial of a nonnegative integer in this use.|4! = 4 × 3 × 2 × 1.|3! = 6.|0! is defined as 1; this is not an exclamation mark here.|4
| | |Absolute value: distance from zero on the number line.|The absolute value of −3 is 3.|The absolute value of 5 is 5.|Absolute value is never negative for real inputs.|3`,
advanced:`
∠|Denotes an angle.|∠ABC has vertex B.|Measure ∠PQR in degrees.|The middle letter normally names the vertex in three-letter angle notation.|4
°|A degree of angle in this use.|A right angle measures 90°.|A full turn measures 360°.|The degree sign also appears in certain temperature units.|2
⊥|Perpendicular: meeting at a right angle.|Line a ⊥ line b.|The two edges are perpendicular, marked ⊥.|Perpendicular lines do intersect in Euclidean plane geometry.|4
∥|Parallel in this geometry use.|Line a ∥ line b.|The opposite sides of this rectangle are ∥.|This mark also has uses outside geometry.|4
≅|Congruent in this geometry use.|The triangles are congruent, written △ABC ≅ △DEF.|Corresponding sides match when these shapes are ≅.|Congruent means matching shape and size.|4
∼|Similar in this geometry use.|△ABC ∼ △DEF means their shapes match.|These triangles are similar, marked ∼.|Similar shapes can differ in size.|4
∈|Is an element of a set.|3 ∈ {1, 2, 3}.|A number x ∈ A belongs to set A.|Membership differs from a set being a subset.|4
∉|Is not an element of a set.|4 ∉ {1, 2, 3}.|If x ∉ A, x is not a member of A.|This says nothing about membership in some other set.|4
⊆|Is a subset of, possibly equal to.|{1, 2} ⊆ {1, 2, 3}.|Every set A satisfies A ⊆ A.|Every member of the smaller set must belong to the other set.|4
∪|The union of sets: elements in either set or both.|{1, 2} ∪ {2, 3} = {1, 2, 3}.|A ∪ B combines their members.|Repeated members are listed only once in a set.|4
∩|The intersection of sets: elements in both.|{1, 2} ∩ {2, 3} = {2}.|A ∩ B contains shared members.|Intersection is different from union.|4
∅|The empty set, containing no elements.|The set of real numbers satisfying x² = −1 is ∅.|A set with no members is ∅.|The empty set differs from a set containing zero.|4
∞|Infinity: unboundedness in this use.|The sequence 1, 2, 3, … grows toward ∞.|We consider a limit as x tends to ∞.|Infinity is not an ordinary real number.|4
∑|A summation: add the specified terms.|∑ from k = 1 to 3 of k means 1 + 2 + 3.|The symbol ∑ directs you to sum the indexed values.|Read the index and bounds, not just the symbol.|4
∏|A product: multiply the specified terms.|∏ from k = 1 to 3 of k means 1 × 2 × 3.|The symbol ∏ directs multiplication over an index.|This capital pi differs from lowercase π used for the circle constant.|4
Δ|Change in a quantity in this use.|Δt means a change in time.|Δx can mean final position minus initial position.|Delta has other uses; check the definition in the problem.|4
⇒|Logically implies in this use.|x = 2 ⇒ x² = 4.|Being a square ⇒ being a rectangle.|An implication does not automatically work in reverse.|4
⇔|If and only if; implication in both directions.|For real x, x² = 0 ⇔ x = 0.|P ⇔ Q means each statement implies the other.|This is stronger than a one-way implication.|4
∀|For every member of the specified domain.|∀ x ∈ ℝ, x² ≥ 0.|∀ means for all in a logical statement.|The domain must be specified or understood.|4
∃|There exists at least one member of the specified domain.|∃ x ∈ ℝ such that x² = 4.|∃ means at least one example exists.|It does not mean exactly one unless uniqueness is added.|4
¬|Logical negation: not.|¬P means not P.|If P is true, ¬P is false in classical logic.|The statement being negated needs clear scope.|4
∧|Logical and: both statements hold.|P ∧ Q requires P and Q.|True ∧ false is false in classical logic.|This is not an exponent mark in this context.|4
∨|Inclusive logical or: at least one statement holds.|P ∨ Q allows P, Q, or both.|True ∨ true is true in classical logic.|Inclusive or does not exclude both being true.|4
ℝ|The set of real numbers.|−2 ∈ ℝ.|π ∈ ℝ.|Real numbers include irrational as well as rational numbers.|4
ℤ|The set of integers.|−3 ∈ ℤ.|0 ∈ ℤ.|Fractions such as one half are not integers.|4
ℕ|The natural numbers under the convention being used.|Some books define ℕ as {1, 2, 3, …}.|Other books include 0 in ℕ.|Check whether the author includes zero.|4
∫|An integral, used for accumulation or antiderivatives depending on notation.|A definite ∫ can measure signed accumulated area.|An indefinite ∫ represents a family of antiderivatives.|Bounds, integrand, and variable are needed to interpret an integral.|4
d/dx|Differentiate with respect to x.|d/dx of x² is 2x.|Use d/dx to find the rate of change with x.|This is operator notation, not an ordinary fraction in elementary use.|4
∂|Marks a partial derivative.|∂f/∂x differentiates with respect to x, holding other independent variables fixed.|The ∂ symbol appears in multivariable calculus.|A partial derivative differs from changing every variable at once.|4
∝|Is proportional to.|y ∝ x means y = kx for a fixed constant k.|At fixed speed, distance ∝ time.|Proportionality needs a defined context and constant.|4`,
digital:`
@|Separates a mailbox name from its domain in an email address.|In learner@example.com, @ separates the parts.|The @ sign is read as at in an email address.|The same symbol can mention a user on social platforms.|2
#|Marks a hashtag in this digital use.|#reading labels a social media topic.|A post tagged #science uses a hashtag.|The symbol also means number in some contexts and has programming uses.|2
&|An ampersand, meaning and in this use.|The sign says Arts & Crafts.|Research & Development joins two terms.|In code, & may have a different technical meaning.|2
*|An asterisk used to point to a note in writing.|A word marked * has a note below.|The table uses * to indicate an explanatory footnote.|In code, * can mean multiplication or a wildcard.|3
$|A currency symbol used for dollars and some other currencies.|US$5 specifies five US dollars.|The price is $10 in the stated local currency.|The dollar sign alone does not uniquely identify a country's currency.|2
€|The currency sign for the euro.|The price is €8.|A ticket costs €12.|A currency symbol does not specify an exchange rate.|2
£|A currency sign commonly used for pounds sterling.|The UK price is £6.|The London ticket costs £20.|The pound sign is not the same as # in this context.|2
¥|A currency sign used for yen or yuan, depending on context.|JPY ¥500 refers to Japanese yen.|CNY ¥50 refers to Chinese yuan.|The symbol alone can be ambiguous.|3
©|A copyright notice symbol.|The book includes © followed by a year.|A photo may carry a © notice.|The symbol alone is not a license giving permission to reuse a work.|3
®|A symbol indicating a registered trademark in an applicable jurisdiction.|The brand carries a ® symbol.|A product label uses ® after a registered mark.|Registration depends on jurisdiction; the symbol is not a general quality rating.|4
™|A symbol indicating a claimed trademark.|The new brand uses ™ beside its name.|The label marks its brand name with ™.|TM does not by itself establish registration.|3
° C|Degrees Celsius, a temperature unit, commonly written °C.|Water froze near 0 °C under the stated conditions.|The room temperature is 20 °C.|Celsius is not the same scale as Fahrenheit.|2
° F|Degrees Fahrenheit, a temperature unit, commonly written °F.|The room is 68 °F.|Water froze near 32 °F under the stated conditions.|A Fahrenheit degree differs in size from a Celsius degree.|2
μ|The SI prefix micro, meaning one millionth, when used before a unit.|1 μm is one millionth of a meter.|A μs is one millionth of a second.|Mu has other uses, including a population mean in statistics.|4
Ω|The ohm, an SI unit of electrical resistance.|The resistor is rated 10 Ω.|Resistance can be measured in Ω.|Capital omega has other meanings outside this unit context.|4
V|The volt, an SI unit of electric potential difference.|The battery is labeled 9 V.|We measured a potential difference in V.|Capital V can also be a variable; read the context.|3
A|The ampere, an SI unit of electric current.|A current of 2 A flows.|The meter displays current in A.|A unit symbol is different from the English article a.|3
W|The watt, an SI unit of power.|The lamp is rated 10 W.|Power is measured in W.|Energy and power are different quantities.|3
J|The joule, an SI unit of energy.|The transfer involved 5 J of energy.|Work can be measured in J.|Joules are not a unit of power.|3
Hz|The hertz, an SI unit of frequency equal to one cycle per second.|A frequency of 60 Hz means 60 cycles per second.|The tone has a frequency of 440 Hz.|Frequency differs from amplitude or loudness.|3
→|Shows a direction or transition in this use.|Start → finish indicates the order.|The diagram points food → consumer.|Arrows can also mark functions, limits, reactions, or logical relationships.|2
↔|Shows a relationship or movement in both directions in this use.|The diagram shows town A ↔ town B.|The two-way route is marked ↔.|The exact relationship depends on the diagram's key.|3
⚠|A warning sign calling attention to a possible hazard.|The label uses ⚠ before the hazard description.|A warning panel begins with ⚠.|Read the accompanying text to identify the actual hazard.|2
♻|A recycling-related symbol.|A bin marked ♻ collects specified recyclable materials.|A package displays ♻ with additional instructions.|The symbol alone does not guarantee local recyclability.|2
⏸|Pause playback or an ongoing activity in this interface use.|Tap ⏸ to pause the audio.|The video player shows ⏸ while playing.|Pause usually allows later resumption; stop may behave differently.|1
▶|Start or resume playback in this interface use.|Tap ▶ to play the recording.|The video starts when you select ▶.|A triangle has other meanings in different settings.|1
🔍|Search or inspect more closely in this interface use.|Tap 🔍 to find a word.|The toolbar uses 🔍 for search.|Some interfaces use a magnifying glass for zoom instead.|1`
};
// Absolute value uses vertical bars, which conflict with the authoring delimiter.
rows.math=rows.math.replace('| | |Absolute value','abs|Absolute value');
export const ENTRIES=Object.entries(rows).flatMap(([world,raw])=>raw.trim().split('\n').map((line,i)=>{const [term,meaning,example,transfer,trap,level]=line.split('|');return {id:`${world}.${i+1}`,world,term:term==='abs'?'|x|':term,meaning,examples:[example,transfer],trap,level:Number(level),kind:['punctuation','math','advanced','digital'].includes(world)?'symbol':world==='parts'?'part':'word',source:'original'};}));
export const BY_ID=Object.fromEntries(ENTRIES.map(e=>[e.id,e]));
export const SOURCES=[
 ['Vocabulary size study','https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.01116/full','Brysbaert et al. (2016). The estimate of 42,000 lemmas for an average 20-year-old native American-English speaker is a population estimate of vocabulary recognition, not a mastery quota or proof of knowledge of every sense. The study reports about 11,100 word families for that group, not 13,000.'],
 ['COCA','https://www.english-corpora.org/coca/','A corpus of roughly one billion running words across genres, not one billion distinct vocabulary items. No proprietary COCA frequency tables or examples are redistributed here.'],
 ['Paul Nation: vocabulary lists','https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/vocabulary-lists','Word-family lists organize vocabulary by frequency bands. Our guided stages are editorial learning groupings, not licensed BNC/COCA ranks or standardized grade placements.'],
 ['Unicode charts','https://www.unicode.org/charts/','Unicode catalogs encoded characters. The reference browser includes punctuation and symbol categories from Python Unicode 15.0.0. Notation systems and all possible meanings cannot be reduced to a character count.'],
 ['Unicode mathematics report','https://www.unicode.org/reports/tr25/tr25-16.html','The same written symbol can have different meanings in different contexts. The guided lessons teach stated uses; Unicode names alone are not semantic definitions.'],
 ['Princeton WordNet','https://wordnet.princeton.edu/','WordNet 3.0 supplies the extended dictionary, definitions, and example sentences under its redistribution license. It focuses on nouns, verbs, adjectives, and adverbs, so our original lessons separately cover connecting words and notation.'],
 ['WordNet license','./data/WORDNET-LICENSE.txt','The full license is included. Dictionary content is not a graded or child-filtered curriculum. Extended reference access is enabled only in the adult study profile.'],
 ['SI units','https://www.bipm.org/en/publications/si-brochure','Reference for SI units and prefixes. Original instructional wording is used in the guided lessons.']
];
