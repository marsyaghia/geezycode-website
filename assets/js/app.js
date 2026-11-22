/*
|--------------------------------------------------------------------------
| GeezyCode — Logika Website
|--------------------------------------------------------------------------
|
| Alur:
| 1. Kalau Supabase diisi di config.js, data diambil dari Supabase.
| 2. Kalau tidak diisi / gagal / terlalu lama, dipakai data cadangan (data.js).
| 3. Semua bagian (pricelist, order card, portofolio, cara order, S&K, FAQ)
|    dirender dari data tersebut.
|
| File ini tidak perlu diedit untuk mengganti konten. Edit datanya di
| Supabase (Table Editor) atau di assets/js/data.js.
|
*/

(function () {
    'use strict';

    /* ----------------------------------------------------------------------
     | Konstanta
     * ---------------------------------------------------------------------- */
    var CFG = window.SITE_CONFIG || {};
    var FALLBACK = window.FALLBACK_DATA || {};
    var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    var LOAD_TIMEOUT_MS = 6000;
    var DEFAULT_BRAND = 'GeezyCode';
    var DEFAULT_WA = '6281234567890';
    var DP_PERCENT = 50;

    var FILTER_LABELS = {
        all: 'Semua',
        ai: 'AI & Data',
        web: 'Web & Dashboard',
    };

    var PREVIEW_PATHS = {
        dashboard: '/dashboard/ringkasan',
        matrix: '/spk/topsis/ranking',
        lms: '/kelas/pemrograman-web',
        terminal: 'sentimen_analysis.ipynb',
    };

    var ICONS = {
        check: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
        checkBold: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
        clock: '<svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
        plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    };

    /* ----------------------------------------------------------------------
     | State
     * ---------------------------------------------------------------------- */
    var state = {
        data: null,
        source: 'fallback',
        client: null,
        tab: null,
        selectedId: null,
        urgency: null,
        addons: [],
        filter: 'all',
        refCode: generateRefCode(),
        lastFocus: null,
        previewOpen: false,
    };

    /* ----------------------------------------------------------------------
     | Utilitas
     * ---------------------------------------------------------------------- */
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var numberFormat = new Intl.NumberFormat('id-ID');

    function rupiah(value) {
        return 'Rp' + numberFormat.format(Math.round(Number(value) || 0));
    }

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function bySortOrder(a, b) {
        return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    }

    function normalizeWa(number) {
        var digits = String(number || '').replace(/\D+/g, '');
        if (!digits) {
            return DEFAULT_WA;
        }
        if (digits.charAt(0) === '0') {
            return '62' + digits.slice(1);
        }
        if (digits.charAt(0) === '8') {
            return '62' + digits;
        }
        return digits;
    }

    function formatWaDisplay(number) {
        var rest = number.slice(2).replace(/(\d{4})(?=\d)/g, '$1 ');
        return '+' + number.slice(0, 2) + ' ' + rest;
    }

    function waUrl(text) {
        return 'https://wa.me/' + state.data.settings.whatsapp_number + '?text=' + encodeURIComponent(text);
    }

    function initials(name) {
        var words = String(name).trim().split(/\s+/).filter(Boolean);

        // Satu kata dengan huruf kapital di tengah (contoh: GeezyCode → GC)
        if (words.length === 1) {
            var capitals = words[0].match(/[A-Z]/g) || [];
            if (capitals.length >= 2) {
                return capitals.slice(0, 2).join('');
            }
            return words[0].slice(0, 2).toUpperCase();
        }

        return words
            .slice(0, 2)
            .map(function (word) { return word.charAt(0).toUpperCase(); })
            .join('');
    }

    function generateRefCode() {
        var alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        var code = '';
        var values = new Uint32Array(5);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(values);
        } else {
            for (var j = 0; j < values.length; j++) {
                values[j] = Math.floor(Math.random() * 4294967295);
            }
        }
        for (var i = 0; i < values.length; i++) {
            code += alphabet.charAt(values[i] % alphabet.length);
        }
        return 'BR-' + code;
    }

    function isMobile() {
        return window.innerWidth < 1024;
    }

    /* ----------------------------------------------------------------------
     | Pengambilan data
     * ---------------------------------------------------------------------- */
    function hasSupabaseConfig() {
        return /^https:\/\/[^\s]+$/.test(String(CFG.supabaseUrl || '').trim())
            && String(CFG.supabaseKey || '').trim().length > 20;
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = function () {
                reject(new Error('Gagal memuat ' + src));
            };
            document.head.appendChild(script);
        });
    }

    function withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise(function (resolve, reject) {
                setTimeout(function () {
                    reject(new Error('Waktu tunggu habis (' + ms + ' ms)'));
                }, ms);
            }),
        ]);
    }

    function fetchFromSupabase() {
        var ready = (window.supabase && window.supabase.createClient)
            ? Promise.resolve()
            : loadScript(SUPABASE_CDN);

        return ready.then(function () {
            var client = window.supabase.createClient(
                String(CFG.supabaseUrl).trim(),
                String(CFG.supabaseKey).trim(),
                { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
            );

            function list(table, orderColumn) {
                return client.from(table).select('*').order(orderColumn || 'sort_order', { ascending: true });
            }

            return Promise.all([
                client.from('site_settings').select('brand_name, whatsapp_number, is_open').eq('id', 1).maybeSingle(),
                list('categories'),
                list('services'),
                list('urgency_options'),
                list('addons'),
                list('portfolio_projects'),
                list('order_steps', 'id'),
                list('rules', 'id'),
                list('faqs', 'id'),
            ]).then(function (results) {
                var names = ['site_settings', 'categories', 'services', 'urgency_options', 'addons', 'portfolio_projects', 'order_steps', 'rules', 'faqs'];

                results.forEach(function (result, index) {
                    if (result.error) {
                        throw new Error('Tabel ' + names[index] + ': ' + result.error.message);
                    }
                });

                if (!toArray(results[1].data).length || !toArray(results[2].data).length) {
                    throw new Error('Tabel categories atau services masih kosong.');
                }

                state.client = client;

                return {
                    settings: results[0].data || null,
                    categories: results[1].data,
                    services: results[2].data,
                    urgency_options: results[3].data,
                    addons: results[4].data,
                    portfolio_projects: results[5].data,
                    order_steps: results[6].data,
                    rules: results[7].data,
                    faqs: results[8].data,
                };
            });
        });
    }

    function normalizeData(raw, source) {
        var dbSettings = raw.settings || {};
        var fallbackSettings = FALLBACK.settings || {};

        var brand = source === 'supabase'
            ? (dbSettings.brand_name || CFG.brandName || DEFAULT_BRAND)
            : (CFG.brandName || fallbackSettings.brand_name || DEFAULT_BRAND);

        var wa = source === 'supabase'
            ? (dbSettings.whatsapp_number || CFG.whatsappNumber || DEFAULT_WA)
            : (CFG.whatsappNumber || fallbackSettings.whatsapp_number || DEFAULT_WA);

        var isOpen = source === 'supabase'
            ? dbSettings.is_open !== false
            : fallbackSettings.is_open !== false;

        var services = toArray(raw.services)
            .filter(function (item) { return item.is_active !== false; })
            .map(function (item) {
                return {
                    id: String(item.id),
                    category_id: String(item.category_id),
                    sort_order: Number(item.sort_order) || 0,
                    name: item.name || '',
                    description: item.description || '',
                    price: Number(item.price) || 0,
                    duration: item.duration || '',
                    is_popular: item.is_popular === true,
                    includes: toArray(item.includes),
                };
            })
            .sort(bySortOrder);

        var categories = toArray(raw.categories)
            .slice()
            .sort(bySortOrder)
            .map(function (category) {
                return {
                    id: String(category.id),
                    index_label: category.index_label || '',
                    label: category.label || '',
                    description: category.description || '',
                };
            })
            .filter(function (category) {
                return services.some(function (item) { return item.category_id === category.id; });
            });

        var categoryLabels = {};
        categories.forEach(function (category) {
            categoryLabels[category.id] = category.label;
        });

        services = services.filter(function (item) { return categoryLabels[item.category_id] !== undefined; });
        services.forEach(function (item) {
            item.category_label = categoryLabels[item.category_id];
        });

        var urgency = toArray(raw.urgency_options)
            .slice()
            .sort(bySortOrder)
            .map(function (option) {
                return {
                    id: String(option.id),
                    label: option.label || '',
                    hint: option.hint || '',
                    time_window: option.time_window || '',
                    surcharge: Number(option.surcharge) || 0,
                };
            });

        if (!urgency.length) {
            urgency = [{ id: 'normal', label: 'Normal', hint: 'Sesuai estimasi', time_window: 'Sesuai estimasi pengerjaan', surcharge: 0 }];
        }

        var addons = toArray(raw.addons)
            .filter(function (addon) { return addon.is_active !== false; })
            .slice()
            .sort(bySortOrder)
            .map(function (addon) {
                return {
                    id: String(addon.id),
                    name: addon.name || '',
                    short_name: addon.short_name || addon.name || '',
                    description: addon.description || '',
                    price: Number(addon.price) || 0,
                };
            });

        var portfolio = toArray(raw.portfolio_projects)
            .filter(function (project) { return project.is_published !== false; })
            .slice()
            .sort(bySortOrder)
            .map(function (project) {
                return {
                    id: String(project.id),
                    category: project.category || 'web',
                    preview: project.preview || 'dashboard',
                    title: project.title || '',
                    context: project.context || '',
                    duration: project.duration || '',
                    problem: project.problem || '',
                    solution: project.solution || '',
                    stack: toArray(project.stack),
                    features: toArray(project.features),
                    deliverables: toArray(project.deliverables),
                };
            });

        var faqs = toArray(raw.faqs).filter(function (faq) { return faq.is_published !== false; });

        return {
            settings: {
                brand_name: brand,
                whatsapp_number: normalizeWa(wa),
                is_open: isOpen,
            },
            categories: categories,
            services: services,
            urgency: urgency,
            addons: addons,
            portfolio: portfolio,
            steps: toArray(raw.order_steps),
            rules: toArray(raw.rules),
            faqs: faqs,
        };
    }

    /* ----------------------------------------------------------------------
     | Pengaturan umum (brand, WA, status slot)
     * ---------------------------------------------------------------------- */
    function applySettings() {
        var settings = state.data.settings;
        var brand = settings.brand_name;

        document.title = brand + ' — Bantuan Proyek IT & Sistem Cerdas';

        $all('[data-brand]').forEach(function (el) {
            el.textContent = brand;
        });

        $all('[data-brand-initials]').forEach(function (el) {
            el.textContent = initials(brand) || 'GC';
        });

        var consultUrl = waUrl('Halo ' + brand + ', saya mau konsultasi gratis dulu soal tugas/proyek IT saya.');
        $all('[data-wa-consult]').forEach(function (el) {
            el.href = consultUrl;
        });

        $all('[data-wa-display]').forEach(function (el) {
            el.textContent = formatWaDisplay(settings.whatsapp_number);
        });

        document.body.classList.toggle('slot-closed', !settings.is_open);

        $all('[data-slot-text]').forEach(function (el) {
            el.textContent = settings.is_open ? 'Open Slot' : 'Slot Penuh';
        });

        $all('[data-slot-long]').forEach(function (el) {
            el.textContent = settings.is_open
                ? 'Open Slot — menerima order baru'
                : 'Slot sedang penuh — tetap bisa tanya jadwal';
        });
    }

    function renderStats() {
        var services = state.data.services;
        var minPrice = services.reduce(function (min, item) {
            return Math.min(min, item.price);
        }, Infinity);

        var maxSurcharge = state.data.urgency.reduce(function (max, option) {
            return Math.max(max, option.surcharge);
        }, 0);

        $('#stat-min-price').textContent = services.length ? rupiah(minPrice) : '—';
        $('#stat-services').textContent = services.length + ' layanan · ' + state.data.categories.length + ' kategori';
        $('#stat-express').textContent = maxSurcharge > 0
            ? 'Express +' + Math.round(maxSurcharge * 100) + '%'
            : 'Tanpa biaya tambahan';
    }

    /* ----------------------------------------------------------------------
     | Pricelist
     * ---------------------------------------------------------------------- */
    function servicesInTab(tabId) {
        return state.data.services.filter(function (item) {
            return item.category_id === tabId;
        });
    }

    function findService(id) {
        return state.data.services.filter(function (item) { return item.id === id; })[0] || null;
    }

    function findCategory(id) {
        return state.data.categories.filter(function (category) { return category.id === id; })[0] || null;
    }

    function renderTabs() {
        var html = state.data.categories.map(function (category) {
            var active = category.id === state.tab;
            return '<button type="button" role="tab" class="tab' + (active ? ' is-active' : '') + '"'
                + ' id="tab-' + esc(category.id) + '"'
                + ' data-tab="' + esc(category.id) + '"'
                + ' aria-selected="' + (active ? 'true' : 'false') + '"'
                + ' tabindex="' + (active ? '0' : '-1') + '">'
                + '<span class="tab-index">' + esc(category.index_label) + '</span>' + esc(category.label)
                + '</button>';
        }).join('');

        $('#service-tabs').innerHTML = html;
    }

    function serviceCardHtml(item) {
        var selected = item.id === state.selectedId;

        var includes = item.includes.map(function (line) {
            return '<li>' + ICONS.check + '<span>' + esc(line) + '</span></li>';
        }).join('');

        return '<article class="service-card' + (selected ? ' is-selected' : '') + '" data-service-card="' + esc(item.id) + '">'
            + '<div class="service-body">'
            + '<div class="service-info">'
            + (item.is_popular ? '<span class="tag-popular">Paling sering dipesan</span>' : '')
            + '<h3 class="service-name">' + esc(item.name) + '</h3>'
            + '<p class="service-desc">' + esc(item.description) + '</p>'
            + (includes ? '<ul class="check-list">' + includes + '</ul>' : '')
            + '</div>'
            + '<div class="service-price">'
            + '<div>'
            + '<p class="price-label">Mulai dari</p>'
            + '<p class="price">' + rupiah(item.price) + '</p>'
            + (item.duration ? '<p class="duration mono">' + ICONS.clock + esc(item.duration) + '</p>' : '')
            + '</div>'
            + '<button type="button" class="btn btn-choose" data-choose="' + esc(item.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">'
            + (selected ? ICONS.check + '<span>Terpilih</span>' : '<span>Pilih layanan</span>')
            + '</button>'
            + '</div>'
            + '</div>'
            + '</article>';
    }

    function renderServices() {
        var category = findCategory(state.tab);
        var list = $('#service-list');

        $('#category-desc').textContent = category ? category.description : '';
        list.setAttribute('aria-labelledby', 'tab-' + state.tab);
        list.innerHTML = servicesInTab(state.tab).map(serviceCardHtml).join('');
    }

    function setTab(tabId, focusTab) {
        if (!findCategory(tabId)) {
            return;
        }
        state.tab = tabId;
        renderTabs();
        renderServices();

        if (focusTab) {
            var button = $('#tab-' + tabId);
            if (button) {
                button.focus();
            }
        }
    }

    /* ----------------------------------------------------------------------
     | Order card
     * ---------------------------------------------------------------------- */
    function renderOrderOptions() {
        var selectHtml = state.data.categories.map(function (category) {
            var options = servicesInTab(category.id).map(function (item) {
                return '<option value="' + esc(item.id) + '">' + esc(item.name) + ' — ' + rupiah(item.price) + '</option>';
            }).join('');
            return '<optgroup label="' + esc(category.label) + '">' + options + '</optgroup>';
        }).join('');

        $('#order-service').innerHTML = selectHtml;

        $('#urgency-options').innerHTML = state.data.urgency.map(function (option) {
            return '<label class="choice" data-choice-urgency="' + esc(option.id) + '">'
                + '<input type="radio" name="urgency" value="' + esc(option.id) + '">'
                + '<span class="choice-title">' + esc(option.label) + '</span>'
                + '<span class="choice-hint">' + esc(option.hint) + '</span>'
                + '</label>';
        }).join('');

        var addonField = $('#addon-options').closest('fieldset');
        addonField.hidden = state.data.addons.length === 0;

        $('#addon-options').innerHTML = state.data.addons.map(function (addon) {
            return '<label class="choice choice-addon" data-choice-addon="' + esc(addon.id) + '">'
                + '<input type="checkbox" value="' + esc(addon.id) + '">'
                + '<span class="checkbox-box" aria-hidden="true">' + ICONS.checkBold + '</span>'
                + '<span class="addon-text">'
                + '<span class="addon-top">'
                + '<span class="choice-title">' + esc(addon.name) + '</span>'
                + '<span class="addon-price">+' + rupiah(addon.price) + '</span>'
                + '</span>'
                + '<span class="addon-desc">' + esc(addon.description) + '</span>'
                + '</span>'
                + '</label>';
        }).join('');
    }

    function currentUrgency() {
        var list = state.data.urgency;
        return list.filter(function (option) { return option.id === state.urgency; })[0] || list[0];
    }

    function selectedAddons() {
        return state.data.addons.filter(function (addon) {
            return state.addons.indexOf(addon.id) !== -1;
        });
    }

    function calculate() {
        var service = findService(state.selectedId);
        var urgency = currentUrgency();
        var addons = selectedAddons();

        var base = service ? service.price : 0;
        var surcharge = Math.round(base * urgency.surcharge);
        var addonTotal = addons.reduce(function (sum, addon) { return sum + addon.price; }, 0);
        var total = base + surcharge + addonTotal;
        var downPayment = Math.ceil((total * DP_PERCENT / 100) / 1000) * 1000;

        return {
            service: service,
            urgency: urgency,
            addons: addons,
            base: base,
            surcharge: surcharge,
            total: total,
            downPayment: downPayment,
            percent: Math.round(urgency.surcharge * 100),
        };
    }

    function briefsEnabled() {
        return Boolean(CFG.saveBriefs && state.client);
    }

    function buildMessage(calc) {
        var brand = state.data.settings.brand_name;
        var stack = $('#order-stack').value.trim();
        var notes = $('#order-notes').value.trim();
        var lines = [];

        lines.push('Halo ' + brand + ', saya mau order. Berikut brief singkatnya:');
        lines.push('');
        lines.push('*BRIEF ORDER*');
        if (briefsEnabled()) {
            lines.push('- Kode brief: ' + state.refCode);
        }
        lines.push('- Kategori: ' + (calc.service ? calc.service.category_label : '-'));
        lines.push('- Layanan: ' + (calc.service ? calc.service.name : '-'));
        lines.push('- Deadline: ' + calc.urgency.label + (calc.urgency.time_window ? ' (' + calc.urgency.time_window + ')' : ''));
        lines.push('- Add-on: ' + (calc.addons.length ? calc.addons.map(function (addon) { return addon.name; }).join(', ') : 'Tidak ada'));
        lines.push('- Tech stack: ' + (stack || '-'));
        lines.push('- Catatan: ' + (notes || '-'));
        lines.push('');
        lines.push('*ESTIMASI AWAL*');
        lines.push('- Harga layanan: mulai ' + rupiah(calc.base));
        if (calc.surcharge > 0) {
            lines.push('- Biaya ' + calc.urgency.label + ' (+' + calc.percent + '%): ' + rupiah(calc.surcharge));
        }
        calc.addons.forEach(function (addon) {
            lines.push('- ' + addon.name + ': ' + rupiah(addon.price));
        });
        lines.push('- Total estimasi: mulai ' + rupiah(calc.total));
        lines.push('');
        lines.push('Soal/file tugas akan saya kirim setelah pesan ini. Mohon info harga final dan ketersediaan slotnya ya. Terima kasih!');

        return lines.join('\n');
    }

    function updateOrder() {
        var calc = calculate();

        // Pilihan layanan
        var select = $('#order-service');
        if (select.value !== state.selectedId) {
            select.value = state.selectedId;
        }
        $('#order-service-meta').textContent = calc.service
            ? calc.service.category_label + (calc.service.duration ? ' · ± ' + calc.service.duration : '')
            : '';

        // Status kartu layanan di tab
        $all('[data-service-card]').forEach(function (card) {
            var selected = card.getAttribute('data-service-card') === state.selectedId;
            var button = $('[data-choose]', card);
            card.classList.toggle('is-selected', selected);
            if (button) {
                button.setAttribute('aria-pressed', selected ? 'true' : 'false');
                button.innerHTML = selected ? ICONS.check + '<span>Terpilih</span>' : '<span>Pilih layanan</span>';
            }
        });

        // Deadline
        $all('[data-choice-urgency]').forEach(function (label) {
            var checked = label.getAttribute('data-choice-urgency') === calc.urgency.id;
            label.classList.toggle('is-checked', checked);
            $('input', label).checked = checked;
        });

        // Add-on
        $all('[data-choice-addon]').forEach(function (label) {
            var checked = state.addons.indexOf(label.getAttribute('data-choice-addon')) !== -1;
            label.classList.toggle('is-checked', checked);
            $('input', label).checked = checked;
        });

        // Ringkasan harga
        $('#sum-base').textContent = rupiah(calc.base);
        $('#sum-express-row').hidden = calc.surcharge <= 0;
        $('#sum-express-label').textContent = 'Biaya ' + calc.urgency.label + ' (+' + calc.percent + '%)';
        $('#sum-express').textContent = '+' + rupiah(calc.surcharge);

        $all('.sum-addon-row').forEach(function (row) {
            row.parentNode.removeChild(row);
        });
        var totalRow = $('#sum-total-row');
        calc.addons.forEach(function (addon) {
            var row = document.createElement('div');
            row.className = 'sum-addon-row';
            row.innerHTML = '<dt>' + esc(addon.short_name) + '</dt><dd class="mono">+' + rupiah(addon.price) + '</dd>';
            totalRow.parentNode.insertBefore(row, totalRow);
        });

        $('#sum-total').textContent = rupiah(calc.total);
        $('#sum-dp').textContent = rupiah(calc.downPayment);

        // Tautan WhatsApp & pratinjau
        var message = buildMessage(calc);
        $('#order-link').href = waUrl(message);
        $('#brief-preview').textContent = message;

        // Penghitung karakter catatan
        $('#notes-counter').textContent = $('#order-notes').value.length + '/400';
    }

    function choose(id, scrollToCard) {
        var service = findService(id);
        if (!service) {
            return;
        }
        state.selectedId = id;

        if (service.category_id !== state.tab) {
            setTab(service.category_id, false);
        }

        updateOrder();

        if (scrollToCard && isMobile()) {
            $('#order').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function saveBrief() {
        if (!briefsEnabled()) {
            return;
        }

        var calc = calculate();
        if (!calc.service) {
            return;
        }

        var stack = $('#order-stack').value.trim().slice(0, 120);
        var notes = $('#order-notes').value.trim().slice(0, 400);

        var row = {
            ref_code: state.refCode,
            service_id: calc.service.id.slice(0, 60),
            service_name: calc.service.name.slice(0, 200),
            category_label: (calc.service.category_label || '').slice(0, 100),
            urgency_label: (calc.urgency.label || 'Normal').slice(0, 60),
            addons: calc.addons.map(function (addon) { return addon.name; }).slice(0, 10),
            tech_stack: stack || null,
            notes: notes || null,
            estimated_total: calc.total,
        };

        state.client.from('order_briefs').insert(row).then(function (result) {
            if (result.error) {
                console.warn('[Supabase] Brief tidak tersimpan:', result.error.message);
            }
        }, function (error) {
            console.warn('[Supabase] Brief tidak tersimpan:', error && error.message);
        });
    }

    function copyBrief() {
        var text = $('#brief-preview').textContent;
        var label = $('#copy-brief span');

        function done() {
            label.textContent = 'Tersalin!';
            setTimeout(function () {
                label.textContent = 'Salin teks brief';
            }, 2000);
        }

        function legacy() {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.top = '-1000px';
            document.body.appendChild(area);
            area.select();
            var ok = false;
            try {
                ok = document.execCommand('copy');
            } catch (error) {
                ok = false;
            }
            document.body.removeChild(area);
            if (ok) {
                done();
            } else {
                togglePreview(true);
            }
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, legacy);
        } else {
            legacy();
        }
    }

    function togglePreview(forceOpen) {
        state.previewOpen = forceOpen === true ? true : !state.previewOpen;
        $('#brief-preview').hidden = !state.previewOpen;
        $('#preview-toggle').setAttribute('aria-expanded', state.previewOpen ? 'true' : 'false');
        $('#preview-toggle span').textContent = state.previewOpen ? 'Tutup pratinjau' : 'Lihat pratinjau pesan';
    }

    /* ----------------------------------------------------------------------
     | Portofolio
     * ---------------------------------------------------------------------- */
    function previewHtml(type) {
        if (type === 'matrix') {
            var rows = [
                ['A3', '0.512', '0.447', '0.603', '0.781', '1'],
                ['A1', '0.468', '0.521', '0.402', '0.642', '2'],
                ['A4', '0.401', '0.493', '0.455', '0.538', '3'],
                ['A2', '0.356', '0.384', '0.512', '0.417', '4'],
            ];
            return '<table class="pv-table"><thead><tr><th>Alt</th><th>C1</th><th>C2</th><th>C3</th><th>V</th><th>Rank</th></tr></thead><tbody>'
                + rows.map(function (row, index) {
                    return '<tr' + (index === 0 ? ' class="is-top"' : '') + '>'
                        + row.map(function (cell) { return '<td>' + cell + '</td>'; }).join('')
                        + '</tr>';
                }).join('')
                + '</tbody></table>';
        }

        if (type === 'lms') {
            return '<div class="pv-lms">'
                + '<div class="pv-side"><span style="width:80%"></span><span style="width:60%"></span><span style="width:66%"></span><span style="width:50%"></span></div>'
                + '<div class="pv-main">'
                + '<p class="pv-caption">Pertemuan 05 · Progres 68%</p>'
                + '<div class="pv-progress"><span></span></div>'
                + '<ul class="pv-rows"><li><i></i>Materi: REST API</li><li><i></i>Kuis 05 · 10 soal</li><li><i></i>Tugas: CRUD Produk</li></ul>'
                + '</div>'
                + '</div>';
        }

        if (type === 'terminal') {
            return '<div class="pv-code">'
                + '<p><span class="ln">[12]</span> model = LinearSVC().fit(X_train, y_train)</p>'
                + '<p><span class="ln">[13]</span> print(classification_report(y_test, y_pred))</p>'
                + '<div class="pv-out">          precision  recall  f1\n'
                + 'positif      0.88     0.86   0.87\n'
                + 'negatif      0.85     0.87   0.86\n'
                + '<b>accuracy                    0.86</b></div>'
                + '</div>';
        }

        var bars = [35, 48, 42, 60, 52, 66, 58, 72, 64, 80, 74, 92].map(function (height) {
            return '<span style="height:' + height + '%"></span>';
        }).join('');

        return '<div class="pv-kpis">'
            + '<div class="pv-kpi"><small>Omzet</small><strong>Rp48,2jt</strong></div>'
            + '<div class="pv-kpi"><small>Transaksi</small><strong>1.284</strong></div>'
            + '<div class="pv-kpi"><small>Tumbuh</small><strong>+12,4%</strong></div>'
            + '</div>'
            + '<div class="pv-bars">' + bars + '</div>';
    }

    function categoryLabel(category) {
        return FILTER_LABELS[category] || category;
    }

    function renderFilters() {
        var counts = { all: state.data.portfolio.length };
        state.data.portfolio.forEach(function (project) {
            counts[project.category] = (counts[project.category] || 0) + 1;
        });

        $('#portfolio-filters').innerHTML = Object.keys(FILTER_LABELS).map(function (key) {
            var active = key === state.filter;
            var count = String(counts[key] || 0);
            return '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '" data-filter="' + key + '" aria-pressed="' + (active ? 'true' : 'false') + '">'
                + esc(FILTER_LABELS[key])
                + '<span class="mono">' + (count.length < 2 ? '0' + count : count) + '</span>'
                + '</button>';
        }).join('');
    }

    function renderPortfolio() {
        var grid = $('#portfolio-grid');
        var items = state.data.portfolio
            .map(function (project, index) { return { project: project, index: index }; })
            .filter(function (entry) {
                return state.filter === 'all' || entry.project.category === state.filter;
            });

        if (!items.length) {
            grid.innerHTML = '<p class="category-desc">Belum ada proyek di kategori ini.</p>';
            return;
        }

        grid.innerHTML = items.map(function (entry) {
            var project = entry.project;
            var pills = project.stack.map(function (tech) {
                return '<li>' + esc(tech) + '</li>';
            }).join('');

            return '<article class="project-card">'
                + '<div class="project-preview" data-open-project="' + entry.index + '" aria-hidden="true">'
                + '<div class="window">'
                + '<div class="window-bar"><i></i><i></i><i></i><span class="window-path">' + esc(PREVIEW_PATHS[project.preview] || '/preview') + '</span></div>'
                + previewHtml(project.preview)
                + '</div>'
                + '</div>'
                + '<div class="project-body">'
                + '<div class="meta-row">'
                + '<span class="badge">' + esc(categoryLabel(project.category)) + '</span>'
                + '<span class="meta-text">' + esc(project.context) + '</span>'
                + '</div>'
                + '<h3 class="project-title">' + esc(project.title) + '</h3>'
                + '<dl class="ps-rows">'
                + '<div><dt class="label-mini">Masalah</dt><dd class="is-problem">' + esc(project.problem) + '</dd></div>'
                + '<div><dt class="label-mini">Solusi</dt><dd>' + esc(project.solution) + '</dd></div>'
                + '</dl>'
                + (pills ? '<ul class="pills" aria-label="Tech stack">' + pills + '</ul>' : '')
                + '<div class="project-foot"><div class="project-foot-inner">'
                + '<span class="duration mono">' + ICONS.clock + esc(project.duration) + '</span>'
                + '<button type="button" class="link-btn" data-open-project="' + entry.index + '">Lihat detail proyek ' + ICONS.arrow + '</button>'
                + '</div></div>'
                + '</div>'
                + '</article>';
        }).join('');
    }

    function openProject(index) {
        var project = state.data.portfolio[index];
        if (!project) {
            return;
        }

        var brand = state.data.settings.brand_name;

        $('#modal-category').textContent = categoryLabel(project.category);
        $('#modal-context').textContent = project.context;
        $('#modal-title').textContent = project.title;
        $('#modal-problem').textContent = project.problem;
        $('#modal-solution').textContent = project.solution;

        $('#modal-features').innerHTML = project.features.map(function (feature) {
            return '<li>' + ICONS.check + '<span>' + esc(feature) + '</span></li>';
        }).join('');

        $('#modal-deliverables').innerHTML = project.deliverables.map(function (item, i) {
            var number = String(i + 1);
            return '<li><span class="mono">' + (number.length < 2 ? '0' + number : number) + '</span><span>' + esc(item) + '</span></li>';
        }).join('');

        $('#modal-stack').innerHTML = project.stack.map(function (tech) {
            return '<li>' + esc(tech) + '</li>';
        }).join('');

        $('#modal-duration').innerHTML = ICONS.clock + 'Pengerjaan ' + esc(project.duration);

        $('#modal-cta').href = waUrl(
            'Halo ' + brand + ', saya lihat studi kasus "' + project.title + '" di portofolio.\n'
            + 'Saya mau konsultasi untuk proyek yang mirip. Boleh dibantu cek kebutuhan dan estimasi harganya?'
        );

        state.lastFocus = document.activeElement;
        $('#project-modal').hidden = false;
        $('.modal-body', $('#project-modal')).scrollTop = 0;
        document.body.classList.add('is-locked');
        $('#modal-close').focus({ preventScroll: true });
    }

    function closeProject() {
        var modal = $('#project-modal');
        if (modal.hidden) {
            return;
        }
        modal.hidden = true;
        document.body.classList.remove('is-locked');
        if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
            state.lastFocus.focus({ preventScroll: true });
        }
    }

    function trapFocus(event) {
        var modal = $('#project-modal');
        if (modal.hidden || event.key !== 'Tab') {
            return;
        }
        var focusable = $all('a[href], button:not([disabled])', modal).filter(function (el) {
            return el.offsetParent !== null;
        });
        if (!focusable.length) {
            return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    /* ----------------------------------------------------------------------
     | Cara order, aturan, FAQ
     * ---------------------------------------------------------------------- */
    function renderSteps() {
        $('#steps-list').innerHTML = state.data.steps.map(function (step) {
            return '<li class="step">'
                + '<span class="step-number">' + esc(step.number_label) + '</span>'
                + '<div class="step-text">'
                + '<h3>' + esc(step.title) + '</h3>'
                + '<p>' + esc(step.description) + '</p>'
                + (step.meta ? '<span class="step-meta">' + esc(step.meta) + '</span>' : '')
                + '</div>'
                + '</li>';
        }).join('');
    }

    function renderRules() {
        $('#rules-list').innerHTML = state.data.rules.map(function (rule) {
            return '<li>'
                + '<span class="rule-label">' + esc(rule.label) + '</span>'
                + '<span>'
                + '<span class="rule-title">' + esc(rule.title) + '</span>'
                + '<span class="rule-desc">' + esc(rule.description) + '</span>'
                + '</span>'
                + '</li>';
        }).join('');
    }

    function renderFaqs() {
        $('#faq-list').innerHTML = state.data.faqs.map(function (faq, index) {
            var open = index === 0;
            var number = String(index + 1);
            return '<div class="faq-item' + (open ? ' is-open' : '') + '">'
                + '<h4>'
                + '<button type="button" class="faq-q" id="faq-q-' + index + '" aria-controls="faq-a-' + index + '" aria-expanded="' + (open ? 'true' : 'false') + '" data-faq>'
                + '<span class="faq-q-text">'
                + '<span class="faq-no">' + (number.length < 2 ? '0' + number : number) + '</span>'
                + '<span class="faq-question">' + esc(faq.question) + '</span>'
                + '</span>'
                + '<span class="faq-toggle" aria-hidden="true">' + ICONS.plus + '</span>'
                + '</button>'
                + '</h4>'
                + '<div class="faq-a" id="faq-a-' + index + '" role="region" aria-labelledby="faq-q-' + index + '">'
                + '<p>' + esc(faq.answer) + '</p>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    function toggleFaq(button) {
        var item = button.closest('.faq-item');
        var willOpen = !item.classList.contains('is-open');

        $all('.faq-item.is-open', $('#faq-list')).forEach(function (openItem) {
            openItem.classList.remove('is-open');
            $('[data-faq]', openItem).setAttribute('aria-expanded', 'false');
        });

        if (willOpen) {
            item.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
        }
    }

    /* ----------------------------------------------------------------------
     | Navigasi
     * ---------------------------------------------------------------------- */
    function setMenu(open) {
        var header = $('#site-header');
        header.classList.toggle('is-open', open);
        $('#menu-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
        $('#menu-toggle').setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    }

    function onScroll() {
        $('#site-header').classList.toggle('is-scrolled', window.scrollY > 8);
    }

    /* ----------------------------------------------------------------------
     | Event
     * ---------------------------------------------------------------------- */
    function bindEvents() {
        // Tab kategori
        $('#service-tabs').addEventListener('click', function (event) {
            var button = event.target.closest('[data-tab]');
            if (button) {
                setTab(button.getAttribute('data-tab'), false);
            }
        });

        $('#service-tabs').addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
                return;
            }
            var ids = state.data.categories.map(function (category) { return category.id; });
            var current = ids.indexOf(state.tab);
            var next = event.key === 'ArrowRight'
                ? (current + 1) % ids.length
                : (current - 1 + ids.length) % ids.length;
            event.preventDefault();
            setTab(ids[next], true);
        });

        // Pilih layanan dari kartu
        $('#service-list').addEventListener('click', function (event) {
            var button = event.target.closest('[data-choose]');
            if (button) {
                choose(button.getAttribute('data-choose'), true);
            }
        });

        // Form order
        $('#order-service').addEventListener('change', function (event) {
            choose(event.target.value, false);
        });

        $('#urgency-options').addEventListener('change', function (event) {
            if (event.target.name === 'urgency') {
                state.urgency = event.target.value;
                updateOrder();
            }
        });

        $('#addon-options').addEventListener('change', function (event) {
            var id = event.target.value;
            var position = state.addons.indexOf(id);
            if (event.target.checked && position === -1) {
                state.addons.push(id);
            } else if (!event.target.checked && position !== -1) {
                state.addons.splice(position, 1);
            }
            updateOrder();
        });

        $('#order-stack').addEventListener('input', updateOrder);
        $('#order-notes').addEventListener('input', updateOrder);

        $('#order-link').addEventListener('click', function () {
            saveBrief();
            setTimeout(function () {
                state.refCode = generateRefCode();
                updateOrder();
            }, 1000);
        });

        $('#preview-toggle').addEventListener('click', function () {
            togglePreview();
        });

        $('#copy-brief').addEventListener('click', copyBrief);

        // Portofolio
        $('#portfolio-filters').addEventListener('click', function (event) {
            var button = event.target.closest('[data-filter]');
            if (button) {
                state.filter = button.getAttribute('data-filter');
                renderFilters();
                renderPortfolio();
            }
        });

        $('#portfolio-grid').addEventListener('click', function (event) {
            var trigger = event.target.closest('[data-open-project]');
            if (trigger) {
                openProject(Number(trigger.getAttribute('data-open-project')));
            }
        });

        $('#project-modal').addEventListener('click', function (event) {
            if (event.target.closest('[data-modal-close]')) {
                closeProject();
            }
        });

        // FAQ
        $('#faq-list').addEventListener('click', function (event) {
            var button = event.target.closest('[data-faq]');
            if (button) {
                toggleFaq(button);
            }
        });

        // Menu HP
        $('#menu-toggle').addEventListener('click', function () {
            setMenu(!$('#site-header').classList.contains('is-open'));
        });

        $all('#mobile-menu a').forEach(function (link) {
            link.addEventListener('click', function () {
                setMenu(false);
            });
        });

        // Keyboard global
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeProject();
                setMenu(false);
            }
            trapFocus(event);
        });

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ----------------------------------------------------------------------
     | Render awal
     * ---------------------------------------------------------------------- */
    function renderError() {
        $('#service-list').innerHTML = '<p class="category-desc">Daftar harga belum bisa dimuat. Silakan langsung chat via WhatsApp untuk info harga.</p>';
        $('#portfolio-grid').innerHTML = '';
    }

    function renderAll() {
        applySettings();

        if (!state.data.services.length) {
            renderError();
            return;
        }

        // Pilihan awal: layanan "paling sering dipesan" di tab pertama
        var firstTab = state.data.categories[0].id;
        var firstItems = servicesInTab(firstTab);
        var popular = firstItems.filter(function (item) { return item.is_popular; })[0];

        state.tab = firstTab;
        state.selectedId = (popular || firstItems[0] || state.data.services[0]).id;
        state.urgency = state.data.urgency[0].id;

        renderStats();
        renderTabs();
        renderServices();
        renderOrderOptions();
        updateOrder();
        renderFilters();
        renderPortfolio();
        renderSteps();
        renderRules();
        renderFaqs();
    }

    function init() {
        var year = $('#year');
        if (year) {
            year.textContent = new Date().getFullYear();
        }

        var loader = hasSupabaseConfig()
            ? withTimeout(fetchFromSupabase(), LOAD_TIMEOUT_MS).then(function (raw) {
                state.source = 'supabase';
                return raw;
            })
            : Promise.reject(new Error('Supabase belum diisi di config.js'));

        loader
            .catch(function (error) {
                console.info('[Data] Memakai data cadangan (data.js):', error.message);
                state.source = 'fallback';
                return FALLBACK;
            })
            .then(function (raw) {
                state.data = normalizeData(raw || {}, state.source);
                console.info('[Data] Sumber data:', state.source);
                renderAll();
                bindEvents();
            });
    }

    init();
})();
