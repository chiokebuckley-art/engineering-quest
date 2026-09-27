import {USES,OBJECTS,sceneAt} from './content.js';
// Five additional, relation-specific constructions per use. No new curriculum list.
const rows=`in|Look inside the box to find the {n}.|The box holds the {n} inside it.|Find the {n} within the edges of the box.|The {n} is surrounded by the box's sides.|Inside the box, you can see the {n}.
on|The shelf supports the {n}.|The {n} rests on top of the shelf.|Look at the {n} touching the shelf's upper surface.|The {n} sits directly on the shelf.|There is no gap between the {n} and the shelf supporting it.
under|Look beneath the shelf for the {n}.|The shelf is directly over the {n}.|Find the {n} underneath the shelf.|The {n} occupies the space under the shelf.|Look lower than the shelf to find the {n}.
above|The {n} is higher than the shelf.|A gap separates the {n} from the shelf below it.|Look over the shelf to find the {n}, with space between them.|The {n} does not touch the shelf beneath it.|Find the {n} in the space above the shelf.
below|The shelf is higher than the {n}.|Look lower down than the shelf for the {n}.|The {n} is at a lower height than the shelf.|Find the {n} beneath the level of the shelf.|Compared with the shelf, the {n} is lower.
beside|The {n} is next to the box.|Look to the side of the box for the {n}.|The box and the {n} are side by side.|Find the {n} alongside the box.|The {n} is outside the box, next to its side.
between|Two boxes stand on opposite sides of the {n}.|The {n} fills part of the gap separating the boxes.|Find the {n} in the middle space between the two boxes.|One box is on each side of the {n}.|Look in the gap between both boxes for the {n}.
outside|The box does not contain the {n}.|Find the {n} beyond the box's inside space.|The {n} is not enclosed by the box.|Look outside the box for the {n}.|The {n} remains on the outer side of the box's boundary.
near|Only a short distance separates the {n} and the box.|The {n} is close to the box.|Look close by the box for the {n}.|The gap from the {n} to the box is small in this scene.|Find the {n} a little way from the box.
far|A large gap separates the {n} from the box.|The {n} is a long way from the box.|Look well away from the box for the {n}.|The distance between the {n} and the box is large here.|Find the {n} far from the box.
to|The {n} travels toward the box as its destination.|The arrow ends at the box's location as the {n} arrives.|Follow the {n}'s route to the box.|The box is where the {n} is going.|The {n} ends its trip at the box.
from|The box is where the {n} starts its trip.|Follow the {n} as it leaves the box's location.|The {n} travels away from its starting place at the box.|The arrow begins by the box and carries the {n} away.|The {n}'s journey starts from the box.
into|The {n} starts outside and ends inside the box.|Move the {n} across the boundary to the box's inside.|The arrow takes the {n} into the box.|The box contains the {n} at the end of the movement.|Follow the {n} as it enters the box.
out|The {n} starts inside and ends outside the box.|Follow the {n} as it leaves the inside of the box.|The {n} crosses the boundary out of the box.|The box no longer contains the {n} after the movement.|Move the {n} from the inside to the outside.
onto|The {n} moves until it rests on the shelf.|The {n} ends its movement touching the shelf's top.|Follow the {n} as it arrives on the shelf.|The shelf supports the {n} after the movement.|Move the {n} onto the shelf's upper surface.
off|The {n} leaves the shelf's upper surface.|Follow the {n} as it moves off the shelf.|The shelf stops supporting the {n} as it moves away.|The {n} starts on the shelf and finishes away from it.|Move the {n} away from the surface it was resting on.
up|The {n} moves to a higher position.|Follow the {n} from the lower place to the higher place.|The arrow carries the {n} upward.|The {n} finishes higher than it started.|Move the {n} up toward the top of the picture.
down|The {n} moves to a lower position.|Follow the {n} from the higher place to the lower place.|The arrow carries the {n} downward.|The {n} finishes lower than it started.|Move the {n} down toward the bottom of the picture.
through|The {n} enters the tunnel and leaves through the other opening.|Follow the {n} inside the passage to the other end.|The {n}'s route passes through the tunnel.|The tunnel surrounds part of the {n}'s route.|Move the {n} from one tunnel opening to the other through its inside.
around|The {n} follows a curved route outside the tunnel.|The {n} avoids the tunnel's inside by going around it.|Follow the {n} along the route around the obstacle.|The {n} goes around the tunnel instead of entering it.|The {n}'s path bends around the outside.
a|Choose any one small {n}; either will do.|A particular small {n} has not been identified; choose one.|You may pick either small {n}.|Please give me a small {n}, whichever you choose.|I need one small {n}, without specifying which one.
an|Choose any one orange-colored {n}; either will do.|I need an orange-colored {n}, without specifying which one.|You may pick either orange-colored {n}.|Please give me an orange-colored {n}, whichever you choose.|No particular orange-colored {n} is required; choose one.
the|Choose the particular {n} indicated by the arrow.|The arrow tells you exactly which {n} to choose.|Find the {n} that has already been identified.|Please give me the {n} the arrow points to.|Only the indicated {n} is the one meant here.
this|The speaker points to this nearby {n}.|One {n} close to the speaker is being indicated.|This {n} is the closer one the speaker points to.|The speaker means the single {n} nearby.|Find this one {n} near the person speaking.
that|The speaker points to that distant {n}.|One {n} farther from the speaker is being indicated.|That {n} is the farther one the speaker points to.|The speaker means the single {n} over there.|Find that one {n} away from the person speaking.
these|The speaker indicates these nearby {p}.|More than one {n} near the speaker is being indicated.|These {p} are the closer group.|The speaker points to the group of {p} nearby.|Find these {p} close to the person speaking.
those|The speaker indicates those distant {p}.|More than one {n} farther from the speaker is being indicated.|Those {p} are the farther group.|The speaker points to the group of {p} over there.|Find those {p} away from the person speaking.
it|The {n} was mentioned already. It is inside the box.|Here is {article} {n}; it is now in the box.|We are talking about the {n}. It is the same object in the box.|The word it refers back to the {n} we just mentioned.|Find the {n} named earlier: it is in the box.
its|The robot owns the {n}. Its {n} is inside the box.|This {n} belongs to the robot; it is its {n}.|Look at the robot and its {n} in the box.|The robot's possession is the {n}; its shows that ownership.|The robot has its own {n} inside the box.
at|Find the {n} at the packing station.|The packing station is the marked location of the {n}.|The {n} is waiting at the indicated station.|Look at the marked station to locate the {n}.|The {n}'s location is the packing station.
and|Include both the {n} and the box.|Choose the box as well as the {n}.|Both items are wanted: the {n} and the box.|Select the {n}, and select the box too.|The request includes the {n} together with the box.
or|Choose exactly one: the {n} or the box.|Either the {n} or the box will satisfy this choose-one request.|Select one option, either the {n} or the box.|You may choose the {n}; alternatively, choose the box.|This task offers the {n} or the box, but asks for just one.
not|The {n} is not inside the box.|The statement that the {n} is inside is false.|The box does not contain the {n}.|Notice that the {n} is not enclosed by the box.|It is not true that the {n} is in the box.
with|Include the box with the {n} in the packing group.|Pack both items together: the {n} with the box.|The {n} is accompanied by the box in this group.|The packing group contains the {n} together with the box.|Keep the box with the {n} when packing.
without|Pack the {n} but leave out the box.|The packing group has the {n} without the box.|Include only the {n}; the box stays outside the group.|The box does not accompany the packed {n}.|Pack the {n} on its own, without the box.
for|Maya is meant to receive this {n}.|This {n} is intended for Maya.|The {n} is addressed to Maya as its recipient.|Give this {n} to Maya; it is for her.|The intended recipient of the {n} is Maya.
by|Maya did the packing of the {n}.|The {n} was packed by Maya, the person doing the action.|It was Maya who packed the {n}.|Who packed the {n}? It was packed by Maya.|The packing action was done by Maya to the {n}.
ofContents|The box contains {p}.|The contents of this box are {p}.|Look inside this box of {p}.|These {p} are the things held in the box.|This box is filled with {p}; it is a box of {p}.
ofPicture|The drawing represents {article} {n}.|This framed image shows {article} {n}.|Look at the picture of the {n}.|The {n} appears in a drawing inside the frame.|This is an image of {article} {n}, rather than the actual object.
about|The topic of this book is {p}.|This book gives information about {p}.|The {p} are what the book discusses.|Read this book to learn about {p}.|The book's subject is {p}.
all|Every one of the six {p} is inside the box.|The box contains the entire group of six {p}.|Not one of these six {p} is outside.|All six members of this group are in the box.|The complete group of six {p} is inside.
some|Three of the six {p} are inside the box.|There are {p} inside the box and others outside.|Some {p} are inside, so the box is not empty.|The box contains part of this group of {p}.|A positive number of these {p} is inside the box.
none|Not one of these {p} is in the box.|Zero {p} from this group are inside.|The box contains none of this group of {p}.|All of these {p} are outside the box.|There are no {p} inside this box.
both|The two {p} are inside the box.|Neither member of this pair of {p} is outside.|Both members of the pair are in the box.|The box contains the whole pair of {p}.|Two out of two {p} are inside.
each|Every individual {n} has its own dot beside it.|Look at the {p} one at a time: each has a dot.|A dot has been placed beside each {n}.|No individual {n} has been missed when adding dots.|Give each separate {n} a dot beside it.
every|Not a single {n} is left outside the marked area.|The marked area includes every {n}.|All individual {p} are in the marked area.|Every member of the group of {p} is inside the marked area.|There is no exception: every {n} is within the marked area.
more|The left group has a greater number of {p}.|Four {p} on the left outnumber two on the right.|There are more {p} in the left group.|Compare counts: the left side has more {p}.|The right group has fewer {p} than the left group.
fewer|The left group has a smaller number of {p}.|Two {p} on the left are fewer than four on the right.|There are fewer {p} in the left group.|Compare counts: the left side has fewer {p}.|The right group has more {p} than the left group.
oneOf|Select a single {n} from the group of six.|Just one of the six {p} is circled.|Five {p} remain unselected after choosing one.|The ring marks one member of this group of {p}.|Choose one {n} out of these six.
halfOf|Select three of the six {p}.|The chosen {p} make one of two equal groups.|Half of these six {p} are circled.|Three {p} are selected and three are not.|Divide the six {p} equally and choose one half.
before|Look at the {n}, then close the box.|Looking at the {n} happens earlier than closing the box.|First look at the {n}; the box closes afterward.|The box is closed only after looking at the {n}.|Looking at the {n} comes before the box is closed.
after|Close the box, then look at the {n}.|Looking at the {n} happens later than closing the box.|First close the box; look at the {n} afterward.|The box closes before looking at the {n}.|Looking at the {n} comes after the box is closed.
first|The first action is looking at the {n}.|Begin by looking at the {n}; then close the box.|Looking at the {n} is step one.|The sequence starts with looking at the {n}.|Look at the {n} before doing the second action.
last|Looking at the {n} is the final action.|Finish by looking at the {n}, after closing the box.|The last step is to look at the {n}.|Looking at the {n} comes at the end of this sequence.|Close the box first and look at the {n} last.
until|Keep the {n} in the box up to the time the bell rings.|The {n} stays inside before the bell and moves out when it rings.|Do not take the {n} out before the bell rings.|The bell ends the time the {n} must stay in the box.|Wait for the bell before removing the {n}.
over|The {n} follows a path above the box.|Move the {n} over the top of the box.|The {n}'s route passes above the box without entering it.|The arrow carries the {n} up and over the box.|The {n} crosses over the box along the curved path.
across|The {n} moves from one side of the mat to the other.|Follow the {n} as it crosses the mat.|The {n}'s path goes across the width of the mat.|The {n} passes over the mat to its opposite side.|Move the {n} across the mat, not along its edge.
along|The {n} follows the edge of the mat.|Move the {n} along the length of the mat's edge.|The {n}'s route stays beside the edge as it moves.|Follow the {n} traveling along the edge.|The {n} moves beside the mat's edge rather than crossing it.
toward|The {n} moves closer to the box without reaching it.|The distance from the {n} to the box gets smaller.|The {n} travels in the direction of the box.|Follow the {n} as it approaches the box.|The {n} heads toward the box but stops short.
away|The {n} moves farther from the box.|The distance from the {n} to the box gets larger.|Follow the {n} as it travels away from the box.|The {n} finishes farther from the box than it started.|The {n} heads away from the box.`;
export const PATTERNS=Object.fromEntries(rows.split('\n').map(r=>{const [id,...s]=r.split('|');return [id,s];}));
export const sceneIndex=(use,object)=>Math.floor(object/5)*300+use*5+object%5;
export function sentence(use,object,pattern=0){const s=sceneAt(sceneIndex(use,object));return (pattern===0?s.use.sentence:PATTERNS[s.use.id][pattern-1]).replaceAll('{n}',s.object.noun).replaceAll('{p}',s.object.plural).replaceAll('{article}',s.object.article);}
export const SENTENCE_COUNT=USES.length*OBJECTS.length*6;
// New settings, people, objects and actions: transfer beyond the teaching pictures.
// Each row explicitly defines two mutually exclusive answers in its context.
const transfers=`in|The sandwich is enclosed by the lunchbox. It is ___ the lunchbox.|in|outside|The fish swims inside the tank's walls. It is ___ the tank.|in|outside
on|The tabletop supports the cup with no gap. The cup rests ___ the table.|on|above|The floor supports your shoes. They are ___ the floor.|on|under
under|The cat shelters beneath the chair. It is ___ the chair.|under|on|The bridge is directly overhead. Our boat is ___ the bridge.|under|above
above|The lamp hangs higher than the desk without touching it. It is ___ the desk.|above|on|The kite is higher than the roof. It is ___ the roof.|above|below
below|The basement is lower than the kitchen. It is ___ the kitchen.|below|above|The valley lies at a lower height than the hilltop. It is ___ the hilltop.|below|above
beside|Two chairs stand side by side. One is ___ the other.|beside|inside|The dog sits next to the bench. It is ___ the bench.|beside|in
between|A child stands with one parent on either side. The child is ___ the parents.|between|above|The sandwich filling has bread on both sides. It is ___ the slices.|between|outside
outside|The dog stays beyond the fence enclosing the yard. It is ___ the yard.|outside|inside|The shoes are not enclosed by the bag. They are ___ the bag.|outside|in
near|The school is just a few steps from home. Compared with a school miles away, it is ___.|near|far away|The cup is within easy reach. Compared with the cup across the room, it is ___.|near|far away
far|The shop is many miles away, not close by. It is ___ our house.|far from|near|The mountain is distant on the horizon. It is ___ us.|far from|near
to|The library is our destination. We are going ___ the library.|to|from|The station is where this trip ends. The train travels ___ the station.|to|from
from|The farm is where this parcel started. The parcel came ___ the farm.|from|to|Home is the starting point of my trip. I walked ___ home.|from|to
into|The bird starts outside the cage and ends inside. It flies ___ the cage.|into|out of|The water crosses from outside to inside the cup. It flows ___ the cup.|into|out of
out|The child starts inside the tent and ends outside. The child crawls ___ the tent.|out of|into|The cat leaves the inside of the basket. It jumps ___ the basket.|out of|into
onto|The cat jumps and lands on the bench. It jumps ___ the bench.|onto|off|The bag starts away from the table and ends resting on top. We lift it ___ the table.|onto|off
off|The hat leaves the hook it rested on. We take it ___ the hook.|off|onto|The cat starts on the bench and jumps away. It jumps ___ the bench.|off|onto
up|The elevator goes from the ground floor to a higher floor. It moves ___.|up|down|The balloon rises to a higher position. It moves ___.|up|down
down|The elevator goes from a high floor to the ground floor. It moves ___.|down|up|The leaf falls to a lower position. It moves ___.|down|up
through|We enter one tunnel opening, travel inside, and leave the other opening. We go ___ it.|through|around|Light enters the window and passes to the other side. It passes ___ the window.|through|around
around|The road bends outside the pond without crossing its water. It goes ___ the pond.|around|through|We avoid the puddle by walking along its outside. We walk ___ it.|around|through
a|Any small cup will do; no particular cup is meant. Please bring ___ small cup.|a|the|No particular red sock is meant. Please choose ___ red sock.|a|the
an|Any umbrella will do. Before the vowel sound in umbrella, use ___.|an|a|No particular apple is meant. Before the vowel sound in apple, use ___.|an|a
the|We already identified one red door. Close ___ red door we identified.|the|a|Both people know the one dog being discussed. Feed ___ dog we discussed.|the|a
this|I point to one cup right here beside me: ___ cup.|this|that|I hold one shell close to me and indicate it: ___ shell.|this|those
that|I point to one tree far over there: ___ tree.|that|this|I indicate one boat far from where I stand: ___ boat.|that|these
these|I point to several shoes right here near me: ___ shoes.|these|those|I hold several cards close to me: ___ cards.|these|that
those|I point to several birds far over there: ___ birds.|those|these|I indicate several houses far away: ___ houses.|those|this
it|A bell rang. ___ made a loud sound. Refer back to the bell.|It|They|Here is my coat. ___ is warm. Refer back to the coat.|It|They
its|The robot owns a hat. ___ hat is blue. Choose the possessive word.|Its|It's|The tree has a trunk. ___ trunk is thick. Choose the possessive word.|Its|It's
at|The map marks the bus stop as our meeting point. Meet me ___ the bus stop.|at|through|The entrance is our meeting point. Wait ___ the entrance.|at|through
and|Both things are required. Bring a coat ___ a hat.|and|or|Include both numbers. Circle two ___ four.|and|or
or|Choose exactly one drink: water ___ milk.|or|and|Only one color is allowed. Choose red ___ blue.|or|and
not|The light is off. It is ___ on.|not|already|The answer is false. It is ___ true.|not|certainly
with|The lunch includes an apple together with a sandwich. Pack the sandwich ___ the apple.|with|without|Both raincoat and boots go together. Take the raincoat ___ the boots.|with|without
without|Leave out sugar. Make the tea ___ sugar.|without|with|Bring the bag but leave its strap behind. Bring the bag ___ the strap.|without|with
for|Nia is meant to receive the gift. It is ___ Nia.|for|from|The kitten is meant to receive this food. The food is ___ the kitten.|for|from
by|Omar painted the wall. The wall was painted ___ Omar.|by|for|Lena built the model. It was built ___ Lena.|by|for
ofContents|In a jar of coins, what does of connect the jar to?|its contents|an image it represents|In a basket of pears, what does of identify?|what the basket holds|who drew the basket
ofPicture|In a photo of a dog, what does of identify?|what the image shows|what fills a container|In a drawing of a ship, what does of connect the drawing to?|the thing represented|the container's contents
about|The report discusses turtles as its topic. It is ___ turtles.|about|under|The story's subject is a journey. The story is ___ a journey.|about|under
all|Every one of the five cups is clean. ___ five cups are clean.|All|None of the|Every child in this group arrived. ___ the children in this group arrived.|All|None of
some|Exactly two of six chairs are occupied. ___ chairs are occupied.|Some|No|Exactly three of eight windows are open. ___ windows are open.|Some|No
none|Zero of the six lamps work. ___ of the lamps work.|None|Some|Not one child is absent. ___ of the children are absent.|None|Some
both|There are exactly two gloves and both are wet. ___ gloves are wet.|Both|Neither of the|The pair has two shoes, and each is clean. ___ shoes are clean.|Both|Neither of the
each|Give one ticket to every person separately. Give a ticket to ___ person.|each|only one|Check all four wheels individually. Check ___ wheel.|each|only one
every|No student is left out. ___ student gets a book.|Every|Only one|All doors must be checked, without exception. Check ___ door.|every|only one
more|There are eight blue beads and three red beads. There are ___ blue beads than red beads.|more|fewer|Six buses outnumber two cars. There are ___ buses than cars.|more|fewer
fewer|There are two blue beads and seven red beads. There are ___ blue beads than red beads.|fewer|more|Three birds are fewer than nine fish. There are ___ birds than fish.|fewer|more
oneOf|Select exactly one card from the pack. Choose ___ the cards.|one of|half of|Pick a single child from a group of eight. Pick ___ the children.|one of|half of
halfOf|Four of eight pieces are selected. Exactly ___ the pieces are selected.|half of|one of|Three of six seats are taken. Exactly ___ the seats are taken.|half of|one of
before|Wash your hands first, then eat. Wash your hands ___ eating.|before|after|Put on socks first, then shoes. Put on socks ___ putting on shoes.|before|after
after|Eat first, then wash the plate. Wash the plate ___ eating.|after|before|Read the message first, then reply. Reply ___ reading.|after|before
first|In the sequence wake, dress, leave, waking comes ___.|first|last|In the sequence open, read, close, opening comes ___.|first|last
last|In the sequence mix, bake, serve, serving comes ___.|last|first|In the sequence pack, travel, arrive, arriving comes ___.|last|first
until|Keep waiting up to the time the bus arrives. Wait ___ the bus arrives.|until|only after|Stay inside up to the moment the rain stops. Stay inside ___ the rain stops.|until|only after
over|The plane's route passes above the hill. It flies ___ the hill.|over|under|The horse jumps above the fence to the other side. It jumps ___ the fence.|over|under
across|Walk from one side of the field to the opposite side. Walk ___ the field.|across|only along the edge of|The swimmer crosses the pool from one side to the other. The swimmer goes ___ the pool.|across|only along the edge of
along|Follow the riverbank's length without crossing the river. Walk ___ the riverbank.|along|across|Stay beside the fence and follow its length. Walk ___ the fence.|along|through
toward|The dog gets closer to home but has not arrived. It moves ___ home.|toward|away from|The boat approaches the dock without reaching it yet. It moves ___ the dock.|toward|away from
away|The dog gets farther from home. It moves ___ home.|away from|toward|The boat's distance from the dock increases. It moves ___ the dock.|away from|toward`;
export const TRANSFER=Object.fromEntries(transfers.split('\n').map(r=>{const [id,...parts]=r.split('|');return [id,[0,3].map(i=>({prompt:parts[i],answer:parts[i+1],wrong:parts[i+2]}))];}));
