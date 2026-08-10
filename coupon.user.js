// ==UserScript==
// @name         CW: Coupon Helper
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Сортировка купонов
// @author       RESSOR
// @match        http*://*.catwar.net/rabbit*
// @match        http*://*.catwar.su/rabbit*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=catwar.su
// @license      MIT
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Achterstem/CW-Coupon-Helper/main/coupon.user.js
// @downloadURL  https://raw.githubusercontent.com/Achterstem/CW-Coupon-Helper/main/coupon.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const ms = {'янв':0,'фев':1,'мар':2,'апр':3,'мая':4,'июн':5,'июл':6,'авг':7,'сен':8,'окт':9,'ноя':10,'дек':11};

    const coupons = [
        "костюм",
        "бафф на статус",
        "статус с BB-code",
        "статус без BB-code",
        "адрес профиля",
        "возможность отмечать ЛС непрочитанными",
        "вечное хранение ЛС",
        "бафф на имя",
        "код на имя",
        "смена дизайна",
        "летающая картинка",
        "бафф на жевание хвоста",
        "переворачивание модельки в Игровой",
        "аватарка до 3.6 мегабайт",
        "аватарка до 7.2 мегабайт",
        "уникальный статус онлайна",
        "покупка дизайна в профиль",
        "особенность",
        "смена имени",
        "перевод персонажа из Звёздного племени без требований",
        "восстановление персонажа без очереди и требований"
    ];

    let sort = 'end_date';
    let origCoupons = null;

    const getDur = t => t.includes('бессрочно') ? Infinity : ((t.match(/(\d+)\s*дн/)?.[1]*24||0) + +(t.match(/(\d+)\s*ч/)?.[1]||0) || null);
    const getEnd = t => {
        let m = t.match(/(\d{1,2})\s+([а-я]{3})[а-я]*\s+(\d{4})(?:\s+в\s+(\d{1,2}):(\d{2}))?/i);
        return m && ms[m[2].toLowerCase()] != null ? new Date(m[3], ms[m[2].toLowerCase()], m[1], m[4]||0, m[5]||0).getTime() : null;
    };

    const render = () => {
        let el = document.querySelector('#coupons'), groups = {};
        if (!el) return;

        if (!origCoupons) {
            let found = Array.from(el.querySelectorAll('.coupon'));
            if (!found.length) return;
            origCoupons = found;
        }

        if (!document.getElementById('cw-css')) {
            const head = document.head || document.documentElement;
            head.insertAdjacentHTML('beforeend', `<style id="cw-css">
                .cw-wrap { margin: 15px 0; padding: 12px; background: #c7c5b9c7; color: #000; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1) }
                .cw-radio { accent-color: #000; filter: grayscale(1); cursor: pointer; margin: 0 4px 0 0; vertical-align: middle; }
                .cw-radio:checked { filter: grayscale(1) brightness(0) }
                .cw-hdr { margin: 0 0 10px; font-size: 15px; border-bottom: 1px solid #312f2a; padding-bottom: 5px; display: flex; align-items: center; gap: 8px; user-select: none }
                .cw-title-text { cursor: pointer; }
                .cw-copy-btn { background: #312f2a; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px; display: inline-flex; align-items: center; color: #fff; vertical-align: middle; }
                .cw-tooltip { margin-left: 2px; font-size: 12px; color: #312f2a; background: #dcd9ce; padding: 2px 6px; border-radius: 4px; opacity: 0; transition: opacity 0.2s ease; pointer-events: none; font-weight: normal; }
                .cw-gal { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding-bottom: 10px; border-bottom: 1px dashed #979181 }
                .cw-box { position: relative; width: 100px; height: 150px }
                .cw-box img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none }
                .cw-list hr { border: none; border-top: 1px solid #979181; margin: 4px 0 6px }
                .cw-lbl { cursor: pointer; display: inline-flex; align-items: center; color: #000 }
            </style>`);

            el.insertAdjacentHTML('beforebegin', `
                <div class="cw-wrap" style="display:flex;gap:15px;align-items:center;font:13px sans-serif">
                    <b>Сортировка:</b>
                    ${[['end_date','По дате окончания',1], ['duration','По длительности'], ['name','По названию']]
                        .map(([v, n, c]) => `<label class="cw-lbl"><input type="radio" name="cSort" class="cw-radio" value="${v}" ${c?'checked':''}>${n}</label>`).join('')}
                </div>`);
            document.querySelectorAll('input[name="cSort"]').forEach(r => r.onchange = e => { sort = e.target.value; render(); });
        }

        coupons.concat("Без категории").forEach(c => groups[c] = []);
        let now = Date.now();

        origCoupons.forEach(c => {
            let t = c.innerText, end = getEnd(t), dur = getDur(t);
            let left = end ? end - now : (dur ? dur * 36e5 : Infinity);

            c.style.color = (left > 0 && left < 2592e6) ? "#a81c1c" : "#000";
            c.querySelector('.coupon-preview-img')?.remove();
            groups[coupons.find(x => t.toLowerCase().includes(x.toLowerCase())) || "Без категории"].push(c);
        });

        el.innerHTML = '';

        for (let name in groups) {
            let items = groups[name];
            if (!items.length) continue;

            items.sort((a, b) => {
                let ta = a.innerText, tb = b.innerText;
                if (sort === 'end_date') return (getEnd(ta) || Infinity) - (getEnd(tb) || Infinity);
                if (sort === 'duration') return (getDur(ta) ?? Infinity) - (getDur(tb) ?? Infinity);
                let na = (ta.match(/«([^»]+)»/)?.[1]||ta).trim(), nb = (tb.match(/«([^»]+)»/)?.[1]||tb).trim();
                return na.localeCompare(nb) || (getEnd(ta) || Infinity) - (getEnd(tb) || Infinity);
            });

            let imgs = items.map(c => c.querySelector('a[href*=".png"]')?.href).filter(Boolean);
            let gal = imgs.length ? `<div class="cw-gal">${imgs.map(s => `<div class="cw-box"><img src="https://achterstem.github.io/host/model.png"><img src="${s}"></div>`).join('')}</div>` : '';

            let wrap = document.createElement('div');
            wrap.className = 'cw-wrap';
            wrap.innerHTML = `<h3 class="cw-hdr">
                <span class="cw-title-text">▼ ${name} (${items.length})</span>
                <button class="cw-copy-btn" title="Скопировать названия моих купонов">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <span class="cw-tooltip">Скопировано</span>
            </h3>
            <div style="display:flex;flex-direction:column;gap:15px;">${gal}<div class="cw-list" style="display:flex;flex-direction:column;"></div></div>`;

            let list = wrap.querySelector('.cw-list');
            items.forEach((c, i) => {
                if (i > 0) list.appendChild(document.createElement('hr'));
                let d = document.createElement('div');
                d.style.cssText = "display:flex;flex-direction:column;justify-content:center;";
                d.appendChild(c);
                list.appendChild(d);
            });

            let hdrTextSpan = wrap.querySelector('.cw-title-text');
            let contentDiv = wrap.querySelector('.cw-hdr').nextElementSibling;

            hdrTextSpan.onclick = function() {
                let col = contentDiv.style.display === 'none';
                contentDiv.style.display = col ? 'flex' : 'none';
                hdrTextSpan.innerHTML = (col ? '▼ ' : '▶ ') + `${name} (${items.length})`;
            };

            let copyBtn = wrap.querySelector('.cw-copy-btn');
            let tooltip = wrap.querySelector('.cw-tooltip');
            let timeoutId = null;

            copyBtn.onclick = (e) => {
                e.stopPropagation();
                let lines = items.map(coupon => {
                    let clone = coupon.cloneNode(true);
                    clone.querySelectorAll('.code-text').forEach(el => el.remove());
                    let cleanText = clone.innerText.trim().replace(/\s+/g, ' ');
                    return `● ${cleanText}`;
                });

                navigator.clipboard.writeText(lines.join('\n')).then(() => {
                    tooltip.style.opacity = '1';
                    if (timeoutId) clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        tooltip.style.opacity = '0';
                    }, 1200);
                }).catch(err => {
                    console.error('Ошибка копирования: ', err);
                });
            };

            el.appendChild(wrap);
        }
    };

    setTimeout(render, 800);

    let url = location.href;
    new MutationObserver(() => {
        if (location.href !== url) {
            url = location.href;
            origCoupons = null;
            setTimeout(render, 800);
        }
    }).observe(document, { subtree: true, childList: true });

})();
