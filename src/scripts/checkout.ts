/**
 * The Order page: the cart, pickup or delivery, the day and time, an estimate,
 * and then the "Busy Biese · Checkout" Fillout form for name, phone and email.
 *
 * Everything the customer picked here travels to Fillout as URL parameters
 * (cart, items, plan, est, date, time, fulfillment, address, ref, src), so the
 * submission that reaches the order automation is complete on its own.
 */
import { BEE_SVG, cartApi, getShop, onShopChange, openSheet, siteUrl, storage } from './shop';
import {
  FLEXIBLE,
  MAX_QTY,
  addDays,
  cartParam,
  cartSummary,
  cartTotals,
  findItem,
  isoDay,
  leadDays,
  lineDetails,
  longDay,
  money,
  money2,
  priceLine,
} from '../lib/shop-core';

const PLAN_KEY = 'bb-plan-v1';
const FORM_ORIGIN = 'https://embed.fillout.com';

interface Plan {
  fulfillment: '' | 'Pickup' | 'Delivery';
  street: string;
  city: string;
  zip: string;
  date: string;
  time: string;
}

const esc = (t: unknown): string =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const root = document.querySelector<HTMLElement>('[data-checkout]');
if (root) init(root);

function init(root: HTMLElement) {
  const formId = root.dataset.formId || '';
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const steps = $('[data-co-steps]')!;
  const linesEl = $('[data-co-lines]')!;
  const emptyEl = $('[data-co-empty]')!;
  const picker = $<HTMLDetailsElement>('[data-co-picker]');
  const pickerExtra = $('[data-co-picker-extra]');
  const addressBox = $('[data-co-address]')!;
  const dateInput = $<HTMLInputElement>('[data-co-date]')!;
  const dateHint = $('[data-co-date-hint]')!;
  const windowsBox = $('[data-co-windows-list]')!;
  const feeRule = $('[data-co-fee-rule]');
  const subtotalEl = $('[data-co-subtotal]')!;
  const deliveryRow = $('[data-co-delivery-row]')!;
  const deliveryEl = $('[data-co-delivery]')!;
  const totalEl = $('[data-co-total]')!;
  const problemEl = $('[data-co-problem]')!;
  const continueBtn = $<HTMLButtonElement>('[data-co-continue]')!;
  const details = $('[data-co-details]')!;
  const frameBox = $('[data-co-frame]')!;
  const altLink = $<HTMLAnchorElement>('[data-co-newtab]');
  const altBox = $('[data-co-alt]');
  const review = $('[data-co-review]')!;
  const reviewLines = $('[data-co-review-lines]')!;
  const reviewPlan = $('[data-co-review-plan]')!;
  const thanks = $('[data-co-thanks]')!;
  const thanksRecap = $('[data-co-thanks-recap]');
  const summaryBox = $('[data-co-summary]')!;

  // ---- the plan (pickup or delivery, address, day, time) survives a reload ----
  const plan: Plan = { fulfillment: '', street: '', city: '', zip: '', date: '', time: '' };
  try {
    Object.assign(plan, JSON.parse(storage.get(PLAN_KEY) || '{}'));
  } catch {
    /* start fresh */
  }
  const savePlan = () => storage.set(PLAN_KEY, JSON.stringify(plan));

  const today = () => isoDay(new Date());
  const earliest = () => addDays(today(), leadDays(getShop(), cartApi.get()));

  // ---- step 1: the lines ----
  function renderLines() {
    const shop = getShop();
    const cart = cartApi.get();
    emptyEl.hidden = cart.lines.length > 0;
    linesEl.hidden = cart.lines.length === 0;
    linesEl.innerHTML = cart.lines
      .map((l) => {
        const item = findItem(shop, l.slug);
        const p = priceLine(shop, l);
        const photo = item?.photo
          ? `<img class="co-line-photo" src="${esc(siteUrl(item.photo))}" alt="" width="64" height="64" loading="lazy">`
          : `<span class="co-line-photo photo-ph" aria-hidden="true">${BEE_SVG}</span>`;
        const label = `${l.name}, ${lineDetails(l)}`;
        return `<li class="co-line${p.ok ? '' : ' is-missing'}" data-id="${esc(l.id)}">
          ${photo}
          <div class="co-line-main">
            <p class="co-line-name">${esc(l.name)}</p>
            <p class="co-line-detail">${esc(lineDetails(l))}</p>
            ${p.ok ? '' : '<p class="co-line-warn">This size is not on the menu right now. Change it or remove it.</p>'}
            <div class="co-line-actions">
              ${item ? `<button type="button" class="co-link" data-co-change aria-label="${esc(`Change ${label}`)}">Change</button>` : ''}
              <button type="button" class="co-link" data-co-remove aria-label="${esc(`Remove ${label}`)}">Remove</button>
            </div>
          </div>
          <div class="co-line-side">
            <div class="stepper stepper-small" data-co-qty>
              <button type="button" class="stepper-btn" data-co-step="-1" aria-label="${esc(`One fewer: ${label}`)}"${l.qty <= 1 ? ' disabled' : ''}>&minus;</button>
              <input type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="${l.qty}" aria-label="${esc(`How many: ${label}`)}" data-co-qty-input>
              <button type="button" class="stepper-btn" data-co-step="1" aria-label="${esc(`One more: ${label}`)}"${l.qty >= MAX_QTY ? ' disabled' : ''}>+</button>
            </div>
            <p class="co-line-total">${p.ok ? money2(p.total) : ''}</p>
          </div>
        </li>`;
      })
      .join('');
    if (picker && !cart.lines.length) picker.open = true;
  }

  linesEl.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const li = t.closest<HTMLElement>('[data-id]');
    if (!li) return;
    const id = li.dataset.id || '';
    const line = cartApi.get().lines.find((l) => l.id === id);
    if (!line) return;
    if (t.closest('[data-co-remove]')) {
      const next = li.nextElementSibling?.querySelector<HTMLElement>('[data-co-remove]') ?? li.previousElementSibling?.querySelector<HTMLElement>('[data-co-remove]');
      cartApi.remove(id);
      (next ?? picker?.querySelector<HTMLElement>('summary'))?.focus();
      return;
    }
    if (t.closest('[data-co-change]')) {
      openSheet(line.slug, { line, from: t.closest<HTMLElement>('[data-co-change]') });
      return;
    }
    const step = t.closest<HTMLElement>('[data-co-step]');
    if (step) cartApi.setQty(id, line.qty + Number(step.dataset.coStep));
  });
  linesEl.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.matches('[data-co-qty-input]')) return;
    const id = t.closest<HTMLElement>('[data-id]')?.dataset.id;
    if (id) cartApi.setQty(id, Number(t.value) || 1);
  });

  // New items that are on the Price List but have no page yet still show up in the picker
  function renderPickerExtra() {
    if (!pickerExtra) return;
    const shop = getShop();
    const onPage = new Set(Array.from(root.querySelectorAll<HTMLElement>('.co-pick[data-add]')).map((b) => b.dataset.add));
    const extra = shop.items.filter((i) => !onPage.has(i.slug));
    pickerExtra.innerHTML = extra.length
      ? `<div class="co-cat"><h3>New on the menu</h3><ul role="list">${extra
          .map(
            (i) =>
              `<li><button type="button" class="co-pick" data-add="${esc(i.slug)}"><span class="co-pick-name">${esc(i.name)}</span><span class="co-pick-price">${esc(
                i.tiers.length > 1 ? `From ${money(Math.min(...i.tiers.map((t) => t.price)))}` : money(i.tiers[0].price),
              )}</span><span class="co-pick-add" aria-hidden="true">Add</span></button></li>`,
          )
          .join('')}</ul></div>`
      : '';
  }

  // ---- step 2: pickup or delivery ----
  const fulfillmentInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="fulfillment"]'));
  const addressInputs = {
    street: $<HTMLInputElement>('input[name="street"]')!,
    city: $<HTMLInputElement>('input[name="city"]')!,
    zip: $<HTMLInputElement>('input[name="zip"]')!,
  };
  for (const input of fulfillmentInputs) {
    input.checked = input.value === plan.fulfillment;
    input.addEventListener('change', () => {
      plan.fulfillment = input.value as Plan['fulfillment'];
      savePlan();
      renderPlan();
      renderTotals();
      refreshProblems();
    });
  }
  for (const [key, input] of Object.entries(addressInputs) as [keyof typeof addressInputs, HTMLInputElement][]) {
    input.value = plan[key];
    input.addEventListener('input', () => {
      plan[key] = input.value.trim();
      input.removeAttribute('aria-invalid');
      savePlan();
      refreshProblems();
    });
  }

  // ---- step 3: day and time ----
  dateInput.addEventListener('change', () => {
    plan.date = dateInput.value;
    dateInput.removeAttribute('aria-invalid');
    savePlan();
    renderPlan();
    refreshProblems();
  });
  windowsBox.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name !== 'time') return;
    plan.time = t.value;
    savePlan();
    refreshProblems();
  });

  function renderWindows() {
    const windows = [...getShop().settings.windows, FLEXIBLE];
    if (plan.time && !windows.includes(plan.time)) plan.time = '';
    windowsBox.innerHTML = windows
      .map(
        (w) =>
          `<label class="chip-opt"><input type="radio" name="time" value="${esc(w)}"${plan.time === w ? ' checked' : ''}><span>${esc(
            w === FLEXIBLE ? 'Flexible, any time' : w,
          )}</span></label>`,
      )
      .join('');
  }

  function renderPlan() {
    addressBox.hidden = plan.fulfillment !== 'Delivery';
    const min = earliest();
    dateInput.min = min;
    dateInput.max = addDays(today(), 180);
    if (plan.date && plan.date < min) {
      plan.date = '';
      savePlan();
    }
    dateInput.value = plan.date;
    dateHint.textContent = `Earliest day for what is in your order: ${longDay(min)}.`;
    const s = getShop().settings;
    if (feeRule) feeRule.textContent = `Within ${s.radiusMiles} miles. ${money(s.flatFee)} on orders up to ${money(s.flatFeeUpTo)}, ${s.percentOver}% above that.`;
  }

  // ---- the estimate ----
  function renderTotals() {
    const t = cartTotals(getShop(), cartApi.get(), plan.fulfillment === 'Delivery');
    subtotalEl.textContent = money2(t.subtotal);
    deliveryRow.hidden = plan.fulfillment !== 'Delivery';
    deliveryEl.textContent = t.subtotal > 0 ? money2(t.delivery) : '$0.00';
    totalEl.textContent = money2(t.total);
  }

  // ---- checks before the details step ----
  function problems(): { text: string; focus?: HTMLElement | null }[] {
    const out: { text: string; focus?: HTMLElement | null }[] = [];
    const cart = cartApi.get();
    const t = cartTotals(getShop(), cart, plan.fulfillment === 'Delivery');
    if (!cart.lines.length) out.push({ text: 'Add at least one treat to your order.', focus: picker?.querySelector('summary') });
    else if (t.missing.length) out.push({ text: 'One of your treats is not on the menu right now. Change it or remove it.', focus: linesEl.querySelector('.is-missing [data-co-remove]') });
    if (!plan.fulfillment) out.push({ text: 'Choose pickup or delivery.', focus: fulfillmentInputs[0] });
    if (plan.fulfillment === 'Delivery') {
      if (!plan.street) out.push({ text: 'Add the street address for delivery.', focus: addressInputs.street });
      if (!plan.city && !plan.zip) out.push({ text: 'Add the city or ZIP code for delivery.', focus: addressInputs.city });
      if (plan.zip && !/^\d{5}(-\d{4})?$/.test(plan.zip)) out.push({ text: 'Check the ZIP code.', focus: addressInputs.zip });
    }
    if (!plan.date) out.push({ text: 'Pick a day.', focus: dateInput });
    else if (plan.date < earliest()) out.push({ text: `The earliest day for this order is ${longDay(earliest())}.`, focus: dateInput });
    if (!plan.time) out.push({ text: 'Pick a time.', focus: windowsBox.querySelector('input') });
    return out;
  }

  /** Once a list of problems is showing, keep it current as they get fixed. */
  function refreshProblems() {
    if (!problemEl.textContent) return;
    problemEl.textContent = problems()
      .map((p) => p.text)
      .join(' ');
  }

  function addressText(): string {
    const cityZip = [plan.city, plan.zip].filter(Boolean).join(' ');
    return [plan.street, cityZip].filter(Boolean).join(', ');
  }

  function planText(): string {
    const when = `${longDay(plan.date)}, ${plan.time === FLEXIBLE ? 'any time' : plan.time}`;
    return plan.fulfillment === 'Delivery' ? `Delivery to ${addressText()} on ${when}` : `Pickup in ${getShop().settings.pickupTown} on ${when}`;
  }

  // ---- step 4: the Fillout form ----
  let embedId = '';
  let loadedTimer = 0;
  function showDetails() {
    const cart = cartApi.get();
    const t = cartTotals(getShop(), cart, plan.fulfillment === 'Delivery');
    embedId = String(Math.floor(1e13 + Math.random() * 8.9e13));
    const params = new URLSearchParams({
      cart: cartParam(cart),
      items: cartSummary(cart),
      plan: planText(),
      est: money2(t.total),
      date: plan.date,
      time: plan.time,
      fulfillment: plan.fulfillment,
      address: plan.fulfillment === 'Delivery' ? addressText() : '',
      ref: cart.ref,
      src: 'website',
    });
    const standalone = `https://forms.fillout.com/t/${encodeURIComponent(formId)}?${params.toString()}`;
    params.set('fillout-embed-id', embedId);
    params.set('fillout-embed-dynamic-resize', 'true');
    const frame = document.createElement('iframe');
    frame.src = `${FORM_ORIGIN}/t/${encodeURIComponent(formId)}?${params.toString()}`;
    frame.title = 'Your details: the Busy Biese order form';
    frame.className = 'co-iframe';
    frame.setAttribute('allow', 'clipboard-write');
    frame.addEventListener('load', () => {
      window.setTimeout(() => {
        if (!frame.style.height) frame.style.height = '720px';
        frameBox.classList.add('is-loaded');
      }, 2500);
    });
    frameBox.querySelector('iframe')?.remove();
    frameBox.classList.remove('is-loaded');
    frameBox.appendChild(frame);
    if (altLink) altLink.href = standalone;
    altBox?.classList.remove('is-slow');
    window.clearTimeout(loadedTimer);
    loadedTimer = window.setTimeout(() => {
      if (!frameBox.classList.contains('is-loaded')) altBox?.classList.add('is-slow');
    }, 12000);

    // review card replaces the steps
    reviewLines.innerHTML = cart.lines
      .map((l) => `<li><span>${l.qty} × ${esc(l.name)} <span class="muted">(${esc(lineDetails(l))})</span></span><span>${money2(priceLine(getShop(), l).total)}</span></li>`)
      .join('');
    reviewPlan.textContent = planText();
    steps.hidden = true;
    review.hidden = false;
    details.hidden = false;
    continueBtn.hidden = true;
    summaryBox.classList.add('is-final');
    details.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    details.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }

  function backToEditing() {
    frameBox.querySelector('iframe')?.remove();
    frameBox.classList.remove('is-loaded');
    embedId = '';
    steps.hidden = false;
    review.hidden = true;
    details.hidden = true;
    continueBtn.hidden = false;
    summaryBox.classList.remove('is-final');
    steps.scrollIntoView({ block: 'start' });
    steps.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }

  function finished() {
    const cart = cartApi.get();
    const t = cartTotals(getShop(), cart, plan.fulfillment === 'Delivery');
    if (thanksRecap) {
      thanksRecap.innerHTML = `<p><strong>${esc(planText())}.</strong></p><ul role="list">${cart.lines
        .map((l) => `<li>${l.qty} × ${esc(l.name)} (${esc(lineDetails(l))})</li>`)
        .join('')}</ul><p>Estimated total ${money2(t.total)}. We confirm the final price with you.</p>`;
    }
    cartApi.clear();
    plan.date = '';
    plan.time = '';
    savePlan();
    steps.hidden = true;
    review.hidden = true;
    details.hidden = true;
    summaryBox.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ block: 'start' });
    thanks.focus({ preventScroll: true });
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== FORM_ORIGIN || !embedId) return;
    const data = e.data as { type?: string; embedId?: string; size?: number } | null;
    if (!data || String(data.embedId) !== embedId) return;
    if (data.type === 'form_resized' && typeof data.size === 'number') {
      const frame = frameBox.querySelector<HTMLIFrameElement>('iframe');
      if (frame) frame.style.height = `${Math.max(300, Math.round(data.size))}px`;
      frameBox.classList.add('is-loaded');
    } else if (data.type === 'form_submit') {
      finished();
    }
  });

  continueBtn.addEventListener('click', () => {
    const list = problems();
    root.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (list.length) {
      problemEl.textContent = list.map((p) => p.text).join(' ');
      for (const p of list) if (p.focus instanceof HTMLInputElement) p.focus.setAttribute('aria-invalid', 'true');
      list[0].focus?.focus();
      return;
    }
    problemEl.textContent = '';
    showDetails();
  });
  $('[data-co-edit]')?.addEventListener('click', backToEditing);

  function renderAll() {
    renderLines();
    renderPickerExtra();
    renderWindows();
    renderPlan();
    renderTotals();
    refreshProblems();
  }
  onShopChange(renderAll);
  renderAll();
  root.classList.add('is-ready');
  if (cartApi.get().lines.length && picker) picker.open = false;

  // Coming from a product page: "/order/?add=cake-pops" opens that item
  const add = new URLSearchParams(window.location.search).get('add');
  if (add && findItem(getShop(), add)) openSheet(add);
}

