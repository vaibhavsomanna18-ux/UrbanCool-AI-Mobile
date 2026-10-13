export const access="public";
import {cityAnalytics} from "lib/heatMath.js";

const CITIES={
  "Maharashtra|Mumbai":{state:"Maharashtra",city:"Mumbai",center:[19.076,72.878],bbox:[72.72,18.88,73.10,19.30]},
  "Maharashtra|Pune":{state:"Maharashtra",city:"Pune",center:[18.5204,73.8567],bbox:[73.70,18.40,74.00,18.70]},
  "Maharashtra|Nagpur":{state:"Maharashtra",city:"Nagpur",center:[21.1458,79.0882],bbox:[78.98,21.05,79.20,21.25]},
  "Telangana|Hyderabad":{state:"Telangana",city:"Hyderabad",center:[17.385,78.4867],bbox:[78.25,17.20,78.70,17.55]},
  "Telangana|Warangal":{state:"Telangana",city:"Warangal",center:[17.9689,79.5941],bbox:[79.48,17.88,79.70,18.08]},
  "Telangana|Nizamabad":{state:"Telangana",city:"Nizamabad",center:[18.6725,78.0941],bbox:[77.98,18.58,78.22,18.78]},
  "Delhi|New Delhi":{state:"Delhi",city:"New Delhi",center:[28.6139,77.209],bbox:[77.10,28.50,77.32,28.75]},
  "Delhi|Old Delhi":{state:"Delhi",city:"Old Delhi",center:[28.6562,77.241],bbox:[77.17,28.57,77.31,28.72]},
  "Delhi|Dwarka":{state:"Delhi",city:"Dwarka",center:[28.5921,77.046],bbox:[76.92,28.50,77.15,28.68]},
  "Karnataka|Bengaluru":{state:"Karnataka",city:"Bengaluru",center:[12.9716,77.5946],bbox:[77.42,12.82,77.78,13.12]},
  "Karnataka|Mysuru":{state:"Karnataka",city:"Mysuru",center:[12.2958,76.6394],bbox:[76.52,12.20,76.76,12.40]},
  "Karnataka|Hubballi-Dharwad":{state:"Karnataka",city:"Hubballi-Dharwad",center:[15.3647,75.124],bbox:[75.02,15.25,75.25,15.48]},
  "Gujarat|Ahmedabad":{state:"Gujarat",city:"Ahmedabad",center:[23.0225,72.5714],bbox:[72.42,22.88,72.72,23.18]},
  "Gujarat|Surat":{state:"Gujarat",city:"Surat",center:[21.1702,72.8311],bbox:[72.68,21.02,73.00,21.32]},
  "Gujarat|Vadodara":{state:"Gujarat",city:"Vadodara",center:[22.3072,73.1812],bbox:[73.05,22.20,73.32,22.42]}
};

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const key=(s,c)=>`${s}|${c}`;

function gridFor(city){
  const [minLon,minLat,maxLon,maxLat]=city.bbox;
  const pts=[]; let id=1;
  for(let r=0;r<10;r++){
    for(let c=0;c<10;c++){
      const lon=minLon+(c+.5)*(maxLon-minLon)/10;
      const lat=minLat+(r+.5)*(maxLat-minLat)/10;
      const x=(c+.5)/10, y=(r+.5)/10;
      pts.push({id:id++,row:r,col:c,lat,lon});
    }
  }
  return pts;
}

async function searchLatest(city){
  const [minLon,minLat,maxLon,maxLat]=city.bbox;
  const end=new Date();
  const start=new Date(end.getTime()-1000*60*60*24*180);
  const url='https://planetarycomputer.microsoft.com/api/stac/v1/search?'+new URLSearchParams({
    collections:'landsat-c2-l2',
    bbox:[minLon,minLat,maxLon,maxLat].join(','),
    datetime:start.toISOString()+'/'+end.toISOString(),
    limit:'40',
    sortby:'-datetime'
  });
  const r=await fetch(url,{headers:{accept:'application/geo+json'}});
  if(!r.ok) throw new Error('Satellite catalog search failed: '+r.status);
  const j=await r.json();
  const items=(j.features||[]).filter(x=>x.properties?.['landsat:processing_level']==='L2SP' || x.id?.includes('_L2SP_'));
  if(!items.length) throw new Error('No usable Landsat Level-2 surface-temperature scene found for '+city.city);
  items.sort((a,b)=>new Date(b.properties.datetime||b.properties['datetime'])-new Date(a.properties.datetime||a.properties['datetime']));
  return items[0];
}

