import { expect, test } from '@playwright/test';
test('plays a complete session, gives hints, saves progress, and unlocks a reward', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name: 'おみせを ひらく！'}).click();
  await page.getByRole('button', {name: 'できた！', exact: true}).click();
  await expect(page.locator('.hint')).toContainText('のせてみよう');
  for (let n=0;n<5;n++) {
    const rows = await page.locator('.order-item').all();
    for (const row of rows) {
      const name = await row.locator('div').first().evaluate(el => el.childNodes[0].textContent);
      const quantity = parseInt((await row.locator('.order-quantity').innerText()),10);
      for(let j=0;j<quantity;j++) await page.getByRole('button',{name:`${name}を ふやす`,exact:true}).click();
    }
    await page.getByRole('button',{name:'できた！',exact:true}).click();
    await expect(page.getByRole('dialog')).toContainText('できあがり！');
    await page.getByRole('button',{name:n===4?'きょうの おしごとを みる':'つぎの おきゃくさん'}).click();
  }
  await expect(page.locator('.result')).toContainText('15');
  await expect(page.locator('.perfect-note')).toContainText('4こ');
  await page.getByRole('button',{name:'ごほうびのおみせ'}).click();
  await page.getByRole('button',{name:'⭐ 10こで もらう'}).click();
  await expect(page.locator('.shop-balance')).toContainText('5こ');
  await page.reload();
  await expect(page.locator('.star-bank')).toContainText('5');
  await expect(page.locator('.saved-record')).toContainText('レベル 2');
  await page.getByRole('button',{name:'おみせを ひらく！'}).click();
  await expect(page.getByRole('button',{name:'ブルーベリーを のせる'})).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile fits viewport, supports correction, sound, help and leaving', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.screenshot({path:'test-results/screenshots/home-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button',{name:'おとを だす'}).click();
  await expect(page.getByRole('button',{name:'おとを けす'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'あそびかた',exact:true}).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button',{name:'おみせを ひらく！'}).click();
  await page.getByRole('button',{name:'いちごを のせる'}).click();
  await expect(page.getByLabel('いちごの かず')).toHaveText('1');
  await page.getByRole('button',{name:'いちごを へらす'}).click();
  await expect(page.getByLabel('いちごの かず')).toHaveText('0');
  await expect(page.getByRole('button',{name:'いちごを へらす'})).toBeDisabled();
  await page.screenshot({path:'test-results/screenshots/game-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button',{name:'おみせ',exact:true}).click();
  await page.getByRole('button',{name:'おみせに もどる',exact:true}).click();
  await expect(page.getByRole('button',{name:'おみせを ひらく！'})).toBeVisible();
});
test('desktop layout and storage unavailable remain playable',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}}));
  await page.goto('/');
  await expect(page.locator('.save-warning')).toBeVisible();
  await page.screenshot({path:'test-results/screenshots/home-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'おみせを ひらく！'}).click();
  await page.screenshot({path:'test-results/screenshots/game-desktop.png',fullPage:true});
  await expect(page.getByRole('button',{name:'できた！',exact:true})).toBeEnabled();
});
