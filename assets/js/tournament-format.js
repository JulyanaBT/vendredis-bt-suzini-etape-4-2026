export const COURTS={DM:{name:'🐝 Manon Queen Bee',className:'court-manon'},DD:{name:'🌶️ Lisa de los pimentos',className:'court-lisa'}};
export const MATCH_MINUTES=25, TRANSITION_MINUTES=5;
export function formatFor(count){
 if(!Number.isInteger(count)||count<4||count>12)return null;
 const sizes=count<=5?[count]:count===6?[3,3]:[];
 const description=count<=5?'Une poule unique : chaque équipe rencontre toutes les autres. Le classement de la poule constitue le classement final. TS1 et TS2 se rencontrent lors du dernier match.':count===6?'Deux poules de 3, avec TS1 et TS2 dans des poules différentes. Demi-finales croisées entre les 1ers et 2es, puis finale et match pour la 3e place. Les deux 3es jouent la 5e place.':count===7?'Trois quarts de finale et TS1 exemptée de quart, placée en bas du tableau ; TS2 est placée en haut. Les quatre qualifiés jouent les places 1 à 4. Les trois perdants des quarts disputent une poule pour les places 5 à 7. Trois matchs par équipe, sauf l’équipe exemptée qui en joue deux.':'Quatre quarts de finale, avec TS2 en haut du tableau et TS1 en bas. Les gagnants jouent les places 1 à 4 ; les perdants les places 5 à 8. Demi-finales et matchs de classement dans les deux branches : trois matchs par équipe.';
 if(count>=9)return {count,sizes:[],title:'Tableau avec exemptions et classement',description:'Tableau principal avec exemptions pour les têtes de série, puis matchs ou poules de classement. Trois matchs minimum par équipe.',poolMatches:0,totalMatches:{9:19,10:19,11:18,12:20}[count],byes:16-count};
 return {count,sizes,title:count<=5?'Poule unique':count===6?'2 poules de 3':'Quarts et matchs de classement',description,poolMatches:sizes.reduce((n,s)=>n+s*(s-1)/2,0),totalMatches:count<=5?count*(count-1)/2:count===6?11:count===7?10:12};
}
export function roundRobin(teams,prefix='A'){
 const rotation=[...teams];if(rotation.length%2)rotation.push(null);
 const rounds=[];for(let r=0;r<rotation.length-1;r++){const matches=[];for(let i=0;i<rotation.length/2;i++){const a=rotation[i],b=rotation[rotation.length-1-i];if(a!==null&&b!==null)matches.push({a,b,stage:`Poule ${prefix} · rotation ${r+1}`});}rounds.push(matches);rotation.splice(1,0,rotation.pop());}return rounds;
}
export function poolFixtures(groups){if(!groups.length)return [];const rounds=groups.map((g,i)=>roundRobin(g,String.fromCharCode(65+i)));const result=[];for(let r=0;r<Math.max(...rounds.map(x=>x.length));r++)for(const pool of rounds)result.push(...(pool[r]||[]));return result;}
export function groupsFor(d){const f=formatFor(d.count);if(!f)return [];if((d.drawn_at||d.no_draw)&&d.count<=6)return [d.pool_a,...(d.count===6?[d.pool_b]:[])];if(d.count<=5)return [Array.from({length:d.count},(_,i)=>i<2?'TS'+(i+1):'A'+(i+1))];return d.count===6?[['TS2','A2','A3'],['TS1','B2','B3']]:[];}
export function fixturesFor(d){
 const f=formatFor(d.count);if(!f)return [];
 const jobs=[],add=(id,a,b,stage,deps=[],phase='finales')=>jobs.push({id,a,b,stage,deps,phase,format:3});
 if(d.count<=6){
  const groups=groupsFor(d),pool=poolFixtures(groups);
  if(d.count<=5){
   const seeds=groups[0].slice(0,2),last=pool.find(m=>seeds.includes(m.a)&&seeds.includes(m.b));
   pool.filter(m=>m!==last).forEach((m,i)=>add('POOL'+(i+1),m.a,m.b,m.stage,[],'poules'));
   add('TS-FINAL',last.a,last.b,'Poule unique · TS1 contre TS2',jobs.map(m=>m.id),'poules');return jobs;
  }
  pool.forEach((m,i)=>add('POOL'+(i+1),m.a,m.b,m.stage,[],'poules'));
  const deps=jobs.map(m=>m.id);
  add('DF1','1er poule A','2e poule B','Demi-finale · places 1–4',deps);
  add('DF2','1er poule B','2e poule A','Demi-finale · places 1–4',deps);
  add('P5','3e poule A','3e poule B','5e place',deps);
 }else if(d.count>=9){
  return largeFixtures(d,add,jobs);
 }else{
  const order=d.drawn_at?d.draw_order:Array.from({length:d.count},(_,i)=>i===0?'TS2':i===d.count-1?'TS1':'T'+(i+1));
  const q=d.count===7?3:4;
  for(let i=0;i<q;i++)add('QF'+(i+1),order[i*2],order[i*2+1],'Quart de finale',[],'quarts');
  const deps=jobs.map(m=>m.id);
  add('DF1','Vainqueur QF1','Vainqueur QF2','Demi-finale · places 1–4',deps);
  add('DF2','Vainqueur QF3',d.count===7?order[6]:'Vainqueur QF4','Demi-finale · places 1–4',deps);
  if(d.count===7){
   [['Perdant QF1','Perdant QF2'],['Perdant QF1','Perdant QF3'],['Perdant QF2','Perdant QF3']].forEach(([a,b],i)=>add('C'+(i+1),a,b,'Poule de classement · places 5–7',deps,'classement'));
  }else{
   add('DC1','Perdant QF1','Perdant QF2','Demi-finale · places 5–8',deps);
   add('DC2','Perdant QF3','Perdant QF4','Demi-finale · places 5–8',deps);
   add('P7','Perdant DC1','Perdant DC2','7e place',['DC1','DC2']);
   add('P5','Vainqueur DC1','Vainqueur DC2','5e place',['DC1','DC2']);
  }
 }
 add('P3','Perdant DF1','Perdant DF2','3e place',['DF1','DF2']);
 add('F','Vainqueur DF1','Vainqueur DF2','Finale · 1re place',['DF1','DF2']);return jobs;
}
// Sixteen positions preserve the familiar tennis bracket: TS2 at the top,
// TS1 at the bottom, the other seeded exemptions in opposite quarters.
export function bracketPositions(d){
 if(d.draw_order?.length===16)return [...d.draw_order];
 const teams=d.drawn_at&&d.draw_order?.length===d.count?[...d.draw_order]:Array.from({length:d.count},(_,i)=>'T'+(i+1));
 const positions=Array(16).fill(null),seedPositions=[15,0,8,7,4,11,12];
 const byes=16-d.count;
 seedPositions.slice(0,byes).forEach((p,i)=>positions[p]=teams[i]);
 const reserved=new Set(seedPositions.slice(0,byes).map(p=>p^1));
 let next=byes;
 positions.forEach((v,i)=>{if(v===null&&!reserved.has(i))positions[i]=teams[next++];});
 return positions;
}
function largeFixtures(d,add,jobs){
 const order=bracketPositions(d),first=[],entries=[];
 for(let i=0;i<8;i++){
  const a=order[i*2],b=order[i*2+1];
  if(a&&b){const id='R1'+(first.length+1);add(id,a,b,'Premier tour',[],'premier');first.push(id);entries.push('Vainqueur '+id);}
  else entries.push(a||b);
 }
 const refs=values=>values.filter(v=>v?.startsWith('Vainqueur ')).map(v=>v.slice(10));
 for(let i=0;i<4;i++){const pair=entries.slice(i*2,i*2+2);add('QF'+(i+1),...pair,'Quart de finale',refs(pair),'quarts');}
 const q=['QF1','QF2','QF3','QF4'];
 add('DF1','Vainqueur QF1','Vainqueur QF2','Demi-finale · places 1–4',q.slice(0,2));
 add('DF2','Vainqueur QF3','Vainqueur QF4','Demi-finale · places 1–4',q.slice(2));
 add('P3','Perdant DF1','Perdant DF2','3e place',['DF1','DF2']);
 add('F','Vainqueur DF1','Vainqueur DF2','Finale · 1re place',['DF1','DF2']);
 const losers=[...first.map(id=>'Perdant '+id),...q.map(id=>'Perdant '+id)];
 const pool=(members,key,deps)=>roundRobin(members,key).flat().forEach((m,i)=>{add('L'+key+(i+1),m.a,m.b,'Poule '+key+' · classement',deps,'classement');jobs.at(-1).pool=key;});
 if(d.count===9||d.count===10){
  if(d.count===9)pool(losers,'C',[...first,...q]);
  else{
   pool(losers.filter((_,i)=>i%2===0),'C',[...first,...q]);pool(losers.filter((_,i)=>i%2===1),'D',[...first,...q]);
   const deps=jobs.filter(m=>m.pool).map(m=>m.id);
   ['1er','2e','3e'].forEach((rank,i)=>add('P'+(5+i*2),rank+' poule C',rank+' poule D',(5+i*2)+'e place',deps));
  }
 }else{
  add('DC1','Perdant QF1','Perdant QF2','Demi-finale · places 5–8',q.slice(0,2));
  add('DC2','Perdant QF3','Perdant QF4','Demi-finale · places 5–8',q.slice(2));
  add('P7','Perdant DC1','Perdant DC2','7e place',['DC1','DC2']);add('P5','Vainqueur DC1','Vainqueur DC2','5e place',['DC1','DC2']);
  if(d.count===11)pool(losers.slice(0,3),'E',first);
  else{
   add('LC1',losers[0],losers[1],'Demi-finale · places 9–12',first.slice(0,2));add('LC2',losers[2],losers[3],'Demi-finale · places 9–12',first.slice(2));
   add('P11','Perdant LC1','Perdant LC2','11e place',['LC1','LC2']);add('P9','Vainqueur LC1','Vainqueur LC2','9e place',['LC1','LC2']);
  }
 }
 return jobs;
}
// Deterministic forecast: one court per draw until the other has finished.
// Each slot closes before the next begins; dependent matches cannot overlap.
export function scheduleDraws(divisions){
 const types=['DM','DD'],plans=Object.fromEntries(types.map(v=>[v,fixturesFor(divisions.find(d=>d.division===v)||{count:0})]));
 const done={DM:new Set(),DD:new Set()},result=[];
 for(let slot=0;slot<80;slot++){
  const remaining=Object.fromEntries(types.map(v=>[v,plans[v].filter(m=>!done[v].has(m.id))]));
  if(!remaining.DM.length&&!remaining.DD.length)return result;
  const batch=[];
  for(const v of types){
   const other=v==='DM'?'DD':'DM';if(!remaining[v].length)continue;
   const ready=remaining[v].filter(m=>m.deps.every(id=>done[v].has(id)));
   let selected=ready.slice(0,1);
   // A single mixed draw uses both physical courts. Do not place a team (or
   // the same unresolved qualification reference) on both courts at once.
   if(!plans[other].length&&selected.length){const first=selected[0];const second=ready.find(m=>m!==first&&![m.a,m.b].some(v=>[first.a,first.b].includes(v)));if(second)selected.push(second);}

   selected.forEach((m,i)=>batch.push({...m,division:v,slot,court:i===0?v:other}));
  }
  if(!batch.length)throw Error('Programme incohérent');
  for(const m of batch){done[m.division].add(m.id);result.push(m);}
 }
 throw Error('Programme trop long');
}
export function slotFor(index){
 if(!Number.isInteger(index)||index<0)throw new RangeError('Créneau invalide');
 const start=18*60+index*(MATCH_MINUTES+TRANSITION_MINUTES),end=start+MATCH_MINUTES;
 const label=minutes=>`${String(Math.floor(minutes/60)%24).padStart(2,'0')} h ${String(minutes%60).padStart(2,'0')}`;
 return {start:label(start),end:label(end),day:Math.floor(start/1440),endDay:Math.floor(end/1440),date:Math.floor(start/1440)>0?'sam. 28 nov.':'ven. 27 nov.'};
}
