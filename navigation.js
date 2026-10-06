import {branchOpenings,sideSpacePlan} from './side-spaces.js?v=fb5187d433';
import {generateRoom} from './room-generator.js?v=fb5187d433';
import {createRoomSequence,cameraRoute,routePoint,passageExit,exitRoute} from './room-sequences.js?v=fb5187d433';

// Geometry is disposable; seeded descriptors and distance prefixes reconstruct it.
export function createWalkSequence(options){
  const forward=createRoomSequence({generate:generateRoom,...options});
  const backward=createRoomSequence({generate:generateRoom,...options,seed:(options.seed??5)+7919});
  // A room's shell depends on its index alone. Its contents also depend on a salt, fixed
  // while the room is built and changed once it is discarded, so a revisit differs.
  const held=new Map();let era=0;
  return {
    hold(index){if(!held.has(index))held.set(index,era);},
    release(index){held.delete(index);era++;},
    reroll(){held.clear();era++;},
    room(index){
      const salt=held.get(index)??era;
      const decorate=r=>({...r,sideSpaces:options.sideSpaces,sideRoom:options.sideRoom,sideExits:options.sideExits,branchSeed:(options.seed??5)+salt*31,
        ...(salt?{generationIndex:(r.generationIndex??r.index)+salt*1000003}:{})});
      if(index>=0)return decorate(forward.room(index));
      const source=backward.room(-index-1);
      return decorate({...source,index,generationIndex:10000-index,startZ:-source.startZ+source.length});
    },
    atDistance(distance){
      if(distance>=0)return this.room(forward.atDistance(distance).index);
      // A join belongs to the cell on its forward side.
      const source=backward.atDistance(Math.max(0,-distance-1e-8));
      return this.room(-source.index-1);
    }
  };
}
// Every way out of a room other than its main doorway: a zone that triggers the cut, and a one-way route to it.
export function roomExits(room){
  const exits=[];
  for(const portal of branchOpenings(room)){
    if(portal.kind==='legacy'){
      const e=passageExit(room,portal);
      exits.push({zone:{minX:e.x-1.45,maxX:e.x+1.45,minZ:e.z,maxZ:e.z+0.8},route:exitRoute(room,portal)});
      continue;
    }
    const e=sideSpacePlan(room,portal).exit;if(!e)continue;
    const points=[{x:0,z:0},{x:0,z:portal.z},{x:portal.side*(room.width/2+0.3),z:portal.z},{x:e.x-e.side*0.45,z:e.z}];
    let distance=0;
    const legs=points.slice(1).map((to,i)=>{
      const start=points[i],length=Math.hypot(to.x-start.x,to.z-start.z),leg={start,end:to,length,distance};distance+=length;return leg;
    });
    exits.push({zone:e.zone,route:{legs,length:distance,exit:true}});
  }
  return exits;
}
export function retainedRooms(index,batchSize=2){
  const batch=Math.floor(index/batchSize),result=[];
  for(let i=(batch-1)*batchSize;i<(batch+2)*batchSize;i++)result.push(i);
  return result;
}
export function nearestRouteDistance(room,x,z){
  const route=cameraRoute(room);let best=Infinity,distance=0;
  for(const leg of route.legs){
    const dx=leg.end.x-leg.start.x,dz=leg.end.z-leg.start.z;
    const u=Math.max(0,Math.min(1,((x-leg.start.x)*dx+(z-leg.start.z)*dz)/(leg.length**2)));
    const error=(x-leg.start.x-u*dx)**2+(z-leg.start.z-u*dz)**2;
    if(error<best){best=error;distance=leg.distance+u*leg.length;}
  }
  return {distance,point:routePoint(route,distance)};
}
export function walkRegions(room,openings=[]){
  const regions=[{minX:-room.width/2+0.12,maxX:room.width/2-0.12,minZ:room.startZ-room.length,maxZ:room.startZ}];
  for(const portal of openings){
    if(portal.kind&&portal.kind!=='legacy'){regions.push(...sideSpacePlan(room,portal).regions.map(r=>({...r,minZ:r.minZ+room.startZ,maxZ:r.maxZ+room.startZ})));continue;}
    const reach=portal.reach,side=portal.side,z=room.startZ+portal.z;
    const edge=side*(room.width/2+reach),turnX=side*(room.width/2+reach-1.5);
    regions.push({minX:side<0?edge+0.12:room.width/2-0.4,maxX:side<0?-room.width/2+0.4:edge-0.12,minZ:z-1.88,maxZ:z+1.88});
    regions.push({minX:turnX-1.38,maxX:turnX+1.38,minZ:z-2-portal.turn+0.12,maxZ:z+1.88});
  }
  return regions;
}
export function canOccupy(x,z,{regions,blocks=[],radius=0.22}){
  for(const [dx,dz] of [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]])
    if(!regions.some(r=>x+dx>=r.minX&&x+dx<=r.maxX&&z+dz>=r.minZ&&z+dz<=r.maxZ))return false;
  return !blocks.some(b=>x+radius>b.minX&&x-radius<b.maxX&&z+radius>b.minZ&&z-radius<b.maxZ);
}
export function moveWalker(state,{forward=0,strafe=0,delta,canMove,speed=2.2}){
  const length=Math.hypot(forward,strafe)||1;
  const dx=(-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*strafe)/length*speed*delta;
  const dz=(-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*strafe)/length*speed*delta;
  // Small steps avoid tunnelling; separate axes allow sliding along an obstacle.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/0.06));
  for(let i=0;i<steps;i++){
    if(canMove(state.x+dx/steps,state.z))state.x+=dx/steps;
    if(canMove(state.x,state.z+dz/steps))state.z+=dz/steps;
  }
}

// Grid search is only used when returning to autopilot, not every frame.
export function pathToRoute(state,room,canMove){
  const target=nearestRouteDistance(room,state.x,state.z-room.startZ);
  const goal={x:target.point.x,z:room.startZ+target.point.z},step=0.35;
  const nodes=[{x:0,z:0,parent:-1}],seen=new Set(['0,0']);
  for(let head=0;head<nodes.length&&head<16000;head++){
    const node=nodes[head],x=state.x+node.x*step,z=state.z+node.z*step;
    if(Math.hypot(x-goal.x,z-goal.z)<step&&canMove(goal.x,goal.z)){
      const path=[goal];let i=head;
      while(i>0){const n=nodes[i];path.push({x:state.x+n.x*step,z:state.z+n.z*step});i=n.parent;}
      return {distance:target.distance,path:path.reverse()};
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=node.x+dx,nz=node.z+dz,key=nx+','+nz;
      if(seen.has(key))continue;seen.add(key);
      // Check the edge midpoint too, so a thin obstacle cannot be skipped.
      if(canMove(state.x+nx*step,state.z+nz*step)&&canMove(x+dx*step/2,z+dz*step/2))nodes.push({x:nx,z:nz,parent:head});
    }
  }
  return null;
}