let datasetToken=null;
async function signHref(href){
  if(!datasetToken){
    const tr=await fetch('https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2');
    if(!tr.ok) throw new Error('Satellite access token failed: '+tr.status);
    const tj=await tr.json();
    datasetToken=tj.href||tj.token||tj;
  }
  const token=String(datasetToken);
  if(token.startsWith('http')) return token;
  return href+(href.includes('?')?'&':'?')+token;
}
async function cogStats(itemId,assetName,features){
  const q=new URLSearchParams({collection:'landsat-c2-l2',item:itemId,assets:assetName,unscale:'true',max_size:'2048'});
  const r=await fetch('https://planetarycomputer.microsoft.com/api/data/v1/item/statistics?'+q,{method:'POST',headers:{'content-type':'application/json',accept:'application/geo+json'},body:JSON.stringify({type:'FeatureCollection',features})});
  if(!r.ok) throw new Error('Satellite raster statistics failed: '+r.status);
  return r.json();
}
async function statsFor(item,features){
  const zoneStats=[];
  for(let start=0;start<features.length;start+=20){
    const batch=features.slice(start,start+20);
    const results=await Promise.all(batch.map(async feature=>{
      const q=new URLSearchParams({collection:'landsat-c2-l2',item:item.id,unscale:'true',max_size:'2048'});
      for(const asset of ['lwir11','nir08','red','swir16'])q.append('assets',asset);
      for(let attempt=0;attempt<2;attempt++){
        const r=await fetch('https://planetarycomputer.microsoft.com/api/data/v1/item/statistics?'+q,{method:'POST',headers:{'content-type':'application/json',accept:'application/geo+json'},body:JSON.stringify(feature)});
        if(r.ok) return r.json();
        if(r.status<500&&r.status!==429) throw new Error('Satellite raster statistics failed: '+r.status);
      }
      throw new Error('Satellite raster statistics failed after retry');
    }));
    zoneStats.push(...results);
  }
  return zoneStats;
}

function makeDerived(points,zoneStats,scene){
  return points.map((p,i)=>{
    const stats=zoneStats[i]?.properties?.statistics||{};
    const ls=stats.lwir11_b1||{}, ns=stats.nir08_b1||{}, rs=stats.red_b1||{}, ss=stats.swir16_b1||{};
    const lstRaw=Number(ls.mean);
    const kelvin=Number.isFinite(lstRaw)?lstRaw*0.00341802+149:null;
    const lst=Number.isFinite(kelvin)?kelvin-273.15:null;
    const nirRaw=Number(ns.mean), redRaw=Number(rs.mean), swirRaw=Number(ss.mean);
    const nir=Number.isFinite(nirRaw)?nirRaw*0.0000275-0.2:null;
    const red=Number.isFinite(redRaw)?redRaw*0.0000275-0.2:null;
    const swir=Number.isFinite(swirRaw)?swirRaw*0.0000275-0.2:null;
    const ndvi=Number.isFinite(nir)&&Number.isFinite(red)&&Math.abs(nir+red)>1e-9?(nir-red)/(nir+red):null;
    const ndbi=Number.isFinite(swir)&&Number.isFinite(nir)&&Math.abs(swir+nir)>1e-9?(swir-nir)/(swir+nir):null;
    const valid=Number(ls.valid_percent);
    const usable=Number.isFinite(lst)&&valid>0;
    const safeLst=usable?lst:null;
    const risk=safeLst==null?'NoData':safeLst>=39?'Critical':safeLst>=36?'High':safeLst>=34?'Moderate':'Low';
    const priority=usable?clamp(((safeLst-32)/8)*.55+(1-clamp(ndvi??.5,0,1))*.25+clamp((ndbi??.2),0,1)*.20,0,1):0;
    return {...p,lst:safeLst,ndvi:Number.isFinite(ndvi)?ndvi:null,ndbi:Number.isFinite(ndbi)?ndbi:null,validPercent:Number.isFinite(valid)?valid:null,validPixels:Number(ls.valid_pixels)||0,risk,priorityScore:priority,priority:priority>.75?'1 — Immediate':priority>.5?'2 — High':priority>.25?'3 — Moderate':'4 — Low',sourceScene:scene.id,statMethod:'zone-area mean from Landsat raster'};
  });
}

