import { useMemo, useState } from 'react';
import { useGame } from '../store';
import { INVENT_SENSORS, INVENT_OUTPUTS, inventCircuit, inventTest, type InventSensor, type InventOutput } from '../../engine/reality/recipes';
import { SKETCHES } from '../../engine/reality/sketches';
import { defaultEnv, emptyCircuit, type Circuit, type Env } from '../../engine/reality/circuit';
import type { Slots } from '../../engine/reality/runtime';
import type { StageResult } from '../../engine/reality/progress';
import type { Control } from '../../engine/reality/missions';
import { CircuitMat } from './CircuitMat';
import { TestStation, SerialMonitor, CodeCard } from './LabPanels';
import { useBench } from './useBench';

type Done = (ok: boolean, extra?: Partial<StageResult>) => void;
type Test = { label: string; alert: boolean; reading: string };

const CONTROL: Record<InventSensor, Control> = { ultrasonic: 'distance', light: 'light', temperature: 'temp' };
const START_ENV: Record<InventSensor, Partial<Env>> = { ultrasonic: { distanceCm: 120 }, light: { light: 80 }, temperature: { tempC: 21 } };
const HOW: Record<InventSensor, string> = {
  ultrasonic: 'The ultrasonic sensor sends a click of sound and times the echo. A short echo means something is close.',
  light: 'The photoresistor and a 10 kΩ resistor make a voltage divider. A shadow raises the photoresistor’s resistance, so the reading on A0 falls.',
  temperature: 'The thermistor and a 10 kΩ resistor make a voltage divider. Warmth lowers the thermistor’s resistance, so the reading on A0 rises.',
};
const ACT: Record<InventOutput, string> = {
  buzzer: 'the UNO sets pin 8 HIGH and the active buzzer beeps',
  led: 'the UNO sets pin 8 HIGH and current flows through the 220 Ω resistor to light the LED',
  servo: 'the UNO tells the servo on pin 9 to swing its flag to 150°',
};
const FAIL: Record<InventSensor, [string, string, string]> = {
  ultrasonic: ['At first it beeped all the time because the threshold was 300 cm, farther than the room.', 'Lowered the threshold to 50 cm after watching the distances on the Serial Monitor.', 'Soft clothes and angled surfaces absorb or deflect the sound, and it only sees straight ahead in a narrow cone.'],
  light: ['At first it never alerted because I used > instead of <: a shadow makes the number smaller.', 'Switched the comparison to < and set the threshold between the bright and shadow readings.', 'It needs steady room light: a lamp switching off looks just like a person’s shadow.'],
  temperature: ['At first it alerted in a warm room because the threshold was too close to the room reading.', 'Watched the readings and moved the threshold above the warm-room value.', 'Thermistors are slow; a person has to be very close, and a sunny day could trigger it.'],
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * The boss quest: choose a sensor and an output, predict, set the threshold in real code, test at two
 * conditions, and record one failure and fix. The rubric is shown before submitting; a model answer
 * unlocks after submission.
 */
export function InventStage({ report, passed }: { report: Done; passed: boolean }) {
  const { dispatch } = useGame();
  const [sensor, setSensor] = useState<InventSensor | null>(null);
  const [output, setOutput] = useState<InventOutput | null>(null);
  const [mechanism, setMechanism] = useState('');
  const [predict, setPredict] = useState<[boolean | null, boolean | null]>([null, null]);
  const [slots, setSlots] = useState<Slots>({ cmp: '<', threshold: 500 });
  const [uploaded, setUploaded] = useState<Slots | null>(null);
  const [tests, setTests] = useState<[Test | null, Test | null]>([null, null]);
  const [failure, setFailure] = useState('');
  const [fix, setFix] = useState('');
  const [limitation, setLimitation] = useState('');
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const [usb, setUsb] = useState(true);
  const [env, setEnv] = useState<Env>(defaultEnv());
  const [appliedOk, setAppliedOk] = useState(false);
  const chosen = sensor && output;
  const circuit: Circuit = useMemo(() => (chosen ? inventCircuit(sensor!, output!) : emptyCircuit()), [sensor, output]); // eslint-disable-line react-hooks/exhaustive-deps
  const sketch = SKETCHES.invent;
  const bench = useBench(circuit, env, usb, { sketch: null }, undefined);
  const full: Slots = { ...slots, sensor: sensor ?? 'ultrasonic', output: output ?? 'buzzer' };
  const S = sensor ? INVENT_SENSORS[sensor] : null;

  const pickSensor = (s: InventSensor) => { setSensor(s); setTests([null, null]); setUploaded(null); setPredict([null, null]); setEnv({ ...defaultEnv(), ...START_ENV[s] }); bench.upload(null, {}); };
  const pickOutput = (o: InventOutput) => { setOutput(o); setTests([null, null]); setUploaded(null); bench.upload(null, {}); };
  const onUpload = () => { bench.upload(sketch, full); setUploaded(full); setTests([null, null]); };
  const runTest = (i: 0 | 1) => {
    if (!sensor || !output || !uploaded) return;
    const e = INVENT_SENSORS[sensor].tests[i];
    const t = inventTest(sensor, output, uploaded, e);
    const next: [Test | null, Test | null] = [...tests] as [Test | null, Test | null];
    next[i] = { label: INVENT_SENSORS[sensor].testLabel(e), ...t };
    setTests(next);
    setEnv({ ...env, ...e });
    // Both tests run and the device tells the two conditions apart the right way round: that's the apply check.
    if (next[0] && next[1] && !appliedOk) {
      const ok = next[0].alert && !next[1].alert;
      dispatch({ type: 'REALITY_RESULT', result: { mission: 'boss', stage: 1, ok, skill: 'design', mstage: 'apply' } });
      if (ok) setAppliedOk(true);
    }
  };

  const rubric: [string, boolean][] = [
    ['Sensor, controller, output and power chosen', !!chosen],
    ['Mechanism explained (at least 12 words)', words(mechanism) >= 12],
    ['Prediction made for both tests', predict[0] !== null && predict[1] !== null],
    ['Code uploaded and both tests run', !!(tests[0] && tests[1])],
    ['It alerts at test 1 and stays quiet at test 2', !!(tests[0]?.alert && tests[1] && !tests[1].alert)],
    ['One failure and its fix recorded', words(failure) >= 4 && words(fix) >= 4],
    ['One limitation named', words(limitation) >= 4],
  ];
  const ready = rubric.every(([, ok]) => ok);
  const submit = () => {
    if (!sensor || !output) return;
    const ok = ready;
    const S0 = INVENT_SENSORS[sensor];
    dispatch({ type: 'REALITY_INVENTION', invention: {
      at: Date.now(), sensor, output, cmp: String(uploaded?.cmp ?? slots.cmp), threshold: Number(uploaded?.threshold ?? slots.threshold), mechanism,
      prediction: S0.tests.map((e, i) => `${S0.testLabel(e)}: ${predict[i] ? 'alert' : 'quiet'}`).join('; '),
      tests: tests.filter(Boolean) as Test[], failure, fix, limitation, passed: ok,
    } });
    setSubmitted(ok);
    report(ok, ok ? {} : { error: { tag: 'design', prompt: 'Boss quest rubric', chosen: rubric.filter(([, v]) => !v).map(([k]) => k).join('; '), correct: 'Every rubric line ticked', why: 'An invention counts when it is explained, tested at both conditions, behaves the right way round and has a recorded failure, fix and limitation.' } });
  };

  const text = (label: string, value: string, set: (s: string) => void, ph: string) => (
    <label className="rl-text"><span>{label}</span><textarea rows={3} value={value} placeholder={ph} onChange={(e) => set(e.target.value)} /></label>
  );

  return (
    <div className="rl-invent">
      <div className="rl-phase">1 · Choose your parts</div>
      <div className="rl-pick"><b>Sensor (notices)</b>{(Object.keys(INVENT_SENSORS) as InventSensor[]).map((k) => <button key={k} className={`rl-chip ${sensor === k ? 'on' : ''}`} onClick={() => pickSensor(k)} aria-pressed={sensor === k}>{INVENT_SENSORS[k].label}</button>)}</div>
      <div className="rl-pick"><b>Output (responds)</b>{(Object.keys(INVENT_OUTPUTS) as InventOutput[]).map((k) => <button key={k} className={`rl-chip ${output === k ? 'on' : ''}`} onClick={() => pickOutput(k)} aria-pressed={output === k}>{INVENT_OUTPUTS[k].label}</button>)}</div>
      <div className="rl-blocks" aria-label="Block diagram">
        <div className="rl-block in"><small>SENSOR</small>{sensor ? INVENT_SENSORS[sensor].label.split(' (')[0] : '?'}</div><span className="rl-arrow" aria-hidden="true">→</span>
        <div className="rl-block mid"><small>CONTROLLER</small>Arduino UNO</div><span className="rl-arrow" aria-hidden="true">→</span>
        <div className="rl-block out"><small>OUTPUT</small>{output ? INVENT_OUTPUTS[output].label.split(' (')[0] : '?'}</div>
        <div className="rl-block pwr"><small>POWER</small>USB 5 V from the computer</div>
      </div>

      {chosen && S && <>
        <div className="rl-phase">2 · Explain and predict</div>
        {text('How does it work? Say what the sensor measures, what the UNO decides and what the output does.', mechanism, setMechanism, 'The sensor… so the UNO… and then the…')}
        {S.tests.map((e, i) => (
          <div key={i} className="rl-predict"><span>Test {i + 1}: {S.testLabel(e)}. It will…</span>
            <span>{[true, false].map((v) => <button key={String(v)} className={`rl-chip ${predict[i] === v ? 'on' : ''}`} onClick={() => setPredict((p) => (i === 0 ? [v, p[1]] : [p[0], v]))}>{v ? 'alert' : 'stay quiet'}</button>)}</span>
          </div>
        ))}

        <div className="rl-phase">3 · Code the decision</div>
        <p className="small">Set the comparison and the threshold, then Upload. Move the {CONTROL[sensor] === 'distance' ? 'hand' : CONTROL[sensor]} slider and watch the Serial Monitor to see real readings ({S.unit}).</p>
        <CodeCard sketch={sketch} slots={full} setSlots={(s) => setSlots({ cmp: s.cmp, threshold: s.threshold })} onUpload={onUpload} usb={usb} running={!!uploaded} lockedKeys={['sensor', 'output']} />
        {!hint ? <button className="rl-chip" onClick={() => setHint(true)}>Stuck on the threshold?</button> : <p className="small muted">Try: alert when reading {S.suggest.cmp} {S.suggest.threshold}. Check it against the Serial Monitor first.</p>}
        <CircuitMat circuit={circuit} editable={false} usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} onUsb={setUsb} />
        <TestStation circuit={circuit} env={env} setEnv={setEnv} result={bench.result} controls={[CONTROL[sensor]]} usb={usb} />
        <SerialMonitor lines={bench.serial} usb={usb} />

        <div className="rl-phase">4 · Test at two conditions</div>
        {!uploaded && <p className="small muted">Upload your code first.</p>}
        <div className="rl-tests">
          {S.tests.map((e, i) => {
            const t = tests[i];
            return (
              <div key={i} className="rl-test">
                <button className="rl-chip primary" disabled={!uploaded} onClick={() => runTest(i as 0 | 1)}>▶ Test {i + 1}: {S.testLabel(e)}</button>
                {t && <div className={`rl-feedback ${t.alert === (i === 0) ? 'ok' : 'bad'}`}>{t.alert ? 'ALERT' : 'quiet'}{t.reading ? ` · reading ${Number(t.reading).toFixed(0)}` : ''}{predict[i] !== null ? ` · you predicted ${predict[i] ? 'alert' : 'quiet'}${predict[i] === t.alert ? ' ✓' : ' ✗'}` : ''}</div>}
              </div>
            );
          })}
        </div>
        {tests[0] && tests[1] && !(tests[0].alert && !tests[1].alert) && <p className="rl-feedback bad">It should alert at test 1 and stay quiet at test 2. Check the comparison sign and the threshold against the readings, Upload, and test again. That’s your failure and fix to record.</p>}

        <div className="rl-phase">5 · Engineer’s notes</div>
        {text('One thing that went wrong (or could go wrong)', failure, setFailure, 'At first it…')}
        {text('How you fixed it', fix, setFix, 'I changed…')}
        {text('One limitation of your design', limitation, setLimitation, 'It won’t work when…')}

        <div className="rl-rubric">
          <b>Rubric</b>
          {rubric.map(([k, ok]) => <div key={k} className={ok ? 'ok' : ''}>{ok ? '✓' : '○'} {k}</div>)}
        </div>
        <div className="rl-actions"><button className="rl-next" disabled={!chosen || submitted === true} onClick={submit}>{submitted === false ? 'Resubmit' : 'Submit my invention'}</button></div>
        {submitted !== null && <div className={`rl-feedback ${submitted ? 'ok' : 'bad'}`} role="status">{submitted ? '★ Invention recorded in your notebook. Boss quest passed.' : 'Recorded. Some rubric lines are still open: finish them and resubmit.'}</div>}
        {(submitted !== null || passed) && (
          <div className="rl-model">
            <b>Model answer ({INVENT_SENSORS[sensor].label.split(' (')[0]} → {INVENT_OUTPUTS[output!].label.split(' (')[0]})</b>
            <p>{HOW[sensor]} The UNO checks: reading {S.suggest.cmp} {S.suggest.threshold}? If yes, {ACT[output!]}. Power comes from the computer over USB (5 V).</p>
            <p><b>Tests:</b> {S.testLabel(S.tests[0])} → alert; {S.testLabel(S.tests[1])} → quiet.</p>
            <p><b>Failure:</b> {FAIL[sensor][0]} <b>Fix:</b> {FAIL[sensor][1]}</p>
            <p><b>Limitation:</b> {FAIL[sensor][2]}</p>
          </div>
        )}
      </>}
    </div>
  );
}
