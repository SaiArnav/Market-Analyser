import {NextResponse}from'next/server';import{db, generateReport}from'@/lib/store';export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:{id:string}}){
  const company=db.companies.find(c=>c.id===params.id);
  if(!company)return NextResponse.json({detail:'not found'},{status:404});
  const score=db.scores.find(s=>s.companyId===params.id);
  if(!score)return NextResponse.json({detail:'Run an analysis first'},{status:404});
  const report = generateReport(params.id);
  return NextResponse.json(report);
}
