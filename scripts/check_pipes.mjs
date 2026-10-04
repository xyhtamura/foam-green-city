// Headless check of pipe-runs.js.
//
// Usage:
//   node check-pipes.mjs                  six styles x widths 4, 6, 8 x 1000 seeds
//   node check-pipes.mjs --seeds 200 --length 18 --widths 4,6,8,10
//
// Each case is generated twice: once in a room with no windows, and once with
// seeded window stretches passed as `avoid`. Every result is tested with
// checkPipeRun() and regenerated to confirm it repeats. Exit code 1 on failure.
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pipe-runs.js',import.meta.url),'utf8');
const {PIPE_STYLE_IDS,generatePipeRun,checkPipeRun}=
  await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const seeds=Number(arg('seeds',1000)),length=Number(arg('length',12));
const widths=String(arg('widths','4,6,8')).split(',').map(Number);

// Window tiles as index.html places them: each 2 m tile on each wall, 34% chance.
function windows(seed){
  let a=seed*7919+13;const r=()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};
  const avoid=[];
  for(let z=0;z>-length;z-=2)for(const side of [-1,1])if(r()<0.34)avoid.push({side,from:z,to:z-2});
  return avoid;
}

let failed=0;
console.log('style     width  pipes  elbows  tees  clamps  faucets  metres     empty  distinct  failing');
for(const style of PIPE_STYLE_IDS)for(const width of widths){
  const s={pipes:[Infinity,0],elbows:[Infinity,0],tees:[Infinity,0],clamps:[Infinity,0],faucets:[Infinity,0],metres:[Infinity,0],empty:0,failures:0,distinct:new Set()};
  const span=(pair,v)=>{pair[0]=Math.min(pair[0],v);pair[1]=Math.max(pair[1],v);};
  for(let seed=0;seed<seeds;seed++)for(const avoid of [[],windows(seed)]){
    const options={width,length,seed,style,avoid},pieces=generatePipeRun(options),json=JSON.stringify(pieces);
    const result=checkPipeRun(pieces,options),problems=result.failures.map(f=>f.rule);
    if(JSON.stringify(generatePipeRun(options))!==json)problems.push('not repeatable');
    if(problems.length){s.failures++;if(s.failures<=3)console.log(`FAIL ${style} width ${width} seed ${seed}${avoid.length?' with windows':''}: ${[...new Set(problems)].join(', ')}`);}
    if(!pieces.length)s.empty++;
    span(s.pipes,result.counts.pipe);span(s.elbows,result.counts.elbow);span(s.tees,result.counts.tee);
    span(s.clamps,result.counts.clamp);span(s.faucets,result.counts.faucet);span(s.metres,result.pipeLength);
    s.distinct.add(json);
  }
  failed+=s.failures;
  console.log([style.padEnd(9),String(width).padStart(5),s.pipes.join('-').padStart(6),s.elbows.join('-').padStart(7),s.tees.join('-').padStart(5),
    s.clamps.join('-').padStart(7),s.faucets.join('-').padStart(8),s.metres.map(v=>v.toFixed(1)).join('-').padStart(10),String(s.empty).padStart(8),String(s.distinct.size).padStart(9),String(s.failures).padStart(8)].join(' '));
}
console.log(failed?`\n${failed} failing cases of ${PIPE_STYLE_IDS.length*widths.length*seeds*2}.`:`\nAll ${PIPE_STYLE_IDS.length*widths.length*seeds*2} cases pass.`);
process.exit(failed?1:0);
