/**
 * The reviewed sketches for Electronics Kit 01. The C++ is what the learner would upload to a real UNO
 * (standard Arduino API; Servo and the Adafruit "DHT sensor library" where noted). Each behaviour model
 * mirrors its C++ line for line, using millis() for the delays.
 */
import type { SketchDef, Io, Slots, Mem } from './runtime';

const DIGITAL = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'];
const PWM = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'];
const ANALOG = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
const S = (s: Slots, k: string) => s[k] as string;
const N = (s: Slots, k: string) => Number(s[k]);
/** Print at most every `ms` (the C++ has a matching delay). */
function every(io: Io, mem: Mem, key: string, ms: number, fn: () => void) {
  const last = (mem[key] as number | undefined) ?? -Infinity;
  if (io.millis - last >= ms) { mem[key] = io.millis; fn(); }
}

/** Factory sketch every UNO ships with: the on-board L LED on pin 13 blinks. */
export const BLINK: SketchDef = {
  id: 'blink', title: 'Blink', summary: 'Turns pin 13 on and off: the built-in L LED, and anything wired to pin 13, blinks.',
  slots: [
    { key: 'pin', label: 'LED pin', kind: 'pin', options: DIGITAL, default: 'D13' },
    { key: 'on', label: 'On time (ms)', kind: 'number', min: 50, max: 3000, step: 50, default: 1000 },
    { key: 'off', label: 'Off time (ms)', kind: 'number', min: 50, max: 3000, step: 50, default: 1000 },
  ],
  source: `// Blink: turn an LED on, wait, turn it off, wait, repeat.
void setup() {
  pinMode({{pin}}, OUTPUT);      // this pin will give out 5 V or 0 V
}

void loop() {
  digitalWrite({{pin}}, HIGH);   // 5 V: current flows, the LED lights
  delay({{on}});                 // wait (milliseconds)
  digitalWrite({{pin}}, LOW);    // 0 V: no current, the LED goes dark
  delay({{off}});
}`,
  setup(io, s) { io.pinMode(S(s, 'pin'), 'OUTPUT'); },
  loop(io, s) { const on = N(s, 'on'); const period = on + N(s, 'off'); io.digitalWrite(S(s, 'pin'), io.millis % period < on); },
};

export const BUTTON_LED: SketchDef = {
  id: 'button-led', title: 'Button lamp', summary: 'While the button is held, the LED is on.',
  slots: [
    { key: 'button', label: 'Button pin', kind: 'pin', options: DIGITAL, default: 'D2' },
    { key: 'mode', label: 'Input mode', kind: 'choice', options: ['INPUT_PULLUP', 'INPUT'], default: 'INPUT_PULLUP', hint: 'INPUT_PULLUP switches on a resistor inside the UNO that holds the pin HIGH until the button pulls it LOW.' },
    { key: 'pressed', label: 'Pressed reads', kind: 'choice', options: ['LOW', 'HIGH'], default: 'LOW' },
    { key: 'led', label: 'LED pin', kind: 'pin', options: DIGITAL, default: 'D13' },
  ],
  source: `// Button lamp: the LED is on only while the button is pressed.
const int buttonPin = {{button}};
const int ledPin = {{led}};

void setup() {
  pinMode(buttonPin, {{mode}});  // a pull-up keeps the pin HIGH until pressed
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (digitalRead(buttonPin) == {{pressed}}) {   // pressed joins the pin to GND
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`,
  setup(io, s) { io.pinMode(S(s, 'button'), S(s, 'mode') as 'INPUT'); io.pinMode(S(s, 'led'), 'OUTPUT'); },
  loop(io, s) { const r = io.digitalRead(S(s, 'button')); io.digitalWrite(S(s, 'led'), r === (S(s, 'pressed') === 'LOW' ? 0 : 1)); },
};

