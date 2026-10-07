// The yero path's dressing: a room keeps its draw, the four outcomes are even, and a forced
// value wins. Run with: node --experimental-default-type=module scripts/check_yero_dressing.mjs
import assert from 'node:assert/strict';
import {yeroDressing} from '../yero-dressing.js';
import {isYero} from '../room-generator.js';

const key=d=>(d.posts?'posts':'')+(d.grass?'grass':'')||'plain';

// The same room draws the same thing every time.
for(const index of [91,185,565,738])assert.deepEqual(yeroDressing(index),yeroDressing(index));

// Over many rooms each outcome is about a quarter.
const tally={plain:0,posts:0,grass:0,postsgrass:0},ROOMS=40000;
for(let index=12;index<12+ROOMS;index++)tally[key(yeroDressing(index))]++;
for(const [name,count] of Object.entries(tally))assert.ok(Math.abs(count/ROOMS-0.25)<0.01,`${name} is ${(count/ROOMS).toFixed(3)} of rooms, not a quarter`);

// A forced value wins over the draw.
assert.deepEqual(yeroDressing(91,'plain'),{posts:false,grass:false});
assert.deepEqual(yeroDressing(91,'posts'),{posts:true,grass:false});
assert.deepEqual(yeroDressing(91,'grass'),{posts:false,grass:true});
assert.deepEqual(yeroDressing(91,'both'),{posts:true,grass:true});
assert.deepEqual(yeroDressing(91,'nonsense'),yeroDressing(91));

// What the default seed's first yero rooms draw, for the notes.
const first=[];
for(let index=0;first.length<8&&index<20000;index++)if(isYero(index,5))first.push(`${index} ${key(yeroDressing(index))}`);
console.log('PASS yero dressing:',Object.entries(tally).map(([n,c])=>`${n} ${(c/ROOMS*100).toFixed(1)}%`).join(', '));
console.log('First yero rooms, seed 5:',first.join('; '));
