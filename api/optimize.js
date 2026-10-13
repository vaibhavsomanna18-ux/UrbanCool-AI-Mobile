export const access="public";
import {optimizeZone} from "lib/heatMath.js";
export default async function(req,res){
  try{
    const b=req.body||{};
    if(!b.point)return res.status(400).json({error:"Missing selected satellite zone data."});
    const x=optimizeZone({zone:b.zone,point:b.point,cityMeanLST:b.cityMeanLST,hotspotScore:b.hotspotScore,budget:b.budget});
    res.json(x);
  }catch(e){res.status(400).json({error:e?.message||"Optimization failed"});}
}