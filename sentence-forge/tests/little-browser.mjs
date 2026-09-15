// Run with PLAYWRIGHT_MODULE and CHROME_PATH when the browser is not in the standard cache.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MISSIONS,BY_ID} from '../content.js';
import {LITTLE} from '../little.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PREFIX='/engineering-quest/sentence-forge/';
const qaDir=process.env.QA_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'sentence-forge-qa-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(!name.startsWith(PREFIX)){res.writeHead(404);res.end();return;}name=name.slice(PREFIX.length)||'index.html';try{let filename=path.join(root,name);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(fs.readFileSync(filename));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}${PREFIX}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const click=async action=>page.locator(`[data-action="${action}"]`).first().click();
const nav=async name=>page.locator(`button[data-action="nav"][data-view="${name}"]`).first().click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sentence-forge.save.v1')));
async function solve({advance=true}={}){let id=await page.locator('.order-panel').getAttribute('data-qid'),q=BY_ID[id];assert.ok(q,id);if(q.type!=='choice'){for(let i=0;i<q.tokens.length;i++)await page.locator(`[data-action="add-token"][data-index="${i}"]`).click();await click('run');}await page.locator(`[data-action="answer"][data-index="${q.answer}"]`).click();if(advance&&await page.locator('[data-action="next"]').count())await click('next');return id;}

const tap=async action=>page.locator(`[data-trail="${action}"]`).first().click();
async function quiz(wrong=0){for(let i=0;i<5;i++)await page.locator(`[data-trail="answer"][data-index="${i<wrong?1:0}"]`).click();}
async function read(ms=60000){await tap('read');await page.clock.fastForward(ms);await tap('finish');assert.equal(await page.locator('.trail-passage').count(),0);}

try{
 await page.clock.install();await page.addInitScript(()=>{window.spoken=[];window.speechSynthesis.speak=u=>window.spoken.push(u.text);});await page.goto(base+'#adventure');
 assert.equal(await page.locator('[data-little="start"]').count(),2);assert.equal(await page.locator('.trail-map').isVisible(),false);
 for(const quest of LITTLE){
 await page.locator(`[data-little="start"][data-id="${quest.id}"]`).click();
 assert.equal(await page.locator('.sidebar').isVisible(),false);
 assert.match((await page.evaluate(()=>window.spoken)).at(-1),/Tap the matching picture/);
 for(const [i,step] of quest.steps.entries()){
 assert.equal(await page.locator('.little-word p').innerText(),step[0]);assert.equal(await page.locator('[data-little="choose"]').count(),2);
 if(i===0){await page.locator(`[data-picture="${step[2]}"]`).click();assert.equal(await page.locator('[data-little="next"]').count(),0);assert.match(await page.locator('.little-feedback').innerText(),/Try/);await page.locator('[data-little="word"]').click();assert.equal((await page.evaluate(()=>window.spoken)).at(-1),step[0]);}
 if(quest.id==='buddy'&&i===4){await page.setViewportSize({width:390,height:844});await page.screenshot({path:qaDir+'/little-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.locator(`[data-picture="${step[1]}"]`).click();await page.locator('[data-little="next"]').click();
 }
 assert.match(await page.locator('h1').innerText(),new RegExp('You helped '+quest.name));await page.locator('[data-little="home"]').click();
 }
 assert.deepEqual((await saved()).profiles[0].trail.little,['buddy','dot']);assert.equal((await saved()).profiles[0].trail.passed.length,0);
 await page.reload();assert.equal(await page.locator('[data-little="start"]').filter({hasText:'★'}).count(),2);
 await page.locator('.trail-full-map>summary').click();assert.equal(await page.locator('.trail-map').isVisible(),true);await page.locator('[data-trail="start"]').first().click();assert.equal(await page.locator('[data-trail="read"]').count(),1);await page.locator('[data-trail="home"]').click();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await page.locator('[data-little="start"]').first().click();assert.equal(await page.locator('[data-little="choose"]').count(),2);assert.deepEqual(errors,[]);console.log('PASS: both guided rescues, spoken instructions, retry, no score inflation, saved stars, mobile, longer-story access, offline');
}finally{await browser.close();server.close();}
