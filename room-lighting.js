export const LIGHTING={
  daylight:{base:1.25,window:0.7,lamp:0,fog:1,tint:0xffffff},
  overcast:{base:0.8,window:0.35,lamp:0,fog:0.88,tint:0xe4edf2},
  shaded:{base:0.4,window:0.65,lamp:0,fog:0.68,tint:0xdce7df},
  darkDay:{base:0.22,window:0.85,lamp:0,fog:0.52,tint:0xdde5eb},
  night:{base:0.12,window:0,lamp:4,fog:0.18,tint:0xc4cbdc},
  deepNight:{base:0.045,window:0.015,lamp:0,fog:0.055,tint:0x7784b5},
  dawn:{base:0.48,window:0.75,lamp:0,fog:0.62,tint:0xe8b6a9},
  dusk:{base:0.3,window:0.55,lamp:1.5,fog:0.4,tint:0xcf9aa9},
  // The cool counterpart of dusk: dim blue-indigo, with the lamp just on.
  blueHour:{base:0.34,window:0.5,lamp:0.9,fog:0.36,tint:0x8a97e0},
  red:{base:0.27,window:0,lamp:4,fog:0.24,tint:0xff5540,lightColor:0xff3420},
  violet:{base:0.23,window:0,lamp:4,fog:0.22,tint:0x9472ff,lightColor:0x7652ff},
};
export function roomLighting(index,override){
  const names=['daylight','overcast','daylight','shaded','dawn'];
  const seed=Math.imul(index+31,0x45d9f3b)>>>0;
  const roll=((seed^(seed>>>16))>>>0)%100;
  const selected=roll<34?'daylight':roll<55?'overcast':roll<69?'shaded':roll<79?'dawn':roll<83?'dusk':roll<87?'blueHour':roll<90?'darkDay':roll<95?'night':roll<97?'deepNight':roll<98?'red':roll<99?'violet':'blueHour';
  const chosen=LIGHTING[override]?override:index>=0&&index<5?names[index]:selected;
  return {name:chosen,...LIGHTING[chosen],side:index%2?1:-1};
}
