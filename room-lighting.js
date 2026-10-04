export const LIGHTING={
  daylight:{base:1.25,window:0.7,lamp:0,fog:1,tint:0xffffff},
  overcast:{base:0.8,window:0.35,lamp:0,fog:0.88,tint:0xe4edf2},
  shaded:{base:0.4,window:0.65,lamp:0,fog:0.68,tint:0xdce7df},
  darkDay:{base:0.22,window:0.85,lamp:0,fog:0.52,tint:0xdde5eb},
  night:{base:0.3,window:0,lamp:4,fog:0.35,tint:0xe9dcc5},
};
export function roomLighting(index,override){
  const names=Object.keys(LIGHTING);
  const seed=Math.imul(index+31,0x45d9f3b)>>>0;
  const chosen=LIGHTING[override]?override:index<5?names[index]:names[((seed^(seed>>>16))>>>0)%names.length];
  return {name:chosen,...LIGHTING[chosen],side:index%2?1:-1};
}