export const KNOB: SketchDef = {
  id: 'knob', title: 'Knob dimmer', summary: 'Reads the knob on A0 (0–1023), prints it, and sets the LED brightness on a PWM pin (0–255).',
  slots: [
    { key: 'ain', label: 'Knob pin', kind: 'pin', options: ANALOG, default: 'A0' },
    { key: 'led', label: 'LED pin (PWM ~)', kind: 'pin', options: PWM, default: 'D9' },
    { key: 'div', label: 'Divide by', kind: 'number', min: 1, max: 8, step: 1, default: 4, hint: '1023 (top reading) ÷ 4 ≈ 255 (top brightness).' },
  ],
  source: `// Knob dimmer: turn the potentiometer to change the LED brightness.
void setup() {
  Serial.begin(9600);            // open the Serial Monitor at 9600 baud
  pinMode({{led}}, OUTPUT);
}

void loop() {
  int value = analogRead({{ain}});     // 0 (0 V) to 1023 (5 V)
  Serial.println(value);
  analogWrite({{led}}, value / {{div}});  // 0 = off, 255 = full brightness
  delay(100);
}`,
  setup(io, s) { io.pinMode(S(s, 'led'), 'OUTPUT'); },
  loop(io, s, mem) {
    const v = io.analogRead(S(s, 'ain'));
    const duty = Math.floor(v / Math.max(1, N(s, 'div')));
    io.analogWrite(S(s, 'led'), duty > 255 ? duty % 256 : duty); // analogWrite keeps only the low 8 bits
    every(io, mem, 'p', 100, () => io.println(String(v)));
  },
};

export const LIGHT: SketchDef = {
  id: 'light', title: 'Dusk light', summary: 'Reads the light sensor divider and switches the LED when it gets dark.',
  slots: [
    { key: 'ain', label: 'Sensor pin', kind: 'pin', options: ANALOG, default: 'A0' },
    { key: 'cmp', label: 'Compare', kind: 'choice', options: ['<', '>'], default: '<' },
    { key: 'threshold', label: 'Threshold', kind: 'number', min: 0, max: 1023, step: 10, default: 300 },
    { key: 'led', label: 'LED pin', kind: 'pin', options: DIGITAL, default: 'D13' },
  ],
  source: `// Dusk light: when the reading drops (it gets dark), the LED comes on.
void setup() {
  Serial.begin(9600);
  pinMode({{led}}, OUTPUT);
}

void loop() {
  int light = analogRead({{ain}});   // brighter light → higher reading
  Serial.print("Light: ");
  Serial.println(light);
  if (light {{cmp}} {{threshold}}) {
    digitalWrite({{led}}, HIGH);
  } else {
    digitalWrite({{led}}, LOW);
  }
  delay(200);
}`,
  setup(io, s) { io.pinMode(S(s, 'led'), 'OUTPUT'); },
  loop(io, s, mem) {
    const v = io.analogRead(S(s, 'ain'));
    io.digitalWrite(S(s, 'led'), S(s, 'cmp') === '<' ? v < N(s, 'threshold') : v > N(s, 'threshold'));
    every(io, mem, 'p', 200, () => io.println(`Light: ${v}`));
  },
};

export const TEMPERATURE: SketchDef = {
  id: 'temperature', title: 'Temperature reporter', summary: 'Reads the DHT11 every two seconds and prints temperature and humidity; also prints the thermistor reading.',
  libraries: ['DHT sensor library (Adafruit)'],
  slots: [
    { key: 'dht', label: 'DHT11 data pin', kind: 'pin', options: DIGITAL, default: 'D2' },
    { key: 'therm', label: 'Thermistor pin', kind: 'pin', options: ANALOG, default: 'A1' },
    { key: 'every', label: 'Read every (ms)', kind: 'number', min: 1000, max: 10000, step: 500, default: 2000, hint: 'The DHT11 needs at least 1 second between readings.' },
  ],
  source: `// Temperature reporter: a digital sensor (DHT11) and an analog one (thermistor).
#include <DHT.h>
DHT dht({{dht}}, DHT11);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay({{every}});                       // the DHT11 needs time between readings
  float t = dht.readTemperature();    // °C
  float h = dht.readHumidity();       // %
  if (isnan(t) || isnan(h)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    Serial.print("Temp: "); Serial.print(t, 0); Serial.print(" C  ");
    Serial.print("Humidity: "); Serial.print(h, 0); Serial.println(" %");
  }
  Serial.print("Thermistor: ");
  Serial.println(analogRead({{therm}}));  // warmer → lower resistance
}`,
  setup() { /* dht.begin() */ },
  loop(io, s, mem) {
    every(io, mem, 'p', Math.max(1000, N(s, 'every')), () => {
      if ((mem.first as boolean | undefined) === undefined) { mem.first = false; return; } // the first delay() passes before any reading
      const r = io.readDHT(S(s, 'dht'));
      io.println(r ? `Temp: ${r.t} C  Humidity: ${r.h} %` : 'Failed to read from DHT sensor!');
      io.println(`Thermistor: ${io.analogRead(S(s, 'therm'))}`);
    });
  },
};

