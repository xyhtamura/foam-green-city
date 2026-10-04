// Continuous route profiles; camera and GPU geometry share the same local frame.
export const RADIUS=40;
export const TWIST_LENGTH=72;
export const SPATIAL_PROFILES=['twist','reverse','unwind','sway','mixed'];
const normalize=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function spatialFrame(distance,profile='twist'){
  const d=distance,a=d/RADIUS,c=Math.cos(a),s=Math.sin(a);
  let center=[RADIUS*(1-c),0,-RADIUS*s],forward=[s,0,-c],b=d*Math.PI/TWIST_LENGTH;
  if(profile==='reverse')b=-b;
  if(profile==='unwind')b=1.8*Math.sin(d/44);
  if(profile==='mixed'){
    b=d*Math.PI/96+0.55*Math.sin(d/36);
    center[1]=5*(1-Math.cos(d/32));forward[1]=5/32*Math.sin(d/32);
  }
  if(profile==='sway'){
    center=[14*(1-Math.cos(d/36)),3*Math.sin(d/48),-d];
    forward=[14/36*Math.sin(d/36),3/48*Math.cos(d/48),-1];
    b=1.5*Math.sin(d/52);
  }
  const right0=normalize(cross(forward,[0,1,0])),back=normalize(forward.map(x=>-x)),up0=cross(back,right0),cb=Math.cos(b),sb=Math.sin(b);
  return {center,right:right0.map((x,i)=>x*cb+up0[i]*sb),up:up0.map((x,i)=>x*cb-right0[i]*sb),back,roll:b};
}
export function spatialPoint(x,y,z,profile='twist'){
  const f=spatialFrame(-z,profile);
  return f.center.map((v,i)=>v+x*f.right[i]+y*f.up[i]);
}
export const SPATIAL_GLSL=`
vec3 spatialCenter(float d){
  float a=d/40.0;
  if(SPATIAL_MODE==3)return vec3(14.0*(1.0-cos(d/36.0)),3.0*sin(d/48.0),-d);
  return vec3(40.0*(1.0-cos(a)),SPATIAL_MODE==4?5.0*(1.0-cos(d/32.0)):0.0,-40.0*sin(a));
}
mat3 spatialBasis(float d){
  float a=d/40.0,b=d*3.14159265359/72.0;
  vec3 forward=vec3(sin(a),0.0,-cos(a));
  if(SPATIAL_MODE==1)b=-b;
  if(SPATIAL_MODE==2)b=1.8*sin(d/44.0);
  if(SPATIAL_MODE==3){forward=vec3(14.0/36.0*sin(d/36.0),3.0/48.0*cos(d/48.0),-1.0);b=1.5*sin(d/52.0);}
  if(SPATIAL_MODE==4){forward.y=5.0/32.0*sin(d/32.0);b=d*3.14159265359/96.0+0.55*sin(d/36.0);}
  vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0))),back=normalize(-forward),up=cross(back,right);
  return mat3(right*cos(b)+up*sin(b),up*cos(b)-right*sin(b),back);
}
vec3 spatialPoint(vec3 p){
  float d=-p.z;
  return spatialCenter(d)+spatialBasis(d)*vec3(p.xy,0.0);
}`;
