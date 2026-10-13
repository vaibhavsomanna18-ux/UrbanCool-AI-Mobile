const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=(x,d=2)=>Number.isFinite(Number(x))?Number(Number(x).toFixed(d)):null;

export const INTERVENTIONS=[
  {name:'Tree canopy expansion',short:'green_roof',costPer10:0.42,base:0.72,areaFactor:0.72},
  {name:'Cool / reflective roofs',short:'cool_roof',costPer10:0.32,base:0.58,areaFactor:0.86},
  {name:'Pavement albedo modification',short:'permeable_pavement',costPer10:0.25,base:0.46,areaFactor:0.70},
  {name:'Water body introduction',short:'water_body',costPer10:0.70,base:0.64,areaFactor:0.22}
];

export function percentileRank(values,value){
  const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length||!Number.isFinite(value))return null;
  if(a.length===1)return 1;
  let below=0;for(const v of a)if(v<value)below++;
  return below/(a.length-1);
}

function priorityReasons({thermal,built,veg,lstAnomaly,ndvi,ndbi}){
  const thermalPct=round(thermal*100,1),builtPct=round(built*100,1),vegPct=round(veg*100,1);
  const r=[
    'Thermal intensity: LST ranks at the '+thermalPct+'th percentile of this city’s valid zones.',
    'Built-up intensity: NDBI ranks at the '+builtPct+'th percentile of this city’s valid zones.',
    'Vegetation deficit: NDVI deficit ranks at the '+vegPct+'th percentile of this city’s valid zones.'
  ];
  if(lstAnomaly>=1)r.push('Heat anomaly: LST is +'+round(lstAnomaly,2)+'°C above the city mean.');
  else if(lstAnomaly<=-1)r.push('Thermal contrast: LST is '+round(Math.abs(lstAnomaly),2)+'°C below the city mean.');
  if(ndbi>.35)r.push('Impervious-surface signal: NDBI is above 0.35 in the observed zone.');
  if(ndvi<0)r.push('Vegetation signal: NDVI is below 0 in the observed zone pixel mix.');
  return r.slice(0,5);
}

export function cityAnalytics(points){
  const valid=points.filter(p=>Number.isFinite(p.lst)&&Number.isFinite(p.ndvi)&&Number.isFinite(p.ndbi));
  const lsts=valid.map(p=>p.lst),ndbis=valid.map(p=>p.ndbi),vegDef=valid.map(p=>1-p.ndvi);
  const meanLST=lsts.length?lsts.reduce((a,b)=>a+b,0)/lsts.length:null;
  const enriched=points.map(p=>{
    if(!Number.isFinite(p.lst)||!Number.isFinite(p.ndvi)||!Number.isFinite(p.ndbi))
      return {...p,hotspotScore:null,hotspotPercent:null,priority:null,driverContributions:null,priorityReasons:[]};
    const thermal=percentileRank(lsts,p.lst);
    const built=percentileRank(ndbis,p.ndbi);
    const veg=percentileRank(vegDef,1-p.ndvi);
    const terms={thermal:thermal*.45,builtup:built*.30,vegetation:veg*.25};
    const total=terms.thermal+terms.builtup+terms.vegetation;
    const contribution={thermal:total?terms.thermal/total*100:0,builtup:total?terms.builtup/total*100:0,vegetation:total?terms.vegetation/total*100:0};
    const score=clamp(total*100,0,100);
    const anomaly=p.lst-meanLST;
    const reasons=priorityReasons({thermal,built,veg,lstAnomaly:anomaly,ndvi:p.ndvi,ndbi:p.ndbi,hotspotScore:score});
    return {
      ...p,
      hotspotScore:round(score,1),
      hotspotPercent:round(score,1),
      priorityScore:round(score/100,3),
      priority:score>=75?'1 — Immediate':score>=50?'2 — High':score>=25?'3 — Moderate':'4 — Low',
      driverContributions:{thermal:round(contribution.thermal,1),builtup:round(contribution.builtup,1),vegetation:round(contribution.vegetation,1)},
      driverPercentiles:{thermal:round(thermal*100,1),builtup:round(built*100,1),vegetation:round(veg*100,1)},
      cityMeanLST:round(meanLST,2),
      lstAnomaly:round(anomaly,2),
      priorityReasons:reasons,
      reason:reasons.slice(0,3).join(' ')
    };
  });
  return {points:enriched,meanLST:round(meanLST,2)};
}