export const BUZZER: SketchDef = {
  id: 'buzzer', title: 'Alarm pattern', summary: 'Beeps a buzzer on and off. digitalWrite for an active buzzer; tone() for a passive one.',
  slots: [
    { key: 'pin', label: 'Buzzer pin', kind: 'pin', options: DIGITAL, default: 'D8' },
    { key: 'how', label: 'Drive with', kind: 'choice', options: ['digitalWrite', 'tone'], default: 'digitalWrite', hint: 'An active buzzer beeps on plain 5 V. A passive buzzer needs tone() to make it vibrate.' },
    { key: 'freq', label: 'Pitch for tone() (Hz)', kind: 'number', min: 100, max: 2000, step: 10, default: 880 },
    { key: 'on', label: 'Beep (ms)', kind: 'number', min: 50, max: 2000, step: 50, default: 200 },
    { key: 'off', label: 'Pause (ms)', kind: 'number', min: 50, max: 2000, step: 50, default: 800 },
  ],
  source: (s) => s.how === 'tone' ? `// Alarm pattern for a PASSIVE buzzer: tone() makes it vibrate at a pitch.
const int buzzer = {{pin}};

void setup() {
  pinMode(buzzer, OUTPUT);
}

void loop() {
  tone(buzzer, {{freq}});   // a {{freq}} Hz square wave
  delay({{on}});
  noTone(buzzer);           // stop
  delay({{off}});
}` : `// Alarm pattern for an ACTIVE buzzer: it has its own oscillator, so 5 V is enough.
const int buzzer = {{pin}};

void setup() {
  pinMode(buzzer, OUTPUT);
}

void loop() {
  digitalWrite(buzzer, HIGH);  // 5 V: beep
  delay({{on}});
  digitalWrite(buzzer, LOW);   // 0 V: quiet
  delay({{off}});
}`,
  setup(io, s) { io.pinMode(S(s, 'pin'), 'OUTPUT'); },
  loop(io, s) {
    const on = N(s, 'on'); const phase = io.millis % (on + N(s, 'off')) < on;
    if (!phase) io.noTone(S(s, 'pin'));
    else if (S(s, 'how') === 'tone') io.tone(S(s, 'pin'), N(s, 'freq'));
    else io.digitalWrite(S(s, 'pin'), true);
  },
};

export const SERVO: SketchDef = {
  id: 'servo', title: 'Servo swing', summary: 'Moves the servo to one angle, waits, then to another.',
  libraries: ['Servo (built in)'],
  slots: [
    { key: 'pin', label: 'Signal pin', kind: 'pin', options: DIGITAL, default: 'D9' },
    { key: 'a1', label: 'First angle', kind: 'number', min: 0, max: 180, step: 5, default: 30 },
    { key: 'a2', label: 'Second angle', kind: 'number', min: 0, max: 180, step: 5, default: 150 },
    { key: 'wait', label: 'Hold (ms)', kind: 'number', min: 300, max: 3000, step: 100, default: 1000 },
  ],
  source: `// Servo swing: tell the servo an angle; it drives itself there and holds.
#include <Servo.h>
Servo arm;

void setup() {
  arm.attach({{pin}});   // the orange signal wire
}

void loop() {
  arm.write({{a1}});     // degrees, 0–180
  delay({{wait}});
  arm.write({{a2}});
  delay({{wait}});
}`,
  setup() { /* attach */ },
  loop(io, s) { const w = N(s, 'wait'); io.servo(S(s, 'pin'), io.millis % (2 * w) < w ? N(s, 'a1') : N(s, 'a2')); },
};

