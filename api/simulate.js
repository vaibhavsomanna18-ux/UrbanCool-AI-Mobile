export const access="public";
import {simulateScenario} from "lib/heatMath.js";
export default async function(req,res){
  try{
    const b=req.body||{};
    if(!b.point)return res.status(400).json({error:"Missing selected satellite zone data."});
    const x=simulateScenario({zone:b.zone,point:b.point,cityMeanLST:b.cityMeanLST,intervention:b.intervention,intensity:b.intensity,budget:b.budget});
    res.json(x);
  }catch(e){res.status(400).json({error:e?.message||"Simulation failed"});}
}