export function simulateScenario(input){
  const p=input.point||{};
  const lst=Number(p.lst),ndvi=Number(p.ndvi),ndbi=Number(p.ndbi),cityMean=Number(input.cityMeanLST);
  if(!Number.isFinite(lst)||!Number.isFinite(ndvi)||!Number.isFinite(ndbi)||!Number.isFinite(cityMean))
    throw new Error('Selected zone must contain valid Landsat LST, NDVI and NDBI values.');
  const intervention=INTERVENTIONS.find(x=>x.name===input.intervention)||INTERVENTIONS[0];
  const intensity=clamp(Number(input.intensity)||25,5,60);
  const budget=clamp(Number(input.budget)||25,5,100);
  const heatAnomaly=Math.max(0,lst-cityMean);
  const thermalNeed=clamp(heatAnomaly/8,0.15,1.5);
  const vegetationOpportunity=clamp(1-ndvi,0.15,1);
  const builtupOpportunity=clamp(ndbi,0.15,1);
  const dryness=clamp((1-ndvi)*.65+ndbi*.35,0.15,1);
  const localModifier=intervention.name==='Tree canopy expansion'?.62+.62*vegetationOpportunity:
    intervention.name==='Cool / reflective roofs'?.72+.42*builtupOpportunity:
    intervention.name==='Pavement albedo modification'?.65+.50*builtupOpportunity:
    .52+.55*dryness;
  const saturation=1-Math.exp(-intensity/38);
  const cooling=heatAnomaly<=0?0:heatAnomaly*intervention.base*saturation*localModifier*thermalNeed;
  const coverage=clamp(intensity*intervention.areaFactor,1,60);
  const cost=round(intensity*intervention.costPer10/10,2);
  const feasible=cost<=budget && !(intervention.name==='Water body introduction'&&coverage>18);
  const maxFeasibleIntensity=Math.min(60,Math.floor((budget/(intervention.costPer10/10))/5)*5);
  return {
    zone:Number(input.zone),
    intervention:intervention.name,
    short:intervention.short,
    intensity,budget,
    before:round(lst,2),
    cooling:round(cooling,2),
    after:round(Math.max(0,lst-cooling),2),
    coverage:round(coverage,1),
    cost,
    feasible,
    feasibility:feasible?'FEASIBLE':'CONSTRAINT EXCEEDED',
    heatAnomaly:round(heatAnomaly,2),
    maxFeasibleIntensity,
    model:'Local-response intervention model using observed Landsat LST/NDVI/NDBI; cooling is estimated, not measured.',
    drivers:{thermalNeed:round(thermalNeed,3),vegetationOpportunity:round(vegetationOpportunity,3),builtupOpportunity:round(builtupOpportunity,3)}
  };
}

export function optimizeZone(input){
  const budget=clamp(Number(input.budget)||25,5,100);
  const candidates=[];
  for(const intervention of INTERVENTIONS){
    for(let intensity=5;intensity<=60;intensity+=5){
      const s=simulateScenario({...input,intervention:intervention.name,intensity,budget});
      if(!s.feasible)continue;
      const priorityFactor=1+clamp(Number(input.hotspotScore)||0,0,100)/200;
      const value=s.cooling*priorityFactor-s.cost*.01;
      candidates.push({...s,valueScore:round(value,3)});
    }
  }
  candidates.sort((a,b)=>b.valueScore-a.valueScore||b.cooling-a.cooling);
  const best=candidates[0];
  if(!best)throw new Error('No feasible intervention exists for the selected budget and zone.');
  const byIntervention=Object.fromEntries(INTERVENTIONS.map(i=>[
    i.name,
    candidates.filter(c=>c.intervention===i.name).slice(0,3)
  ]));
  const balanced=INTERVENTIONS.flatMap(i=>byIntervention[i.name]).sort((a,b)=>b.valueScore-a.valueScore||b.cooling-a.cooling);
  return {
    zone:Number(input.zone),
    budget,
    best,
    ranked:balanced,
    scoreRanked:candidates.slice(0,20),
    byIntervention,
    alternatives:candidates.filter(c=>c!==best).slice(0,8),
    constraint:'Budget and intervention-specific coverage/feasibility constraints applied.',
    cityMeanLST:round(Number(input.cityMeanLST),2)
  };
}