export const ECHO: SketchDef = {
  id: 'echo', title: 'Echo ranger', summary: 'Sends a ping, times the echo, turns it into centimetres, and sounds the buzzer when something is close.',
  slots: [
    { key: 'trig', label: 'Trig pin', kind: 'pin', options: DIGITAL, default: 'D12' },
    { key: 'echo', label: 'Echo pin', kind: 'pin', options: DIGITAL, default: 'D11' },
    { key: 'div', label: 'Divide by', kind: 'number', min: 1, max: 4, step: 1, default: 2, hint: 'The sound goes out AND back.' },
    { key: 'near', label: 'Alarm closer than (cm)', kind: 'number', min: 5, max: 200, step: 5, default: 30 },
    { key: 'alarm', label: 'Buzzer pin', kind: 'pin', options: DIGITAL, default: 'D8' },
  ],
  source: `// Echo ranger: distance = speed of sound × echo time ÷ {{div}}
const int trigPin = {{trig}};
const int echoPin = {{echo}};
const int buzzer = {{alarm}};

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzer, OUTPUT);
}

void loop() {
  digitalWrite(trigPin, LOW);  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);   // a 10 µs ping
  digitalWrite(trigPin, LOW);
  long time = pulseIn(echoPin, HIGH);    // µs until the echo comes back
  float cm = time * 0.0343 / {{div}};    // sound: 0.0343 cm per µs
  Serial.print("Distance: "); Serial.print(cm, 0); Serial.println(" cm");
  if (cm > 0 && cm < {{near}}) {
    digitalWrite(buzzer, HIGH);
  } else {
    digitalWrite(buzzer, LOW);
  }
  delay(100);
}`,
  setup(io, s) { io.pinMode(S(s, 'trig'), 'OUTPUT'); io.pinMode(S(s, 'echo'), 'INPUT'); io.pinMode(S(s, 'alarm'), 'OUTPUT'); },
  loop(io, s, mem) {
    const us = io.pulseIn(S(s, 'trig'), S(s, 'echo'));
    const cm = (us * 0.0343) / Math.max(1, N(s, 'div'));
    io.digitalWrite(S(s, 'alarm'), cm > 0 && cm < N(s, 'near'));
    every(io, mem, 'p', 250, () => io.println(`Distance: ${Math.round(cm)} cm`));
  },
};

/** Boss quest: any sensor → compare → any output, assembled from the learner's choices. */
export const INVENT: SketchDef = {
  id: 'invent', title: 'Your invention', summary: 'Reads the sensor you chose, compares it with your threshold, and drives your output.',
  libraries: ['Servo (built in) if you use the servo'],
  slots: [
    { key: 'sensor', label: 'Sensor', kind: 'choice', options: ['ultrasonic', 'light', 'temperature'], default: 'ultrasonic' },
    { key: 'cmp', label: 'Alert when reading is', kind: 'choice', options: ['<', '>'], default: '<' },
    { key: 'threshold', label: 'Threshold', kind: 'number', min: 0, max: 1023, step: 5, default: 40 },
    { key: 'output', label: 'Output', kind: 'choice', options: ['buzzer', 'led', 'servo'], default: 'buzzer' },
  ],
  source: (s) => {
    const us = s.sensor === 'ultrasonic'; const servo = s.output === 'servo';
    const what = us ? 'distance in cm' : s.sensor === 'light' ? 'light level 0–1023 (photoresistor divider on A0)' : 'thermistor reading 0–1023 (divider on A0)';
    return `// My invention: notice something and respond.
// Sensor: {{sensor}} → ${what}.  Output: {{output}}.
${servo ? '#include <Servo.h>\nServo flag;\n' : ''}${us ? 'const int trigPin = 12;\nconst int echoPin = 11;\n' : 'const int sensorPin = A0;\n'}${servo ? '' : 'const int outPin = 8;              // buzzer or LED (through its resistor)\n'}
void setup() {
  Serial.begin(9600);
${us ? '  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n' : ''}${servo ? '  flag.attach(9);                   // servo signal (orange) on pin 9\n' : '  pinMode(outPin, OUTPUT);\n'}}

float readSensor() {
${us ? `  digitalWrite(trigPin, LOW);  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  return pulseIn(echoPin, HIGH) * 0.0343 / 2;   // centimetres` : '  return analogRead(sensorPin);                 // 0–1023'}
}

void loop() {
  float reading = readSensor();
  Serial.println(reading);
  bool alert = reading {{cmp}} {{threshold}};
${servo ? '  flag.write(alert ? 150 : 30);     // wave when alerting' : '  digitalWrite(outPin, alert ? HIGH : LOW);'}
  delay(200);
}`;
  },
  setup(io) { io.pinMode('D12', 'OUTPUT'); io.pinMode('D11', 'INPUT'); io.pinMode('D8', 'OUTPUT'); },
  loop(io, s, mem) {
    const sensor = S(s, 'sensor');
    const reading = sensor === 'ultrasonic' ? (io.pulseIn('D12', 'D11') * 0.0343) / 2 : io.analogRead('A0');
    const alert = S(s, 'cmp') === '<' ? reading < N(s, 'threshold') : reading > N(s, 'threshold');
    io.digitalWrite('D8', alert);
    io.servo('D9', alert ? 150 : 30);
    every(io, mem, 'p', 250, () => io.println(String(Math.round(reading))));
  },
};

export const SKETCHES: Record<string, SketchDef> = Object.fromEntries([BLINK, BUTTON_LED, KNOB, LIGHT, TEMPERATURE, BUZZER, SERVO, ECHO, INVENT].map((s) => [s.id, s]));