export default async function(req,res){
  try{
    const state=req.query?.state||'Maharashtra';
    const cityName=req.query?.city||'Mumbai';
    const city=CITIES[key(state,cityName)];
    if(!city) return res.status(400).json({error:'Unknown state/city selection'});
    const scene=await searchLatest(city);
    const raw=gridFor(city);
    const features=raw.map(p=>({type:'Feature',id:String(p.id),properties:{zone:p.id},geometry:{type:'Polygon',coordinates:[[
      [city.bbox[0]+p.col*(city.bbox[2]-city.bbox[0])/10,city.bbox[1]+p.row*(city.bbox[3]-city.bbox[1])/10],
      [city.bbox[0]+(p.col+1)*(city.bbox[2]-city.bbox[0])/10,city.bbox[1]+p.row*(city.bbox[3]-city.bbox[1])/10],
      [city.bbox[0]+(p.col+1)*(city.bbox[2]-city.bbox[0])/10,city.bbox[1]+(p.row+1)*(city.bbox[3]-city.bbox[1])/10],
      [city.bbox[0]+p.col*(city.bbox[2]-city.bbox[0])/10,city.bbox[1]+(p.row+1)*(city.bbox[3]-city.bbox[1])/10],
      [city.bbox[0]+p.col*(city.bbox[2]-city.bbox[0])/10,city.bbox[1]+p.row*(city.bbox[3]-city.bbox[1])/10]
    ]]}}));
    const stats=await statsFor(scene,features);
    const derived=makeDerived(raw,stats,scene);
    const analytics=cityAnalytics(derived);
    const points=analytics.points;
    const thermalTile='https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?'+new URLSearchParams({collection:'landsat-c2-l2',item:scene.id,assets:'lwir11',unscale:'true',colormap_name:'thermal',rescale:'285,325'});
    const valid=points.filter(p=>Number.isFinite(p.lst));
    const mean=(arr,k)=>arr.length?arr.reduce((a,p)=>a+(Number(p[k])||0),0)/arr.length:null;
    const hot=valid.filter(p=>p.lst>=36).length, critical=valid.filter(p=>p.lst>=39).length;
    res.json({
      status:'LIVE SATELLITE',
      source:{provider:'USGS / NASA Landsat Collection 2 Level-2',collection:'landsat-c2-l2',sceneId:scene.id,acquired:scene.properties?.datetime||null,cloudCover:scene.properties?.['eo:cloud_cover']??null,processingLevel:scene.properties?.['landsat:processing_level']||'L2SP',spatialResolution:'30 m surface-temperature product',thermalTileUrl:thermalTile},
      city:{state:city.state,city:city.city,center:city.center,bbox:city.bbox,zoneCount:100},
      points,
      stats:{avgLST:mean(valid,'lst'),minLST:valid.length?Math.min(...valid.map(p=>p.lst)):null,maxLST:valid.length?Math.max(...valid.map(p=>p.lst)):null,hotspots:hot,highPct:valid.length?hot/valid.length*100:0,criticalPct:valid.length?critical/valid.length*100:0,avgNDVI:mean(valid,'ndvi'),avgNDBI:mean(valid,'ndbi'),validZones:valid.length},
      methodology:'Each city is divided into a fixed 10×10 spatial grid. Zone LST statistics are computed from the latest available cloud-screened Landsat Collection 2 Level-2 surface-temperature asset intersecting the city extent. NDVI and NDBI are derived from the same scene’s surface-reflectance bands. Values marked NoData are not replaced by synthetic values.'
    });
  }catch(e){res.status(502).json({error:e?.message||'Satellite service unavailable',status:'SATELLITE ERROR'});}
}