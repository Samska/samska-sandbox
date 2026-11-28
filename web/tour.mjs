import { chromium } from "playwright";
const b = await chromium.launch();
const out = "/tmp/shots/";
const base = "http://127.0.0.1:5173";
async function run(name, vp, dark) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: dark ? "dark" : "light", deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on("console", m => { if (m.type()==="error") errs.push(m.text()); }); p.on("pageerror", e => errs.push(String(e)));
  const shot = async (n) => { await p.waitForTimeout(500); await p.screenshot({ path: `${out}${name}-${n}.png`, fullPage: true }); };
  await p.goto(base + "/"); await shot("01-market-visitor");
  await p.goto(base + "/account"); await shot("02-account");
  await p.goto(base + "/checkout"); await shot("03-checkout-visitor");
  await p.goto(base + "/orders"); await shot("04-orders-visitor");
  await p.goto(base + "/nope"); await shot("05-notfound");
  // sign in as admin
  await p.goto(base + "/account");
  const email = p.getByLabel(/email/i).first();
  await email.fill("admin@example.test");
  await p.getByLabel(/password/i).first().fill("review-admin-pass-1");
  await p.getByRole("button", { name: /sign in/i }).first().click();
  await p.waitForTimeout(1500); await shot("06-after-signin");
  await p.goto(base + "/"); await shot("07-market-signed");
  await p.goto(base + "/admin/products"); await shot("08-admin-products");
  await p.goto(base + "/admin/products/new"); await shot("09-admin-new");
  await p.goto(base + "/admin/operations"); await shot("10-operations");
  await p.goto(base + "/orders"); await shot("11-orders-empty");
  console.log(name, errs.slice(0,5));
  await ctx.close();
}
await run("m-light", { width: 390, height: 844 }, false);
await run("d-light", { width: 1280, height: 800 }, false);
await b.close();
