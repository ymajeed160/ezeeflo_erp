'use strict';
/* Functional verification for the variant backend flow (local dev DB). */
require('dotenv').config({ path: __dirname + '/.env' });
const { v4: uuidv4 } = require('uuid');
const db = require('./models');
const itemAttributeService = require('./services/ItemAttributeService');
const itemAttributeTemplateService = require('./services/ItemAttributeTemplateService');
const itemVariantService = require('./services/ItemVariantService');

const TENANT = '11111111-1111-1111-1111-111111111111';
const USER = '37a40e2e-1111-1111-1111-111111111111';
const run = `variant-test-${Date.now()}`;

async function main() {
  const results = [];
  const check = (name, ok, extra = '') => {
    results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  };

  // 1. Create attributes
  const specs = [
    { name: `Model ${run}`, dataType: 'dropdown', options: ['TUF A15', 'TUF F15'] },
    { name: `Processor ${run}`, dataType: 'dropdown', options: ['Core i7', 'Core i9'] },
    { name: `RAM ${run}`, dataType: 'dropdown', options: ['8 GB', '16 GB'] },
    { name: `Storage ${run}`, dataType: 'dropdown', options: ['512 GB SSD', '1 TB SSD'] },
    { name: `Colour ${run}`, dataType: 'dropdown', options: ['Red', 'Black'] },
    { name: `Warranty ${run}`, dataType: 'text', isVariantDefining: false, isRequired: false },
  ];
  const attrs = [];
  for (const s of specs) {
    const a = await itemAttributeService.create(s, TENANT, USER);
    attrs.push(a);
  }
  check('create attributes', attrs.length === specs.length, `created ${attrs.length}`);

  // 2. Create template with variant-defining attrs + 1 informational
  const defining = attrs.slice(0, 5);
  const informational = attrs[5];
  const tpl = await itemAttributeTemplateService.create({
    name: `Laptop template ${run}`,
    attributes: [
      ...defining.map((a, i) => ({ attributeId: a.id, isVariantDefining: true, isRequired: true })),
      { attributeId: informational.id, isVariantDefining: false, isRequired: false },
    ],
  }, TENANT, USER);
  check('create template', !!tpl.id, `with ${tpl.templateAttributes.length} attributes`);

  // 3. Create variant-enabled parent item
  const itemCode = `ASUS-TUF-${Date.now().toString().slice(-6)}`;
  const item = await db.Item.create({
    tenantId: TENANT, itemCode, name: 'ASUS TUF', itemType: 'product',
    unitOfMeasure: 'EA', isInventoryTracked: true, isVariantEnabled: true,
    attributeTemplateId: tpl.id, costPrice: 900, sellingPrice: 1200,
  });
  check('create variant-enabled item', !!item.id, item.itemCode);

  // 4. Resolve config A
  const configA = {
    [defining[0].id]: { optionId: defining[0].options[0].id },
    [defining[1].id]: { optionId: defining[1].options[0].id },
    [defining[2].id]: { optionId: defining[2].options[0].id },
    [defining[3].id]: { optionId: defining[3].options[0].id },
    [defining[4].id]: { optionId: defining[4].options[0].id },
    [informational.id]: { value: '2 years' },
  };
  const variantA = await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: configA, tenantId: TENANT, userId: USER });
  check('resolve new variant', !!variantA.id && !!variantA.sku, `${variantA.sku} — ${variantA.description}`);
  check('sku format', variantA.sku.startsWith(`${item.itemCode}-`), variantA.sku);

  // 5. Same config -> reuse
  const variantA2 = await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: configA, tenantId: TENANT, userId: USER });
  check('reuse identical config', variantA2.id === variantA.id, 'same variant id');

  // 6. Different config -> new variant
  const configB = { ...configA, [defining[4].id]: { optionId: defining[4].options[1].id } };
  const variantB = await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: configB, tenantId: TENANT, userId: USER });
  check('new variant for different config', variantB.id !== variantA.id, `${variantB.sku} — ${variantB.description}`);

  // 7. Informational attribute alone does not affect uniqueness
  const configA3 = { ...configA, [informational.id]: { value: '3 years' } };
  const variantA3 = await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: configA3, tenantId: TENANT, userId: USER });
  check('informational attr does not duplicate', variantA3.id === variantA.id, 'reused');

  // 8. Required attribute missing -> error
  let requiredError = false;
  try {
    const missing = { ...configA };
    delete missing[defining[0].id];
    await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: missing, tenantId: TENANT, userId: USER });
  } catch (e) { requiredError = true; }
  check('required attribute enforced', requiredError);

  // 9. Invalid dropdown option -> error
  let invalidOptionError = false;
  try {
    await itemVariantService.findOrCreate({ itemId: item.id, attributeValues: { ...configA, [defining[0].id]: { optionId: uuidv4() } }, tenantId: TENANT, userId: USER });
  } catch (e) { invalidOptionError = true; }
  check('invalid option rejected', invalidOptionError);

  // 10. Non-variant item rejects findOrCreate
  const plainItem = await db.Item.create({ tenantId: TENANT, itemCode: `PLAIN-${Date.now()}`, name: 'Plain item', itemType: 'product', isInventoryTracked: false });
  let nonVariantError = false;
  try {
    await itemVariantService.findOrCreate({ itemId: plainItem.id, attributeValues: configA, tenantId: TENANT, userId: USER });
  } catch (e) { nonVariantError = true; }
  check('non-variant item rejected', nonVariantError);

  // 11. Search variants
  const search = await itemVariantService.search(TENANT, { itemId: item.id, q: variantA.sku });
  check('variant search by sku', search.count >= 1);

  console.log('\n===== RESULTS =====');
  results.forEach(r => console.log(r));
  const failures = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - failures.length}/${results.length} passed`);

  // cleanup
  await db.ItemVariantAttributeValue.destroy({ where: { variantId: [variantA.id, variantB.id] }, force: true });
  await db.ItemVariant.destroy({ where: { id: [variantA.id, variantB.id] }, force: true });
  await db.Item.destroy({ where: { id: [item.id, plainItem.id] }, force: true });
  await db.ItemAttributeTemplateAttribute.destroy({ where: { templateId: tpl.id } });
  await db.ItemAttributeTemplate.destroy({ where: { id: tpl.id }, force: true });
  for (const a of attrs) { await db.ItemAttributeOption.destroy({ where: { attributeId: a.id } }); }
  for (const a of attrs) { await db.ItemAttribute.destroy({ where: { id: a.id }, force: true }); }
  console.log('Cleanup complete.');
  process.exit(failures.length ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
