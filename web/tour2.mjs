import { chromium } from "playwright";
const b = await chromium.launch(); const out="/tmp/shots/"; const base="http://127.0.0.1:5173";
async function login(p){ await p.goto(base+"/account"); await p.getByLabel(/email/i).first().fill("admin@example.test"); await p.getByLabel(/password/i).first().fill("review-admin-pass-1"); await p.getByRole("button",{name:/sign in/i}).first().click(); await p.waitForTimeout(1200); }
for (const [name,vp,dark] of [["m",{width:390,height:844},false],["md",{width:768,height:900},false],["m-dark",{width:390,height:844},true]]) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: dark?"dark":"light" }); const p = await ctx.newPage();
  const shot = async n => { await p.waitForTimeout(500); await p.screenshot({ path:`${out}${name}-${n}.png`, fullPage:false }); };
  await login(p);
  await p.goto(base+"/"); await shot("20-market-top");
  if (await p.getByRole("button",{name:/menu/i}).count()) { await p.getByRole("button",{name:/menu/i}).click(); await shot("21-menu"); }
  await p.keyboard.press("Escape");
  await p.getByRole("button",{name:/^Add .* to Cart/}).first().click(); await p.waitForTimeout(600);
  await p.getByRole("button",{name:/^Cart\b/}).click(); await shot("22-cart-drawer");
  await p.getByRole("button",{name:"Checkout"}).click(); await p.waitForTimeout(800); await shot("23-checkout");
  await p.goto(base+"/"); await p.getByRole("button",{name:/^View|Details/}).first().click().catch(()=>{}); await shot("24-detail");
  await ctx.close();
}
await b.close();
