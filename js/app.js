/* 心靈植癒園 - 應用程式邏輯 */
(function () {
  'use strict';

  // ---------- 資料設定 ----------
  var MOODS = {
    sunny:  { label: '快樂日光', sub: '明亮溫暖',   icon: 'wb_sunny',      fill: true,  swatch: 'bg-secondary-fixed text-secondary',
              fairyName: '向日葵仙子', fairyImg: 'assets/fairies/sunny.png', fairyMeadowImg: 'assets/fairies/sunny-jump.png',
              skillName: '分享光芒', skillDesc: '能在社交情境中提升團隊氛圍，化解同儕間的尷尬與冷場。',
              fairyDesc: '圓潤發光的幾何小精靈身軀，環繞向日葵花瓣光環，象徵溫暖晴朗與無拘無束的活力。' },
    storm:  { label: '生氣雷雨', sub: '熱烈爆發',   icon: 'thunderstorm',  fill: false, swatch: 'bg-error-container text-error',
              fairyName: '仙人掌仙子', fairyImg: 'assets/fairies/storm.png', fairyMeadowImg: 'assets/fairies/storm-jump.png',
              skillName: '建立邊界', skillDesc: '面對不公或邊界侵犯時，能勇敢且平靜地表達底線。',
              fairyDesc: '圓滾堅毅的仙人掌球體精靈，頂端盛開一朵堅強玫瑰，帶有保護自我的溫和盾牌。' },
    rain:   { label: '憂鬱陰雨', sub: '想靜一靜',   icon: 'rainy',         fill: true,  swatch: 'bg-tertiary-fixed text-tertiary',
              fairyName: '藍鈴花仙子', fairyImg: 'assets/fairies/rain.png', fairyMeadowImg: 'assets/fairies/rain-jump.png',
              skillName: '同理陪伴', skillDesc: '安靜傾聽受傷與難過，在不急躁的陪伴中化解冰冷。',
              fairyDesc: '宛如清透水滴與倒掛藍鈴花蕾的水之精靈，晶瑩澄澈，溫柔接納所有失落與淚水。' },
    breeze: { label: '平靜微風', sub: '放鬆舒服',   icon: 'air',           fill: false, swatch: 'bg-primary-fixed text-primary',
              fairyName: '四葉草仙子', fairyImg: 'assets/fairies/breeze.png', fairyMeadowImg: 'assets/fairies/breeze-jump.png',
              hatchFrames: { dir: 'assets/hatch/breeze', count: 56, fps: 12 },
              skillName: '深呼吸防護', skillDesc: '面對環境感官過載時，創造安定呼吸的心靈淨化場域。',
              fairyDesc: '舒展平穩的四葉草精靈，自然發散微風氣息，提醒我們在喧鬧環境中安頓心靈節奏。' },
    fog:    { label: '害怕迷霧', sub: '有些不知所措', icon: 'foggy',       fill: false, swatch: 'bg-surface-container-high text-outline',
              fairyName: '含羞草仙子', fairyImg: 'assets/fairies/fog.png', fairyMeadowImg: 'assets/fairies/fog-jump.png',
              skillName: '危機警報', skillDesc: '引導覺察環境風險，在超出自身承受時果斷求助。',
              fairyDesc: '柔軟微縮的淡紫含羞草精靈，羽葉輕環自身，是靈敏警覺的自然安全雷達。' }
  };
  var MOOD_ORDER = ['sunny', 'storm', 'rain', 'breeze', 'fog'];

  var STAGE_INFO = [
    { icon: 'potted_plant',   label: '空陶盆',   desc: '等待第一顆情緒種子種下……' },
    { icon: 'grain',          label: '萌芽種子', desc: '泥土裡開始有了微小的心跳。' },
    { icon: 'spa',            label: '稚嫩小芽', desc: '探出嫩綠的腦袋張望世界。' },
    { icon: 'nest_eco_leaf',  label: '茂盛綠葉', desc: '懂得接納多種不同的情緒。' },
    { icon: 'nature',         label: '強壯枝葉', desc: '內心變得更有韌性與安全感。' },
    { icon: 'psychology',     label: '神秘花苞', desc: '花瓣緊抱，醞釀精靈守護力。' },
    { icon: 'auto_awesome',   label: '蛻變開花', desc: '專屬花仙子誕生了！' }
  ];

  // ---------- 使用者檔案（平板共用情境：多位小朋友各自的存檔） ----------
  var PROFILES_KEY = 'eg_profiles_v1';
  var ACTIVE_PROFILE_KEY = 'eg_active_profile_v1';
  var AVATAR_CHOICES = ['🌻', '🌵', '🪻', '🍀', '💜'];

  function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; } catch (e) { return []; }
  }
  function saveProfiles(list) { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); }
  function getActiveProfileId() { return localStorage.getItem(ACTIVE_PROFILE_KEY); }
  function setActiveProfileId(id) { localStorage.setItem(ACTIVE_PROFILE_KEY, id); }
  function stateKeyFor(profileId) { return 'eg_state_v1__' + profileId; }

  // ---------- 狀態管理（每位使用者各自一份） ----------
  var activeProfileId = null;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function loadState(profileId) {
    var raw = localStorage.getItem(stateKeyFor(profileId));
    var defaults = {
      waterInventory: 0,
      growthStage: 0,
      moodHistory: [],
      unlockedFairies: ['sunny', 'storm', 'rain'], // 快樂、生氣、難過三隻基礎情緒仙子一開始就陪伴著孩子
      harvestCount: 0,
      diaryEntries: [],
      lastEntryDate: null,
      currentMood: null
    };
    if (!raw) return defaults;
    try {
      var parsed = JSON.parse(raw);
      return Object.assign(defaults, parsed);
    } catch (e) {
      return defaults;
    }
  }

  var state = null;

  function saveState() {
    localStorage.setItem(stateKeyFor(activeProfileId), JSON.stringify(state));
  }

  function dominantMood() {
    if (!state.moodHistory.length) return 'sunny';
    var counts = {};
    var best = state.moodHistory[0], bestCount = 0;
    state.moodHistory.forEach(function (m) {
      counts[m] = (counts[m] || 0) + 1;
      if (counts[m] > bestCount) { bestCount = counts[m]; best = m; }
    });
    return best;
  }

  // ---------- 導覽 ----------
  var currentView = null;
  function switchView(viewKey) {
    if (viewKey === currentView) return;
    currentView = viewKey;
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = (v.dataset.view !== viewKey); });
    document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(function (a) {
      var active = a.dataset.view === viewKey;
      a.classList.toggle('bg-primary-container', active);
      a.classList.toggle('text-on-primary', active);
      a.classList.toggle('shadow-sm', active);
      a.classList.toggle('text-on-surface-variant', !active);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (viewKey === 'garden') renderGarden();
    if (viewKey === 'diary') renderDiary();
    if (viewKey === 'growth') renderGrowth();
    if (viewKey === 'calm') stopBreathing();
    if (viewKey === 'library' && !libInitialized) initLibrary();
    if (viewKey === 'jungle' && !jungleInitialized) initJungle();
  }

  function initNav() {
    document.querySelectorAll('a[data-view]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var key = el.dataset.view === 'jump' ? el.dataset.target : el.dataset.view;
        if (!key) return;
        e.preventDefault();
        location.hash = key;
        switchView(key);
      });
    });
    var initial = (location.hash || '#garden').replace('#', '');
    if (!document.querySelector('.view[data-view="' + initial + '"]')) initial = 'garden';
    switchView(initial);
  }

  // ---------- 共用彈窗 ----------
  function showModal(html) {
    document.getElementById('app-modal-body').innerHTML = html;
    var overlay = document.getElementById('app-modal-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }
  function closeModal() {
    var overlay = document.getElementById('app-modal-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
  document.getElementById('app-modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
  window.closeModal = closeModal;

  // ---------- 全域甘露顯示 ----------
  function refreshDewBadges() {
    document.querySelectorAll('#global-dew-count, #garden-dew-count').forEach(function (el) {
      el.textContent = state.waterInventory;
    });
  }

  // ============ 我的心靈花園 ============
  function renderMoodPebbles() {
    var wrap = document.getElementById('garden-mood-group');
    wrap.innerHTML = MOOD_ORDER.map(function (key) {
      var m = MOODS[key];
      var active = state.currentMood === key;
      return '<button type="button" data-mood="' + key + '" class="garden-mood-btn w-full min-h-[54px] px-space-md py-space-xs rounded-lg transition-all flex items-center justify-between shadow-sm active:translate-y-0.5 text-left ' +
        (active ? 'bg-surface-container-high shadow-md scale-[1.01]' : 'bg-surface-container-low hover:bg-surface-container') + '">' +
        '<div class="flex items-center gap-space-sm">' +
        '<div class="w-9 h-9 rounded-full ' + m.swatch + ' flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">' + m.icon + '</span></div>' +
        '<div class="flex flex-col"><span class="font-label-md text-label-md ' + (active ? 'text-primary font-bold' : 'text-on-surface') + '">' + m.label + '</span>' +
        '<span class="font-body-sm text-[12px] text-on-surface-variant">' + m.sub + '</span></div></div>' +
        '<span class="material-symbols-outlined text-[20px] ' + (active ? 'text-primary' : 'text-outline-variant') + '">' + (active ? 'check_circle' : 'radio_button_unchecked') + '</span>' +
        '</button>';
    }).join('');
    wrap.querySelectorAll('.garden-mood-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.currentMood = btn.dataset.mood;
        saveState();
        renderMoodPebbles();
      });
    });
  }

  function renderGarden() {
    refreshDewBadges();
    document.getElementById('garden-progress-text').textContent = state.growthStage + ' / 6 滴';
    var info = STAGE_INFO[state.growthStage];
    document.getElementById('garden-stage-icon').textContent = info.icon;
    document.getElementById('plant-visual-icon').textContent = info.icon;
    document.getElementById('garden-stage-label').textContent = '第 ' + state.growthStage + ' 階 · ' + info.label;
    document.getElementById('garden-status-desc').textContent = info.desc;
    renderMoodPebbles();
    if (!meadowInitialized) { meadowInitialized = true; initMeadow(); }
  }

  // ---------- 花園居民：草地上會自己走動／飛翔的仙子與精靈 ----------
  var meadowInitialized = false;
  var meadowTimers = [];

  var MEADOW_SPRITE_SIZE = 88;
  var MEADOW_MIN_GAP = 70; // 居民彼此之間盡量保持的最小距離

  function meadowResidents() {
    var list = [];
    state.unlockedFairies.forEach(function (key) {
      var m = MOODS[key];
      // 有跳躍圖的話，走動時會跟站姿圖交替顯示，製造出蹦跳的動感
      list.push({ img: m.fairyMeadowImg || m.fairyImg, standImg: m.fairyImg, name: m.fairyName, desc: m.fairyDesc, canFly: true, pitch: hashPitch(m.fairyName) });
    });
    FRUITS.forEach(function (f) {
      // 水果精靈目前只有一張圖，沒有第二個姿勢可以交替
      list.push({ img: f.img, standImg: null, name: f.name, desc: f.desc, canFly: false, pitch: hashPitch(f.id) });
    });
    return list;
  }

  function showResidentModal(resident) {
    showModal(
      '<div class="text-center space-y-space-md">' +
      '<div class="relative inline-block"><img id="meadow-modal-img" src="' + resident.img + '" alt="' + resident.name + '" class="char-pop-in inline-block w-40 h-40 object-contain drop-shadow-lg" /></div>' +
      '<h2 class="font-headline-md text-headline-md text-primary">' + resident.name + '</h2>' +
      '<p class="font-body-md text-body-md text-on-surface-variant" id="meadow-modal-desc"></p>' +
      '<button class="w-full h-14 rounded-full bg-primary text-on-primary font-label-md text-label-md" onclick="closeModal()">👋 掰掰，等等再來找你</button>' +
      '</div>'
    );
    makeCharacterInteractive(document.getElementById('meadow-modal-img'), resident.pitch);
    var greeting = RESIDENT_GREETINGS[Math.floor(Math.random() * RESIDENT_GREETINGS.length)];
    typewriterVoice(document.getElementById('meadow-modal-desc'), greeting, resident.pitch);
  }

  // 找一個離其他居民有一定距離的隨機位置，避免大家擠成一團
  function pickSpacedSpot(w, h, minX, maxY, otherEls, selfEl) {
    var best = null, bestScore = -1;
    for (var attempt = 0; attempt < 6; attempt++) {
      var x = Math.random() * Math.max(1, w - MEADOW_SPRITE_SIZE);
      var y = minX + Math.random() * Math.max(1, maxY - minX);
      var minDist = Infinity;
      Array.from(otherEls).forEach(function (other) {
        if (other === selfEl) return;
        var ox = parseFloat(other.style.left) || 0, oy = parseFloat(other.style.top) || 0;
        var d = Math.hypot(x - ox, y - oy);
        if (d < minDist) minDist = d;
      });
      if (minDist >= MEADOW_MIN_GAP) return { x: x, y: y };
      if (minDist > bestScore) { bestScore = minDist; best = { x: x, y: y }; }
    }
    return best || { x: Math.random() * w, y: minX };
  }

  function startMeadowWander(el, resident, stageEl, layerEl) {
    var hopTimer = null;
    function setHopping(on) {
      if (hopTimer) { clearInterval(hopTimer); hopTimer = null; }
      if (!on || !resident.standImg) { el.src = resident.img; return; }
      var showingJump = true;
      hopTimer = setInterval(function () {
        showingJump = !showingJump;
        el.src = showingJump ? resident.img : resident.standImg;
      }, 750);
      meadowTimers.push(hopTimer);
    }
    function tick() {
      var w = stageEl.clientWidth, h = stageEl.clientHeight;
      var groundTop = h * 0.55;
      var spot = resident.canFly
        ? pickSpacedSpot(w, h, 0, h - MEADOW_SPRITE_SIZE, layerEl.children, el)
        : pickSpacedSpot(w, h, groundTop, h - MEADOW_SPRITE_SIZE, layerEl.children, el);
      var curX = parseFloat(el.style.left) || 0;
      var curY = parseFloat(el.style.top) || 0;
      el.style.transform = (spot.x < curX) ? 'scaleX(-1)' : 'scaleX(1)';
      var dist = Math.abs(spot.x - curX) + Math.abs(spot.y - curY);
      var duration = Math.max(1.4, dist / 35);
      el.style.transition = 'left ' + duration + 's linear, top ' + duration + 's linear';
      el.style.left = spot.x + 'px';
      el.style.top = spot.y + 'px';
      setHopping(true);
      var idleTime = 900 + Math.random() * 2600;
      var t = setTimeout(function () {
        setHopping(false);
        var t2 = setTimeout(tick, idleTime);
        meadowTimers.push(t2);
      }, duration * 1000);
      meadowTimers.push(t);
    }
    tick();
  }

  // 定期檢查居民彼此有沒有貼太近／重疊，太近的話就輕輕推開，像撞到會彈開一樣
  function startMeadowCollisionLoop(layerEl) {
    var t = setInterval(function () {
      var sprites = Array.from(layerEl.children);
      for (var i = 0; i < sprites.length; i++) {
        for (var j = i + 1; j < sprites.length; j++) {
          var a = sprites[i], b = sprites[j];
          var ax = parseFloat(a.style.left) || 0, ay = parseFloat(a.style.top) || 0;
          var bx = parseFloat(b.style.left) || 0, by = parseFloat(b.style.top) || 0;
          var dx = bx - ax, dy = by - ay;
          var dist = Math.hypot(dx, dy);
          if (dist > 0.1 && dist < MEADOW_SPRITE_SIZE * 0.75) {
            var push = (MEADOW_SPRITE_SIZE * 0.75 - dist) / 2;
            var ux = dx / dist, uy = dy / dist;
            a.style.transition = 'left 0.35s ease-out, top 0.35s ease-out';
            b.style.transition = 'left 0.35s ease-out, top 0.35s ease-out';
            a.style.left = (ax - ux * push) + 'px';
            a.style.top = (ay - uy * push) + 'px';
            b.style.left = (bx + ux * push) + 'px';
            b.style.top = (by + uy * push) + 'px';
          }
        }
      }
    }, 500);
    meadowTimers.push(t);
  }

  function initMeadow() {
    meadowTimers.forEach(clearTimeout);
    meadowTimers = [];
    var stage = document.getElementById('meadow-stage');
    var layer = document.getElementById('meadow-sprites-layer');
    layer.innerHTML = '';
    var w = stage.clientWidth, h = stage.clientHeight;
    meadowResidents().forEach(function (resident) {
      var img = document.createElement('img');
      img.src = resident.img;
      img.alt = resident.name;
      img.className = 'meadow-sprite';
      img.style.left = (Math.random() * Math.max(1, w - MEADOW_SPRITE_SIZE)) + 'px';
      img.style.top = (resident.canFly ? Math.random() * Math.max(1, h * 0.5) : h * 0.6 + Math.random() * (h * 0.3)) + 'px';
      img.addEventListener('click', function (e) { e.stopPropagation(); showResidentModal(resident); });
      layer.appendChild(img);
      startMeadowWander(img, resident, stage, layer);
    });
    startMeadowCollisionLoop(layer);
  }

  function playWaterFx() {
    var fx = document.getElementById('dew-drop-fx');
    fx.classList.remove('opacity-0');
    fx.classList.add('dew-fx-play');
    setTimeout(function () { fx.classList.remove('dew-fx-play'); fx.classList.add('opacity-0'); }, 1000);
    var wrapper = document.getElementById('plant-visual-wrapper');
    wrapper.classList.add('plant-grow-fx');
    setTimeout(function () { wrapper.classList.remove('plant-grow-fx'); }, 600);
  }

  document.getElementById('water-plant-btn').addEventListener('click', function () {
    if (state.waterInventory <= 0) {
      showModal(
        '<div class="text-center space-y-space-md">' +
        '<span class="material-symbols-outlined text-tertiary" style="font-size:56px;">water_drop</span>' +
        '<h2 class="font-headline-sm text-headline-sm text-primary">今天的甘露用完囉！</h2>' +
        '<p class="font-body-md text-body-md text-on-surface-variant">去「情緒澆灌日記」記錄今天的心情，就可以獲得更多甘露喔！</p>' +
        '<button class="w-full h-14 rounded-full bg-primary text-on-primary font-label-md text-label-md" onclick="closeModal(); location.hash=\'diary\'; window.__switchView(\'diary\');">前往情緒澆灌日記</button>' +
        '</div>'
      );
      return;
    }
    state.waterInventory -= 1;
    state.growthStage += 1;
    if (state.currentMood) state.moodHistory.push(state.currentMood);
    playWaterFx();
    playWater();

    if (state.growthStage >= 6) {
      setTimeout(function () { triggerHatch(); }, 500);
    } else {
      saveState();
      renderGarden();
      showModal(
        '<div class="text-center space-y-space-sm">' +
        '<span class="material-symbols-outlined text-primary" style="font-size:48px;">local_florist</span>' +
        '<h2 class="font-headline-sm text-headline-sm text-primary">灌溉成功！</h2>' +
        '<p class="font-body-md text-body-md text-on-surface-variant">植物吸收了你的心情養分，又長大了一步！</p>' +
        '<button class="w-full h-12 rounded-full bg-primary text-on-primary font-label-md text-label-md" onclick="closeModal()">好的，繼續照顧它</button>' +
        '</div>'
      );
    }
  });

  function triggerHatch() {
    var moodKey = dominantMood();
    var m = MOODS[moodKey];
    if (state.unlockedFairies.indexOf(moodKey) === -1) state.unlockedFairies.push(moodKey);
    state.harvestCount += 1;
    state.growthStage = 0;
    state.moodHistory = [];
    saveState();
    meadowInitialized = false; // 有新仙子加入花園居民，重新整理草地
    renderGarden();
    playSuccess();
    var imgClass = m.hatchFrames ? 'inline-block w-40 h-40 object-contain drop-shadow-lg' : 'char-pop-in inline-block w-40 h-40 object-contain drop-shadow-lg';
    showModal(
      '<div class="text-center space-y-space-md">' +
      '<div class="relative inline-block"><img id="hatch-fairy-img" src="' + m.fairyImg + '" alt="' + m.fairyName + '" class="' + imgClass + '" /></div>' +
      '<h2 class="font-headline-md text-headline-md text-primary">✨ 專屬綻放！' + m.fairyName + ' ✨</h2>' +
      '<div class="bg-surface-container-low rounded-lg p-space-md text-left space-y-space-xs">' +
      '<p class="font-label-md text-label-md text-primary">心靈天賦：【' + m.skillName + '】</p>' +
      '<p class="font-body-sm text-body-sm text-on-surface-variant">' + m.skillDesc + '</p>' +
      '</div>' +
      '<p class="font-body-sm text-body-sm text-on-surface-variant" id="hatch-fairy-desc"></p>' +
      '<button class="w-full h-14 rounded-full bg-primary text-on-primary font-label-md text-label-md" onclick="closeModal()">🤝 開始守護</button>' +
      '</div>'
    );
    var hatchPitch = hashPitch(m.fairyName);
    var hatchImg = document.getElementById('hatch-fairy-img');
    if (m.hatchFrames) {
      // 播放蛻變分解動畫（去背後的影片截幀），先預先載入所有格數再播放，避免邊播邊等圖造成播放變慢
      var hf = m.hatchFrames;
      var urls = [];
      for (var fi = 1; fi <= hf.count; fi++) urls.push(hf.dir + '/f_' + String(fi).padStart(3, '0') + '.png');
      Promise.all(urls.map(function (url) {
        return new Promise(function (resolve) {
          var im = new Image();
          im.onload = im.onerror = resolve;
          im.src = url;
        });
      })).then(function () {
        var frame = 1;
        hatchImg.src = urls[0];
        var animTimer = setInterval(function () {
          frame++;
          if (frame > hf.count) {
            clearInterval(animTimer);
            hatchImg.src = m.fairyImg;
            hatchImg.classList.add('char-pop-in');
            makeCharacterInteractive(hatchImg, hatchPitch);
            return;
          }
          hatchImg.src = urls[frame - 1];
        }, 1000 / hf.fps);
      });
    } else {
      makeCharacterInteractive(hatchImg, hatchPitch);
    }
    typewriterVoice(document.getElementById('hatch-fairy-desc'), '很高興認識你，以後就是好夥伴了！', hatchPitch);
  }

  // ============ 情緒澆灌日記 ============
  var diarySelectedMood = null;

  function renderDiaryMoodPicker() {
    var wrap = document.getElementById('diary-mood-picker');
    wrap.innerHTML = MOOD_ORDER.map(function (key) {
      var m = MOODS[key];
      var active = diarySelectedMood === key;
      return '<button type="button" data-mood="' + key + '" class="diary-mood-btn group flex flex-col items-center justify-center p-space-sm rounded-lg transition-all duration-200 text-center min-h-[96px] active:scale-95 ' +
        (active ? 'bg-primary-fixed/60 ring-2 ring-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high') + '">' +
        '<span class="material-symbols-outlined text-[36px] ' + (active ? 'text-primary' : 'text-on-surface-variant') + '">' + m.icon + '</span>' +
        '<span class="font-label-md text-label-md mt-space-xxs ' + (active ? 'text-primary font-bold' : 'text-on-surface') + '">' + m.label + '</span>' +
        '<span class="font-label-sm text-label-sm text-on-surface-variant">' + m.sub + '</span>' +
        '</button>';
    }).join('');
    wrap.querySelectorAll('.diary-mood-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        diarySelectedMood = btn.dataset.mood;
        renderDiaryMoodPicker();
        updateDiarySubmitState();
      });
    });
  }

  function updateDiarySubmitState() {
    var btn = document.getElementById('diary-submit-btn');
    var label = document.getElementById('diary-submit-label');
    var alreadyToday = state.lastEntryDate === todayStr();
    if (alreadyToday) {
      btn.disabled = true;
      label.textContent = '今天已經澆灌過囉，明天再來';
      return;
    }
    if (!diarySelectedMood) {
      btn.disabled = true;
      label.textContent = '先選一個心情吧';
      return;
    }
    var text = document.getElementById('diary-journal-input').value.trim();
    var drops = 1 + (text.length > 0 ? 1 : 0);
    btn.disabled = false;
    label.textContent = '完成澆灌，獲得 ' + drops + ' 滴甘露';
  }

  function renderDiaryHistory() {
    var list = document.getElementById('diary-history-list');
    var entries = state.diaryEntries.slice(-7).reverse();
    if (!entries.length) {
      list.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant p-space-md">還沒有紀錄，寫下今天的第一篇日記吧！</p>';
      return;
    }
    list.innerHTML = entries.map(function (e) {
      var m = MOODS[e.mood];
      return '<article class="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex items-start gap-space-md">' +
        '<div class="w-10 h-10 rounded-full ' + m.swatch + ' flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-[20px]">' + m.icon + '</span></div>' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center justify-between gap-space-xs">' +
        '<span class="font-label-md text-label-md text-on-surface font-bold">' + m.label + ' · ' + e.date + '</span>' +
        '<span class="font-label-sm text-label-sm text-tertiary flex items-center flex-shrink-0"><span class="material-symbols-outlined text-[14px]">water_drop</span>+' + e.drops + '</span>' +
        '</div>' +
        (e.text ? '<p class="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs line-clamp-2">' + escapeHtml(e.text) + '</p>' : '') +
        '</div></article>';
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderDiary() {
    refreshDewBadges();
    diarySelectedMood = null;
    renderDiaryMoodPicker();
    document.getElementById('diary-journal-input').value = '';
    document.getElementById('diary-char-count').textContent = '已記錄 0 字';
    document.getElementById('diary-stage-badge').textContent = '目前小樹進度 · ' + state.growthStage + '/6 滴甘霖';
    var alreadyToday = state.lastEntryDate === todayStr();
    document.getElementById('diary-lock-msg').textContent = alreadyToday
      ? '今天已經完成澆灌了，明天再一起繼續記錄心情吧！'
      : '每一次坦率面對自己的感受，都在滋養心靈裡最勇敢的種子。';
    updateDiarySubmitState();
    renderDiaryHistory();
  }

  document.getElementById('diary-journal-input').addEventListener('input', function (e) {
    document.getElementById('diary-char-count').textContent = '已記錄 ' + e.target.value.trim().length + ' 字';
    updateDiarySubmitState();
  });

  document.getElementById('diary-submit-btn').addEventListener('click', function () {
    if (!diarySelectedMood || state.lastEntryDate === todayStr()) return;
    var text = document.getElementById('diary-journal-input').value.trim();
    var drops = 1 + (text.length > 0 ? 1 : 0);
    state.waterInventory += drops;
    state.diaryEntries.push({ date: todayStr(), mood: diarySelectedMood, text: text, drops: drops });
    state.lastEntryDate = todayStr();
    saveState();
    renderDiary();
    refreshDewBadges();
    playSuccess();
    showModal(
      '<div class="text-center space-y-space-sm">' +
      '<span class="material-symbols-outlined text-tertiary" style="font-size:48px;">celebration</span>' +
      '<h2 class="font-headline-sm text-headline-sm text-primary">今天獲得了 ' + drops + ' 滴甘露！</h2>' +
      '<p class="font-body-md text-body-md text-on-surface-variant">帶著這些甘露，回花園幫小樹澆水吧！</p>' +
      '<button class="w-full h-12 rounded-full bg-primary text-on-primary font-label-md text-label-md" onclick="closeModal(); location.hash=\'garden\'; window.__switchView(\'garden\');">前往我的心靈花園</button>' +
      '</div>'
    );
  });

  // ============ 成長六階圖鑑 ============
  function renderGrowth() {
    document.getElementById('growth-unlocked-count').textContent = state.unlockedFairies.length + ' / 5 隻';
    document.getElementById('growth-harvest-count').textContent = state.harvestCount + ' 次';

    var dom = dominantMood();
    var grid = document.getElementById('fairy-gallery-grid');
    grid.innerHTML = MOOD_ORDER.map(function (key) {
      var m = MOODS[key];
      var unlocked = state.unlockedFairies.indexOf(key) !== -1;
      var isInProgress = !unlocked && dom === key && state.moodHistory.length > 0;
      var progressPct = isInProgress ? Math.round((state.growthStage / 6) * 100) : 0;
      return '<div class="flex flex-col justify-between rounded-lg bg-surface-container-lowest p-space-lg shadow-sm">' +
        '<div>' +
        '<div class="flex items-center justify-between mb-space-md">' +
        '<span class="inline-flex items-center gap-space-xxs px-space-sm py-space-xxs rounded-full ' + m.swatch + ' font-label-sm text-label-sm font-bold"><span class="material-symbols-outlined text-[16px]">' + m.icon + '</span> ' + m.label + '</span>' +
        (unlocked
          ? '<div class="flex items-center gap-space-xxs text-primary font-label-sm text-label-sm"><span class="material-symbols-outlined text-[18px]">verified</span><span>已常駐守護</span></div>'
          : '<div class="flex items-center gap-space-xxs text-secondary font-label-sm text-label-sm font-bold"><span class="material-symbols-outlined text-[18px]">timelapse</span><span>培育中 ' + progressPct + '%</span></div>') +
        '</div>' +
        '<div class="relative w-full h-40 rounded-xl overflow-hidden mb-space-md bg-surface-container flex items-center justify-center shadow-inner">' +
        '<img src="' + m.fairyImg + '" alt="' + m.fairyName + '" class="w-28 h-28 object-contain" style="' + (unlocked ? '' : 'filter:grayscale(1);opacity:.55;') + '" />' +
        '</div>' +
        '<h3 class="font-headline-sm text-headline-sm text-on-surface mb-space-xs">' + m.fairyName + '</h3>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">' + m.fairyDesc + '</p>' +
        '<div class="rounded-DEFAULT bg-surface-container p-space-md mb-space-md">' +
        '<div class="flex items-center gap-space-xs text-primary mb-space-xxs"><span class="font-label-md text-label-md">心靈天賦：【' + m.skillName + '】</span></div>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant">' + m.skillDesc + '</p>' +
        '</div></div>' +
        (unlocked
          ? '<div class="p-space-sm rounded-DEFAULT bg-surface-container-high text-center font-label-sm text-label-sm text-primary">已經是你的心靈夥伴囉！</div>'
          : '<a href="#diary" data-view="jump" data-target="diary" class="w-full h-11 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md flex items-center justify-center gap-space-xs">前往情緒日記繼續培育</a>') +
        '</div>';
    }).join('');
    // re-bind jump links generated dynamically
    grid.querySelectorAll('[data-view="jump"]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = el.dataset.target;
        switchView(el.dataset.target);
      });
    });

    var timeline = document.getElementById('growth-stage-timeline');
    timeline.innerHTML = STAGE_INFO.map(function (info, idx) {
      var achieved = idx <= state.growthStage;
      var isCurrent = idx === state.growthStage;
      return '<div class="flex flex-col items-center text-center p-space-md rounded-lg bg-surface-container-lowest shadow-sm ' + (isCurrent ? 'ring-2 ring-primary shadow-md' : '') + '">' +
        '<div class="w-10 h-10 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold mb-space-xs ' + (isCurrent ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant') + '">💧 ' + idx + '</div>' +
        '<div class="w-16 h-16 rounded-full flex items-center justify-center mb-space-xs ' + (achieved ? 'bg-primary-fixed text-primary' : 'bg-surface-container-low text-on-surface-variant') + '"><span class="material-symbols-outlined text-[32px]">' + info.icon + '</span></div>' +
        '<span class="font-label-md text-label-md ' + (isCurrent ? 'text-primary font-bold' : 'text-on-surface') + ' mb-space-xxs">' + info.label + '</span>' +
        '<span class="font-body-sm text-[13px] text-on-surface-variant leading-snug">' + info.desc + '</span>' +
        '<div class="mt-space-sm inline-flex items-center gap-1 text-[12px] ' + (achieved ? 'text-primary' : 'text-on-surface-variant') + '">' +
        '<span class="material-symbols-outlined text-[14px]">' + (achieved ? 'check_circle' : 'lock') + '</span> ' + (achieved ? '已達成' : '尚未到達') +
        '</div></div>';
    }).join('');
  }

  // ============ 靜心呼吸小島 ============
  var breathInterval = null;
  var audioCtx = null, breathOsc = null, breathGain = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function startBreathing() {
    var ring = document.getElementById('breath-ring');
    var text = document.getElementById('breath-text');
    var phase = 'inhale';
    ring.classList.add('inhale');
    text.textContent = '慢慢吸氣……';
    if (soundEnabled) {
      var ctx = ensureAudio();
      breathOsc = ctx.createOscillator();
      breathGain = ctx.createGain();
      breathOsc.type = 'sine';
      breathOsc.frequency.setValueAtTime(196, ctx.currentTime);
      breathGain.gain.setValueAtTime(0, ctx.currentTime);
      breathGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);
      breathOsc.connect(breathGain);
      breathGain.connect(ctx.destination);
      breathOsc.start();
    }
    breathInterval = setInterval(function () {
      if (phase === 'inhale') {
        ring.classList.remove('inhale'); ring.classList.add('exhale');
        text.textContent = '慢慢吐氣……';
        phase = 'exhale';
      } else {
        ring.classList.remove('exhale'); ring.classList.add('inhale');
        text.textContent = '慢慢吸氣……';
        phase = 'inhale';
      }
    }, 4000);
    document.getElementById('breath-start-btn').classList.add('hidden');
    document.getElementById('breath-stop-btn').classList.remove('hidden');
  }

  function stopBreathing() {
    if (breathInterval) { clearInterval(breathInterval); breathInterval = null; }
    if (breathOsc) {
      try {
        var ctx = audioCtx;
        breathGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        (function (osc) { setTimeout(function () { try { osc.stop(); } catch (e) {} }, 350); })(breathOsc);
      } catch (e) {}
      breathOsc = null;
    }
    var ring = document.getElementById('breath-ring');
    if (ring) { ring.classList.remove('inhale', 'exhale'); }
    var text = document.getElementById('breath-text');
    if (text) text.textContent = '準備好了嗎？';
    var startBtn = document.getElementById('breath-start-btn');
    var stopBtn = document.getElementById('breath-stop-btn');
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
  }

  document.getElementById('breath-start-btn').addEventListener('click', startBreathing);
  document.getElementById('breath-stop-btn').addEventListener('click', stopBreathing);

  // ---------- 音效系統（也控制右上角「音效開關」，預設關閉，適合教室情境） ----------
  var soundEnabled = false;

  function playTap() {
    if (!soundEnabled) return;
    var ctx = ensureAudio();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now); osc.stop(now + 0.1);
  }

  function playWater() {
    if (!soundEnabled) return;
    var ctx = ensureAudio();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.18);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now); osc.stop(now + 0.22);
  }

  function playSuccess() {
    if (!soundEnabled) return;
    var ctx = ensureAudio();
    var now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach(function (freq, i) {
      var t = now + i * 0.09;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.35);
    });
  }

  function playWrong() {
    if (!soundEnabled) return;
    var ctx = ensureAudio();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.start(now); osc.stop(now + 0.25);
  }

  // ---------- 角色語助聲＋打字機效果（動物森友會風格：邊打字邊發出可愛短音） ----------
  function charBlip(basePitch) {
    if (!soundEnabled) return;
    var ctx = ensureAudio();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    var pitch = basePitch * (0.94 + Math.random() * 0.12);
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.85, now + 0.06);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.start(now); osc.stop(now + 0.07);
  }

  function hashPitch(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 10000;
    return 340 + (h % 220); // 340~560Hz 之間，讓每個角色聲音略有不同
  }

  // 打字機逐字顯示＋每隔幾個字發出語助音，el 為容器、text 為要顯示的文字
  function typewriterVoice(el, text, basePitch) {
    if (!el) return;
    if (el._typewriterTimer) clearInterval(el._typewriterTimer); // 避免連續切換時，舊的打字機還在跑造成文字疊字
    el.textContent = '';
    var i = 0;
    el._typewriterTimer = setInterval(function () {
      if (i >= text.length) { clearInterval(el._typewriterTimer); el._typewriterTimer = null; return; }
      el.textContent += text[i];
      if (i % 2 === 0 && text[i] !== '，' && text[i] !== '。' && text[i] !== ' ') charBlip(basePitch);
      i++;
    }, 45);
  }

  var REACTION_LINES = ['嗨嗨！', '一起加油！', '咻咻咻～', '今天也要開心喔！', '抱抱～', '嘿嘿嘿', '呼呼～', '要不要一起玩？'];
  var RESIDENT_GREETINGS = ['嗨，很高興見到你！', '今天心情還好嗎？', '要不要一起深呼吸？', '你今天也很棒喔！', '謝謝你來看我～', '一起加油吧！', '你是我的好朋友！', '記得也要照顧自己喔！'];

  function spawnSparkles(container) {
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('span');
      s.className = 'char-sparkle';
      s.textContent = '✨';
      s.style.left = '50%';
      s.style.top = '50%';
      s.style.fontSize = (10 + Math.random() * 10) + 'px';
      var angle = Math.random() * Math.PI * 2;
      var dist = 30 + Math.random() * 30;
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      container.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 720); })(s);
    }
  }

  // 幫任何角色圖片（.char-portrait）加上「點一下就有反應」：Q 彈跳動＋語助音＋隨機可愛台詞泡泡
  function makeCharacterInteractive(imgEl, voicePitch) {
    if (!imgEl || imgEl.dataset.charBound) return;
    imgEl.dataset.charBound = '1';
    imgEl.classList.add('char-portrait');
    var wrapper = imgEl.parentElement;
    if (wrapper && getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';
    imgEl.addEventListener('click', function (e) {
      e.stopPropagation();
      imgEl.classList.remove('char-tap-fx');
      void imgEl.offsetWidth; // 強制 reflow 讓動畫可以重新觸發
      imgEl.classList.add('char-tap-fx');
      charBlip(voicePitch || 440);
      setTimeout(function () { charBlip((voicePitch || 440) * 1.15); }, 90);
      if (wrapper) {
        spawnSparkles(wrapper);
        var bubble = document.createElement('div');
        bubble.className = 'char-speech-bubble';
        bubble.textContent = REACTION_LINES[Math.floor(Math.random() * REACTION_LINES.length)];
        wrapper.appendChild(bubble);
        setTimeout(function () { bubble.remove(); }, 1400);
      }
    });
  }

  // 觸控回饋：任何按鈕點擊都給一個小小的漣漪 + 音效
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button, a.nav-link, a.nav-link-mobile, a[data-view="jump"]');
    if (!btn) return;
    playTap();
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    var size = Math.max(rect.width, rect.height) * 0.9;
    ripple.className = 'tap-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = ((e.clientX - rect.left) - size / 2) + 'px';
    ripple.style.top = ((e.clientY - rect.top) - size / 2) + 'px';
    ripple.style.opacity = '0.25';
    var cs = getComputedStyle(btn);
    if (cs.position === 'static') btn.style.position = 'relative';
    btn.style.overflow = btn.style.overflow || 'hidden';
    btn.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 500);
  }, true);

  // 右上角「音效開關」：控制所有 UI 音效 + 靜心呼吸小島的環境音
  document.getElementById('ambient-toggle-btn').addEventListener('click', function () {
    var icon = document.getElementById('ambient-toggle-icon');
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      ensureAudio();
      icon.textContent = 'volume_up';
      playTap();
    } else {
      if (breathOsc) {
        var ctx2 = audioCtx;
        breathGain.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.3);
        (function (osc) { setTimeout(function () { try { osc.stop(); } catch (e) {} }, 350); })(breathOsc);
        breathOsc = null;
      }
      icon.textContent = 'volume_off';
    }
  });

  // ============ 智慧圖書館 ============
  var libInitialized = false;
  var FRUITS = [
    { id: 'durian', img: 'assets/fruits/durian.png', emotion: '生氣', short: '生氣 · 榴槤寶', icon: 'park', role: '界線守護者', roleIcon: 'shield',
      name: '刺刺蓮寶 · 榴槤守護精靈', slogan: '「生氣不是壞脾氣，而是保護柔軟內心的尖刺外殼！」',
      desc: '外殼長滿尖刺，像在警告外界『不要靠近我』。這層充滿防備的硬刺，其實是為了守護內部極度柔軟的果肉——當底線被侵犯時，為了保護脆弱自尊而豎起防衛小鎧甲。',
      need: '「尊重、公平與界線」', needDesc: '我不是故意要大發雷霆，我只是希望自己的原則被認真看待，渴望被尊重、被平等溫柔地對待。',
      inner: '「我感覺自己的底線被侵犯了，我需要你尊重並認真看待我。」', innerNote: '★ 標註：當榴槤精靈豎起尖刺時，這是內心發出的最真實呼求。',
      wisdom: '「刺是用來立界線，不是用來扎傷人」', wisdomDesc: '就像榴槤的尖刺，是為了守護珍貴柔軟的果肉。我們學會溫和而堅定地說出自己的界線，不刺傷他人，也能護住自己。',
      brainTitle: '大腦小知識：杏仁核警鈴', brainDesc: '當感覺底線受侵犯時，大腦小衛兵「杏仁核」會敲響警鑼，讓身體瞬間充滿警備能量。這是完全健康且正常的自我保護生理信號！',
      spells: [
        { t: '清晰說出界線：', s: '「當你這樣做時，我感到很生氣，因為我需要被尊重。請你現在停止這樣做。」', n: '適合場景：朋友沒問過就拿走你的文具、或開玩笑超過分寸時。' },
        { t: '暫停給予冷靜空間：', s: '「我現在心裡的火球很大，我需要先去平靜角落做 3 次深呼吸，等我平靜後再談。」', n: '適合場景：感覺自己快要忍不住想吼叫或摔東西時。' },
        { t: '尋求公平合作：', s: '「我希望能一起找到公平的解決辦法，而不是互相指責大聲吼叫。」', n: '適合場景：玩遊戲規則起爭執，或分工合作意見不合時。' }
      ] },
    { id: 'coconut', img: 'assets/fruits/coconut.png', emotion: '冷漠', short: '冷漠 · 椰子寶', icon: 'security', role: '心靈防空洞', roleIcon: 'security',
      name: '靜靜椰寶 · 椰子守護精靈', slogan: '「厚殼不是拒絕愛，是給心靈一個安靜修復的防空洞！」',
      desc: '外表包裹著厚重堅硬的殼，敲打時難以得到回應。看似與外界徹底隔絕、毫不在乎，但只要有耐心剖開硬殼，裡面其實藏著純淨豐富的水分，代表著為了自我保護而需要的安全空間。',
      need: '「空間、安全感與自我保護」', needDesc: '外面的聲音與刺激太多了，我需要暫時退回堅硬的外殼裡，給自己一段不被打擾的寧靜時光來平復心情。',
      inner: '「現在的狀況讓我無法負荷，我需要拉開距離來保護自己不受傷。」', innerNote: '★ 標註：冷淡並不是討厭你，而是心靈能量不足時的充電模式。',
      wisdom: '「厚殼不是拒絕愛，是給心靈一個安靜修復的防空洞」', wisdomDesc: '允許自己有縮回硬殼的權利。等水分蓄滿、力量恢復了，就會再次微笑探出頭來。',
      brainTitle: '大腦小知識：心理自我防禦機制', brainDesc: '當外在壓力超負荷時，大腦神經會啟動「暫停感知保護膜」，避免心靈被過度刺激壓垮，這是一種自然的自我修復調節。',
      spells: [
        { t: '溫和表達需要暫停：', s: '「我現在需要一點安靜時間，我想自己坐在這裡看會書。」', n: '適合場景：被許多人圍著問問題，感到不知所措甚至想逃跑時。' },
        { t: '給出預計回歸時間：', s: '「請給我半小時沉澱一下，等我平靜放鬆後再來找你。」', n: '適合場景：大人或同學急著找你討論，而你心裡還很混亂時。' },
        { t: '真誠說明並非針對：', s: '「我不是不在乎你，我只是現在需要整理自己的情緒。」', n: '適合場景：朋友誤以為你在生他的氣、不理他時。' }
      ] },
    { id: 'strawberry', img: 'assets/fruits/strawberry.png', emotion: '害怕', short: '害怕 · 草莓寶', icon: 'spa', role: '敏感小天線', roleIcon: 'spa',
      name: '莓莓怯寶 · 草莓守護精靈', slogan: '「承認害怕是勇敢的第一步，柔軟的心值得被溫柔抱抱！」',
      desc: '沒有任何堅硬的外皮保護，果肉直接外露且極度脆弱，稍微遇到碰撞或擠壓就會受傷。象徵著失去掌控感與預測能力時，那種亟需柔軟環境與安全感包覆的狀態。',
      need: '「安全感、可預測性與保護」', needDesc: '我面對陌生和未知時會心跳好快，我需要確定的安全環境、熟悉的陪伴，以及溫柔的鼓勵支持。',
      inner: '「這個情況超出了我的掌控，我需要確認環境是安全的。」', innerNote: '★ 標註：害怕是天生的小雷達，提醒我們要小心謹慎、尋找依靠。',
      wisdom: '「承認害怕是勇敢的第一步，柔軟的心值得被溫柔抱抱」', wisdomDesc: '即使外表脆弱像草莓，只要找到願意托住你的柔軟果盤，就能安全且安心地散發出甜美香氣。',
      brainTitle: '大腦小知識：恐懼與預測迴路', brainDesc: '當大腦預測不到下一步會發生什麼時，會本能地讓肌肉繃緊。這時溫暖的肢體接觸能迅速帶來安心感！',
      spells: [
        { t: '說出自己的不確定感：', s: '「我對接下來要做的事感到不安，心裡噗通噗通跳得好快。」', n: '適合場景：即將上台發言、進入新班級或嘗試新事物時。' },
        { t: '請求實體陪伴支援：', s: '「你可以牽著我的手，或是陪我一起走過去嗎？」', n: '適合場景：走進昏暗房間、去看牙醫或面對不熟悉的人事物時。' },
        { t: '請求具體清晰的步驟：', s: '「請告訴我接下來會發生什麼事，這樣我就能準備好了。」', n: '適合場景：行程臨時變動或不知道接下來該做什麼時。' }
      ] },
    { id: 'passionfruit', img: 'assets/fruits/passionfruit.png', emotion: '焦慮', short: '焦慮 · 百香果寶', icon: 'cyclone', role: '未來預警機', roleIcon: 'cyclone',
      name: '果果思寶 · 百香果守護精靈', slogan: '「思緒像百香果籽一樣多，一顆一顆理清就不慌了！」',
      desc: '外皮會隨著時間漸漸緊繃、皺縮，切開後裡面是密密麻麻、彼此糾結不清的籽與酸汁。就像面對未知與失控時，腦中紛亂無序、急需理出頭緒的思緒。',
      need: '「確定感、秩序與掌控感」', needDesc: '腦海裡有幾千個『萬一』在打轉，我需要把事情拆解成一小步一小步，重拾心裡的秩序感。',
      inner: '「面對未知我感到很慌亂，我需要一些明確的資訊或計畫來讓我安心。」', innerNote: '★ 標註：皺縮的外皮下，藏著希望把事情做好的認真與責任心。',
      wisdom: '「思緒像百香果籽一樣多，一顆一顆理清就不慌了」', wisdomDesc: '焦慮代表你很在意未來的結果。把無形的擔心寫在紙上，變成看得見的步驟，力量就回來了。',
      brainTitle: '大腦小知識：工作記憶過載', brainDesc: '當我們同時擔憂太多事情時，大腦的「暫存空間」會被塞爆。拿筆寫下來能立刻為大腦釋放暫存記憶體！',
      spells: [
        { t: '具象化混亂的思緒：', s: '「我的腦袋像百香果籽一樣打了結，我需要列張清單把事情寫下來。」', n: '適合場景：考試前夕、功課很多或明天有很多計畫時。' },
        { t: '設定微小行動第一步：', s: '「我們可以一步一步慢慢來嗎？我們先只做第一件小事。」', n: '適合場景：感覺挑戰太大不知從何下手而發慌時。' },
        { t: '理性沙盤推演預案：', s: '「如果發生最壞的情況，我們有什麼應對辦法呢？」', n: '適合場景：一直反覆擔心特定意外狀況發生時。' }
      ] },
    { id: 'watermelon', img: 'assets/fruits/watermelon.png', emotion: '快樂', short: '快樂 · 西瓜寶', icon: 'mood', role: '陽光分享大使', roleIcon: 'mood',
      name: '瓜瓜樂寶 · 西瓜守護精靈', slogan: '「飽滿的甜美，分享給夥伴會變成雙倍的陽光！」',
      desc: '體積飽滿、色彩鮮豔且富含水分，切開時散發出一種暢快、豐盛且適合分享的氛圍。代表著內心渴望的連結與成就感都被充分滿足時，那種開闊且有價值的身心狀態。',
      need: '「連結、成就感與自我實現」', needDesc: '我體驗到了前所未有的滿足與喜悅，非常渴望將這份豐盛的美好傳遞給身邊重視的人！',
      inner: '「我渴望的事物得到了滿足，我感覺自己是有價值的、被愛的。」', innerNote: '★ 標註：西瓜清甜多汁，讓心靈的花園開滿燦爛的花朵。',
      wisdom: '「飽滿的甜美，分享給夥伴會變成雙倍的陽光」', wisdomDesc: '快樂不只是自己的歡呼，當我們把快樂當作甘露澆灌周遭，花園裡的每一棵植物都會跟著發光。',
      brainTitle: '大腦小知識：多巴胺與內啡肽', brainDesc: '當目標達成或與人產生深刻連結時，大腦會釋放多巴胺與內啡肽，帶來神清氣爽的滿足感。',
      spells: [
        { t: '大聲認可自己：', s: '「今天終於做到了這件事，我心裡好有成就感、好開心！」', n: '適合場景：克服難關、做出一件心愛作品或挑戰成功時。' },
        { t: '邀請好友共享喜悅：', s: '「這份好心情我想跟你們一起慶祝，我們一起去玩吧！」', n: '適合場景：有好消息想和好朋友或家人分享時。' },
        { t: '表達真摯的感謝：', s: '「謝謝你們陪我一起完成這項挑戰，有你們在太棒了！」', n: '適合場景：團隊獲勝、合作完成勞作或得到大家幫忙時。' }
      ] },
    { id: 'lemon', img: 'assets/fruits/lemon.png', emotion: '難過', short: '難過 · 檸檬寶', icon: 'water_drop', role: '心靈療癒泉', roleIcon: 'water_drop',
      name: '檬檬酸寶 · 檸檬守護精靈', slogan: '「酸澀是一杯檸檬水，加點同理的溫水就能化為甘甜！」',
      desc: '充滿強烈的酸澀感，單獨品嚐時會讓人忍不住皺眉甚至泛淚。但只要願意加入一點溫水與糖分，就能化解刺骨的酸，轉化為滋潤身心的養分。',
      need: '「安慰、陪伴、同理與接納」', needDesc: '我現在心裡沉甸甸又酸酸的，不需要大道理，只需要你坐在我身邊，陪著我一起接納這份失落。',
      inner: '「我失去了一些重要的東西或受了傷，我需要被溫柔地理解與接住。」', innerNote: '★ 標註：眼淚不是脆弱，眼淚是釋放壓力的清泉。',
      wisdom: '「酸澀是一杯檸檬水，加點同理的溫水就能化為甘甜」', wisdomDesc: '每一顆檸檬都是成長的提味劑。歷經悲傷後的溫柔與同理心，會讓你成為更懂得體貼他人的心靈園丁。',
      brainTitle: '大腦小知識：情緒排毒', brainDesc: '因情緒哭泣流出的眼淚，能幫助釋放壓力荷爾蒙。哭泣後深呼吸，身體會重新放鬆下來。',
      spells: [
        { t: '坦誠說出脆弱與渴望：', s: '「我現在心裡酸酸的好難受，你能給我一個溫暖的擁抱嗎？」', n: '適合場景：失去心愛的玩具、寵物離開或與好友鬧彆扭時。' },
        { t: '請求無聲的安靜陪伴：', s: '「請靜靜陪我坐一下，只要聽我說說話就好，不需要急著解決。」', n: '適合場景：心情極度低落，不想聽說教或大道理時。' },
        { t: '表達這件事對自己的重要性：', s: '「我受傷了，因為這件事對我來說真的很重要、很有意義。」', n: '適合場景：努力很久卻沒得到好成績、心血被忽視時。' }
      ] },
    { id: 'greenapple', img: 'assets/fruits/greenapple.png', emotion: '嫉妒', short: '嫉妒 · 青蘋果寶', icon: 'nature', role: '潛力尋寶官', roleIcon: 'nature',
      name: '青青果寶 · 青蘋果守護精靈', slogan: '「青綠也有青綠的脆甜，每顆蘋果都有自己成熟的花期！」',
      desc: '外表帶著未成熟的青綠色，口感酸中帶澀。看著別人的鮮紅與甜美，內心產生了拉扯，背後其實是渴望確認自我價值，期盼自己也能被看見、被重視。',
      need: '「自我價值、安全感與被重視」', needDesc: '我也好想成為大家眼中的焦點，害怕自己被忽視或比下去，渴望確認自己的獨特光芒也是重要的。',
      inner: '「我害怕自己不夠好、擔心被取代，我渴望確認自己是獨特且重要的。」', innerNote: '★ 標註：嫉妒就像一面鏡子，照出你心底其實有多麼想成為更好的自己。',
      wisdom: '「青綠也有青綠的脆甜，每顆蘋果都有自己成熟的花期」', wisdomDesc: '不必羨慕紅蘋果的早熟，青蘋果爽脆清新也有專屬風味。把看著別人的目光轉回自己，開始為自己澆水！',
      brainTitle: '大腦小知識：社會比較', brainDesc: '人類是群居生物，比較時大腦會發出痛感信號。把「競爭思維」轉為「欣賞學習」，能重新啟動成長心態！',
      spells: [
        { t: '勇敢承認渴望被看見：', s: '「看到他表現那麼亮眼，我也好想被看見、被真誠地稱讚。」', n: '適合場景：看到同學得獎、受到大人讚許而心裡酸酸時。' },
        { t: '肯定自我專屬亮點：', s: '「我雖然這方面還在練習，但我也擁有自己獨特的優點與專長！」', n: '適合場景：覺得自己似乎樣樣都不如別人的自我懷疑時刻。' },
        { t: '轉化為向他人學習的動力：', s: '「我願意向他的長處請教學習，同時也給自己的努力拍拍手！」', n: '適合場景：想打破嫉妒的彆扭，與優秀夥伴建立友好關係時。' }
      ] },
    { id: 'grapefruit', img: 'assets/fruits/grapefruit.png', emotion: '委屈', short: '委屈 · 葡萄柚寶', icon: 'balance', role: '真理公道伯', roleIcon: 'balance',
      name: '柚柚甘寶 · 葡萄柚守護精靈', slogan: '「微苦是希望被懂的信號，說出真相才能讓甘甜浮現！」',
      desc: '外表看起來像是一般甜美多汁的柑橘，但一口咬下卻帶著難以言喻的微苦與澀味。就像明明抱持著善意與努力，卻沒有被公平對待或理解，渴望別人能看見全貌的苦悶。',
      need: '「被理解、公平與認同」', needDesc: '我的好意被曲解了、我的努力被忽略了，我需要一個公平的機會，把真實的過程完整說清楚。',
      inner: '「我的善意或努力被誤解了，我非常渴望你能看見事情的全貌並懂我。」', innerNote: '★ 標註：含著眼淚吞下的微苦，其實是一顆想要被認真珍惜的心。',
      wisdom: '「微苦是希望被懂的信號，說出真相才能讓甘甜浮現」', wisdomDesc: '葡萄柚的苦味是果皮天然的精油。勇敢把事情的始末說出來，心中的苦澀就會化成清爽回甘。',
      brainTitle: '大腦小知識：公平感知', brainDesc: '大腦負責感知不公平與痛苦的區域，在遭遇誤會時會亮起強烈信號，這時平等的溝通是唯一的解藥！',
      spells: [
        { t: '請求還原事實全貌：', s: '「這件事的真實經過其實是這樣，希望你能撥出時間聽我說完。」', n: '適合場景：被老師或家長誤會打破東西、或者被同學冤枉時。' },
        { t: '澄清自己的真實初衷：', s: '「我真的不是故意那樣做的，請相信我最初的出發點是想幫忙。」', n: '適合場景：幫忙卻不小心幫倒忙，反而被責備時。' },
        { t: '溫和要求公平溝通機制：', s: '「我感覺自己受到了不公平的對待，希望能有平等的機會好好釐清。」', n: '適合場景：規則被隨意更改，或是雙方責任被偏頗認定時。' }
      ] },
    { id: 'peach', img: 'assets/fruits/peach.png', emotion: '得意', short: '得意 · 水蜜桃寶', icon: 'stars', role: '自信發光星', roleIcon: 'stars',
      name: '桃桃甜寶 · 水蜜桃守護精靈', slogan: '「自信綻放像水蜜桃香氣，坦蕩接受掌聲也是一種健康的力量！」',
      desc: '色澤粉嫩耀眼、香氣四溢，高調且毫無保留地散發著甜美的氣息。象徵著能力與成就被看見時，那種充滿自信、期待獲得眾人讚賞與掌聲的飽滿模樣。',
      need: '「肯定、讚賞與能力展現」', needDesc: '我付出了很多汗水才完成這項成果，我想大方地享受榮耀，並期待聽到大家的肯定與掌聲！',
      inner: '「我做到了！我希望我的能力與貢獻能被大家看見並給予掌聲。」', innerNote: '★ 標註：健康自信不是驕傲自滿，而是對自己實力與努力的全然認可。',
      wisdom: '「自信綻放像水蜜桃香氣，坦蕩接受掌聲也是一種健康的力量」', wisdomDesc: '香氣不必刻意隱藏，接受別人的讚美並大聲說謝謝，是自信花園裡最迷人的一抹芬芳。',
      brainTitle: '大腦小知識：勝任感', brainDesc: '心理學指出，體驗到勝任感能讓大腦建構強大心理韌性，在未來面對難題時更有勇氣！',
      spells: [
        { t: '大方肯定自我努力：', s: '「我在這項任務中克服了好多困難，我真的為自己的堅持感到驕傲！」', n: '適合場景：練了很久的樂器終於彈好、背下很難的課文時。' },
        { t: '坦然接受並邀請掌聲：', s: '「請為我的努力拍拍手鼓勵！謝謝你們一直為我加油！」', n: '適合場景：比賽得獎、發表結束接受眾人目光時。' },
        { t: '累積自我效能感：', s: '「這次成功的經驗讓我相信，下次遇到全新挑戰我也能發揮實力！」', n: '適合場景：完成一項大工程後，準備邁向下一個目標時。' }
      ] }
  ];

  function selectFruit(id) {
    var f = FRUITS.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    document.getElementById('lib-current-tag').textContent = '目前探索：' + f.short;
    document.getElementById('lib-role-text').textContent = f.role;
    document.getElementById('lib-spirit-icon').outerHTML = '<img id="lib-spirit-icon" src="' + f.img + '" alt="' + f.name + '" class="w-full h-full object-contain drop-shadow-md" />';
    document.getElementById('lib-spirit-name').textContent = f.name;
    document.getElementById('lib-slogan').textContent = f.slogan;
    document.getElementById('lib-description').textContent = f.desc;
    document.getElementById('lib-brain-title').textContent = f.brainTitle;
    document.getElementById('lib-brain-desc').textContent = f.brainDesc;
    document.getElementById('lib-need-title').textContent = f.need;
    document.getElementById('lib-need-desc').textContent = f.needDesc;
    document.getElementById('lib-innervoice-title').textContent = f.inner;
    document.getElementById('lib-innervoice-note').textContent = f.innerNote;
    document.getElementById('lib-wisdom-title').textContent = f.wisdom;
    document.getElementById('lib-wisdom-desc').textContent = f.wisdomDesc;
    document.getElementById('lib-magic-title').textContent = '當我' + f.emotion + '時：表達需要的 3 句魔法咒語';
    document.getElementById('lib-magic-list').innerHTML = f.spells.map(function (s, i) {
      return '<div class="bg-surface-container-lowest p-space-md rounded-lg shadow-xs">' +
        '<div class="flex items-start gap-space-sm">' +
        '<span class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold shrink-0">' + (i + 1) + '</span>' +
        '<div class="space-y-space-xxs">' +
        '<span class="font-label-sm text-label-sm text-on-surface-variant font-bold">' + s.t + '</span>' +
        '<p class="font-body-md text-body-md text-on-surface font-semibold">' + s.s + '</p>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant">' + s.n + '</p>' +
        '</div></div></div>';
    }).join('');

    document.querySelectorAll('.lib-tab-btn').forEach(function (btn) {
      var active = btn.dataset.id === id;
      btn.classList.toggle('bg-primary', active);
      btn.classList.toggle('text-on-primary', active);
      btn.classList.toggle('shadow-md', active);
      btn.classList.toggle('bg-surface-container-low', !active);
      btn.classList.toggle('text-on-surface', !active);
    });
  }

  function initLibrary() {
    libInitialized = true;
    var tabs = document.getElementById('lib-fruit-tabs');
    tabs.innerHTML = FRUITS.map(function (f, i) {
      return '<button type="button" data-id="' + f.id + '" class="lib-tab-btn flex flex-col items-center p-space-xs rounded-xl transition-all duration-200 text-center ' +
        (i === 0 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-low text-on-surface') + '">' +
        '<img src="' + f.img + '" alt="" class="w-9 h-9 rounded-full object-cover shadow-sm" />' +
        '<span class="font-label-sm text-label-sm font-bold leading-tight mt-space-xxs">' + f.short.split(' · ')[1] + '</span>' +
        '<span class="text-[12px] opacity-80">' + f.emotion + '</span>' +
        '</button>';
    }).join('');
    tabs.querySelectorAll('.lib-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { selectFruit(btn.dataset.id); });
    });
    selectFruit(FRUITS[0].id);
  }

  // ============ 叢林冒險（滿版沉浸式，文字僅作輔助，降低認知負荷） ============
  // 三大單元：處己(自我覺察) → 處人(人際互動) → 處環境(環境適應)，各自對應不同的互動設計
  var jungleInitialized = false;
  var jungleStep = 'entrance'; // 'entrance' | 0..N-1 | 'done'
  var jungleAnswered = false;

  var UNITS = {
    self: { name: '處己', sub: '覺察自己的身體訊號', icon: '🧠', tint: 'bg-primary/30', prompt: '他現在的身體感覺是？' },
    social: { name: '處人', sub: '選出最好的回應', icon: '🤝', tint: 'bg-secondary/30', prompt: '你會怎麼回應？' },
    env: { name: '處環境', sub: '找到平靜的策略', icon: '🌿', tint: 'bg-tertiary/30', prompt: '這時候可以怎麼做？' }
  };

  var SCENARIOS = [
    { unit: 'self', emoji: '📄', scene: '考卷發回來了，分數比想的低。',
      // panels：示範用「翻頁看四格漫畫」的佔位版面，之後可換成 Stitch 畫的真實分鏡圖
      panels: [
        { emoji: '🏫', caption: '下課鐘聲響了，老師開始發考卷。' },
        { emoji: '📄', caption: '拿到考卷，分數比想的低很多。' },
        { emoji: '💓', caption: '心跳突然變快，手心也濕濕的。' }
      ],
      options: [
        { emoji: '💓', label: '心跳變快', correct: true, feedback: '沒錯！這是緊張的身體訊號 💛' },
        { emoji: '🥱', label: '想打哈欠', correct: false, feedback: '再想想，這種時候身體通常會…' }
      ] },
    { unit: 'self', emoji: '📓', scene: '忘記帶作業了，快上課了。',
      options: [
        { emoji: '😟', label: '肚子緊緊的', correct: true, feedback: '對，緊張時肚子常會緊緊的！' },
        { emoji: '🕺', label: '想跳舞', correct: false, feedback: '再想想，這時候的身體感覺是…' }
      ] },
    { unit: 'social', emoji: '🛝', scene: '同學一直霸占鞦韆不讓你玩。',
      options: [
        { emoji: '🙂', label: '我們輪流玩好嗎？', correct: true, feedback: '很棒！說出來，大家都能玩到 🌟' },
        { emoji: '😤', label: '你很自私耶！', correct: false, feedback: '這樣說可能會吵起來，再想想？' }
      ] },
    { unit: 'social', emoji: '📋', scene: '分組報告，同學都不幫忙。',
      options: [
        { emoji: '🙂', label: '你需要幫忙嗎？', correct: true, feedback: '關心對方，事情更容易一起解決！' },
        { emoji: '😠', label: '隨便你，爛透了', correct: false, feedback: '這樣說會傷感情，再想想？' }
      ] },
    { unit: 'env', emoji: '🎪', scene: '園遊會好吵好擠，頭有點暈。',
      options: [
        { emoji: '🧘', label: '找安靜角落深呼吸', correct: true, feedback: '你照顧了自己，超棒的決定！✨' },
        { emoji: '📢', label: '摀耳朵大叫', correct: false, feedback: '大叫會更累喔，試試安靜角落？' }
      ] },
    { unit: 'env', emoji: '🌧️', scene: '校外教學突然下大雨，行程亂了。',
      options: [
        { emoji: '🌬️', label: '深呼吸，調整心情', correct: true, feedback: '計畫變動也沒關係，你做得很好！' },
        { emoji: '😡', label: '生氣一直抱怨', correct: false, feedback: '抱怨改變不了天氣，試試深呼吸？' }
      ] }
  ];

  function renderJungleDots() {
    var dots = document.getElementById('jungle-progress-dots');
    if (jungleStep === 'entrance') { dots.innerHTML = ''; return; }
    dots.innerHTML = SCENARIOS.map(function (_, i) {
      var state = jungleStep === 'done' ? 'done' : (i < jungleStep ? 'done' : (i === jungleStep ? 'current' : 'todo'));
      var cls = state === 'done' ? 'bg-white w-2.5 h-2.5' : state === 'current' ? 'bg-white w-6 h-2.5' : 'bg-white/40 w-2.5 h-2.5';
      return '<span class="rounded-full transition-all ' + cls + '"></span>';
    }).join('');
  }

  function setJungleTint(cls) {
    var tint = document.getElementById('jungle-tint');
    tint.className = 'absolute inset-0 ' + (cls || '');
  }

  var jungleUnitIntroShownFor = null;

  function renderUnitIntro(unitKey, onContinue) {
    var u = UNITS[unitKey];
    setJungleTint(u.tint);
    document.getElementById('jungle-content').innerHTML =
      '<div class="text-[64px] leading-none drop-shadow-lg">' + u.icon + '</div>' +
      '<h1 class="font-headline-lg text-headline-lg text-white drop-shadow-lg">' + u.name + '</h1>' +
      '<p class="font-body-md text-body-md text-white/90 drop-shadow">' + u.sub + '</p>' +
      '<button type="button" id="jungle-unit-continue-btn" class="mt-space-sm px-space-xl h-16 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-2xl active:translate-y-1 transition-all flex items-center gap-space-xs">' +
      '<span>進入關卡</span><span class="material-symbols-outlined text-[22px]">arrow_forward</span></button>';
    document.getElementById('jungle-unit-continue-btn').addEventListener('click', onContinue);
  }

  function renderJungleEntrance() {
    setJungleTint('bg-black/20');
    document.getElementById('jungle-content').innerHTML =
      '<h1 class="font-headline-lg text-headline-lg text-white drop-shadow-lg">叢林冒險</h1>' +
      '<p class="font-body-md text-body-md text-white/90 drop-shadow">選一選，看看會發生什麼！</p>' +
      '<button type="button" id="jungle-enter-btn" class="mt-space-sm px-space-xl h-16 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-2xl active:translate-y-1 transition-all flex items-center gap-space-xs">' +
      '<span>踏入叢林</span><span class="material-symbols-outlined text-[22px]">arrow_forward</span></button>';
    document.getElementById('jungle-enter-btn').addEventListener('click', function () {
      jungleStep = 0;
      jungleAnswered = false;
      renderJungleStep();
    });
  }

  var junglePanelIndex = 0;

  // 佔位版「四格漫畫」翻頁閱讀器：之後把 caption 的 emoji 佔位框換成 Stitch 畫的分鏡圖即可
  function renderJunglePanels(idx) {
    var sc = SCENARIOS[idx];
    var u = UNITS[sc.unit];
    var panel = sc.panels[junglePanelIndex];
    var isLast = junglePanelIndex === sc.panels.length - 1;
    setJungleTint(u.tint);
    document.getElementById('jungle-content').innerHTML =
      '<div class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-white/25 backdrop-blur-sm text-white font-label-sm text-label-sm mb-space-xs">' + u.icon + ' ' + u.name + '</div>' +
      '<button type="button" id="jungle-panel-frame" class="relative w-full max-w-sm aspect-square rounded-2xl border-4 border-white/80 bg-black/25 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center gap-space-sm p-space-lg active:scale-[0.98] transition-all">' +
      '<span class="absolute top-3 left-3 px-space-sm py-0.5 rounded-full bg-white/90 text-on-surface font-label-sm text-label-sm font-bold">' + (junglePanelIndex + 1) + ' / ' + sc.panels.length + '</span>' +
      '<span class="text-[72px] leading-none drop-shadow-lg">' + panel.emoji + '</span>' +
      '<p class="font-headline-sm text-headline-sm text-white drop-shadow-lg text-center">' + panel.caption + '</p>' +
      '<span class="absolute bottom-3 right-3 flex items-center gap-1 text-white/90 font-label-sm text-label-sm">' + (isLast ? '開始回答' : '點一下繼續') + ' <span class="material-symbols-outlined text-[18px]">arrow_forward</span></span>' +
      '</button>';
    document.getElementById('jungle-panel-frame').addEventListener('click', function () {
      if (isLast) {
        renderJungleScenario(idx);
      } else {
        junglePanelIndex += 1;
        renderJunglePanels(idx);
      }
    });
  }

  function pickAssistFairy() {
    var pool = state.unlockedFairies.length ? state.unlockedFairies : ['sunny'];
    var key = pool[Math.floor(Math.random() * pool.length)];
    return MOODS[key];
  }

  function renderJungleScenario(idx, excludedOis) {
    excludedOis = excludedOis || [];
    var sc = SCENARIOS[idx];
    var u = UNITS[sc.unit];
    setJungleTint(u.tint);
    var html = '<div class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-white/25 backdrop-blur-sm text-white font-label-sm text-label-sm mb-space-xs">' + u.icon + ' ' + u.name + '</div>' +
      '<div class="text-[64px] leading-none drop-shadow-lg">' + sc.emoji + '</div>' +
      '<p class="font-headline-sm text-headline-sm text-white drop-shadow-lg max-w-md">' + sc.scene + '</p>' +
      '<p class="font-label-md text-label-md text-white/90 drop-shadow -mt-space-sm">' + u.prompt + '</p>' +
      '<div class="flex flex-col sm:flex-row gap-space-sm w-full max-w-md" id="jungle-options">' +
      sc.options.map(function (o, oi) {
        var isOut = excludedOis.indexOf(oi) !== -1;
        return '<button type="button" data-oi="' + oi + '" ' + (isOut ? 'disabled' : '') + ' class="jungle-opt flex-1 flex flex-col items-center gap-1 px-space-md py-space-md rounded-xl shadow-xl transition-all ' +
          (isOut ? 'bg-white/40 opacity-40 grayscale cursor-not-allowed' : 'bg-white/90 hover:bg-white active:scale-95') + '">' +
          '<span class="text-[36px] leading-none">' + o.emoji + '</span>' +
          '<span class="font-label-md text-label-md text-on-surface">' + o.label + '</span>' +
          (isOut ? '<span class="text-[11px] text-on-surface-variant">✕ 試過了</span>' : '') +
          '</button>';
      }).join('') + '</div>' +
      '<div id="jungle-feedback" class="min-h-[3rem]"></div>';
    document.getElementById('jungle-content').innerHTML = html;
    document.querySelectorAll('.jungle-opt:not(:disabled)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (jungleAnswered) return;
        jungleAnswered = true;
        var oi = parseInt(btn.dataset.oi, 10);
        var choice = sc.options[oi];
        document.querySelectorAll('.jungle-opt').forEach(function (b) { b.classList.add('opacity-50'); });
        btn.classList.remove('opacity-50');
        btn.classList.add('ring-4', choice.correct ? 'ring-primary' : 'ring-secondary');
        if (choice.correct) playSuccess(); else playWrong();
        var fb = document.getElementById('jungle-feedback');

        if (choice.correct) {
          fb.innerHTML = '<div class="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-white/95 shadow-xl">' +
            '<span class="font-label-md text-label-md text-on-surface">' + choice.feedback + '</span></div>' +
            '<div class="mt-space-sm"><button type="button" id="jungle-next-btn" class="px-space-lg h-14 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-xl">' +
            (idx === SCENARIOS.length - 1 ? '完成冒險 🎉' : '下一關 →') + '</button></div>';
          document.getElementById('jungle-next-btn').addEventListener('click', function () {
            if (idx === SCENARIOS.length - 1) { jungleStep = 'done'; } else { jungleStep = idx + 1; }
            jungleAnswered = false;
            renderJungleStep();
          });
        } else {
          // 花仙子組隊出動助攻：排除這個答錯的選項，縮小範圍幫學生再試一次
          var fairy = pickAssistFairy();
          var nextExcluded = excludedOis.concat([oi]);
          fb.innerHTML = '<div class="flex items-center gap-space-sm px-space-md py-space-sm rounded-2xl bg-white/95 shadow-xl text-left max-w-sm mx-auto">' +
            '<img src="' + fairy.fairyImg + '" alt="' + fairy.fairyName + '" class="w-14 h-14 rounded-full object-cover flex-shrink-0 fairy-float" />' +
            '<div><p class="font-label-sm text-label-sm text-primary font-bold">' + fairy.fairyName + ' 飛來幫忙！</p>' +
            '<p class="font-body-sm text-body-sm text-on-surface">' + choice.feedback + '</p></div></div>' +
            '<div class="mt-space-sm"><button type="button" id="jungle-retry-btn" class="px-space-lg h-14 rounded-full bg-white text-on-surface font-label-md text-label-md shadow-xl">🔄 再試一次</button></div>';
          document.getElementById('jungle-retry-btn').addEventListener('click', function () {
            jungleAnswered = false;
            renderJungleScenario(idx, nextExcluded); // 重試只重來選擇題，不重播漫畫
          });
        }
      });
    });
  }

  function renderJungleDone() {
    setJungleTint('bg-primary/30');
    document.getElementById('jungle-content').innerHTML =
      '<div class="text-[64px] leading-none">🏆</div>' +
      '<h1 class="font-headline-lg text-headline-lg text-white drop-shadow-lg">完成叢林冒險！</h1>' +
      '<button type="button" id="jungle-restart-btn" class="mt-space-sm px-space-xl h-16 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-2xl">🔄 再玩一次</button>';
    document.getElementById('jungle-restart-btn').addEventListener('click', function () {
      jungleStep = 0;
      jungleAnswered = false;
      renderJungleStep();
    });
  }

  function enterScenario(idx) {
    junglePanelIndex = 0;
    if (SCENARIOS[idx].panels && SCENARIOS[idx].panels.length) {
      renderJunglePanels(idx);
    } else {
      renderJungleScenario(idx);
    }
  }

  function renderJungleStep() {
    renderJungleDots();
    if (jungleStep === 'entrance') { renderJungleEntrance(); return; }
    if (jungleStep === 'done') { renderJungleDone(); return; }
    var sc = SCENARIOS[jungleStep];
    var isFirstOfUnit = jungleStep === 0 || SCENARIOS[jungleStep - 1].unit !== sc.unit;
    if (isFirstOfUnit && jungleUnitIntroShownFor !== sc.unit) {
      renderUnitIntro(sc.unit, function () {
        jungleUnitIntroShownFor = sc.unit;
        enterScenario(jungleStep);
      });
    } else {
      enterScenario(jungleStep);
    }
  }

  function initJungle() {
    jungleInitialized = true;
    jungleStep = 'entrance';
    jungleUnitIntroShownFor = null;
    renderJungleStep();
  }

  // ---------- 使用者選擇畫面 ----------
  var bootstrapped = false;

  function renderProfileList() {
    var profiles = loadProfiles();
    var list = document.getElementById('profile-list');
    list.innerHTML = profiles.map(function (p) {
      return '<button type="button" data-id="' + p.id + '" class="profile-card flex flex-col items-center gap-space-xs p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm active:scale-95 transition-all">' +
        '<span class="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-[32px]">' + p.avatar + '</span>' +
        '<span class="font-label-md text-label-md text-on-surface">' + escapeHtml(p.name) + '</span>' +
        '</button>';
    }).join('');
    list.querySelectorAll('.profile-card').forEach(function (btn) {
      btn.addEventListener('click', function () { chooseProfile(btn.dataset.id); });
    });
  }

  function renderAvatarPicker() {
    var wrap = document.getElementById('profile-avatar-picker');
    wrap.dataset.selected = AVATAR_CHOICES[0];
    wrap.innerHTML = AVATAR_CHOICES.map(function (a, i) {
      return '<button type="button" data-avatar="' + a + '" class="avatar-choice w-12 h-12 rounded-full flex items-center justify-center text-[24px] transition-all ' +
        (i === 0 ? 'bg-primary-fixed ring-2 ring-primary' : 'bg-surface-container-low') + '">' + a + '</button>';
    }).join('');
    wrap.querySelectorAll('.avatar-choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        wrap.dataset.selected = btn.dataset.avatar;
        wrap.querySelectorAll('.avatar-choice').forEach(function (b) { b.classList.remove('bg-primary-fixed', 'ring-2', 'ring-primary'); b.classList.add('bg-surface-container-low'); });
        btn.classList.remove('bg-surface-container-low'); btn.classList.add('bg-primary-fixed', 'ring-2', 'ring-primary');
      });
    });
  }

  function enterApp(id) {
    activeProfileId = id;
    state = loadState(id);
    setActiveProfileId(id);
    meadowInitialized = false; // 換了使用者，花園居民要換成這位小朋友自己解鎖的仙子
    document.getElementById('profile-gate').hidden = true;
    document.getElementById('app-shell').hidden = false;
    var p = loadProfiles().filter(function (x) { return x.id === id; })[0];
    if (p) {
      document.getElementById('profile-switch-name').textContent = p.name;
      document.getElementById('profile-switch-avatar').textContent = p.avatar;
    }
    if (!bootstrapped) {
      bootstrapped = true;
      initNav();
    } else {
      currentView = null; // 強制重新渲染目前畫面，換上新使用者的資料
      switchView(location.hash.replace('#', '') || 'garden');
    }
    refreshDewBadges();
  }

  function chooseProfile(id) { enterApp(id); }

  document.getElementById('profile-create-btn').addEventListener('click', function () {
    var nameInput = document.getElementById('profile-name-input');
    var name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    var avatar = document.getElementById('profile-avatar-picker').dataset.selected || AVATAR_CHOICES[0];
    var profiles = loadProfiles();
    var id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    profiles.push({ id: id, name: name, avatar: avatar, createdAt: todayStr() });
    saveProfiles(profiles);
    nameInput.value = '';
    chooseProfile(id);
  });

  document.getElementById('profile-switch-btn').addEventListener('click', function () {
    document.getElementById('app-shell').hidden = true;
    document.getElementById('profile-gate').hidden = false;
    renderProfileList();
  });

  // ---------- 啟動 ----------
  window.__switchView = switchView;
  window.addEventListener('hashchange', function () {
    var key = location.hash.replace('#', '') || 'garden';
    switchView(key);
  });

  renderAvatarPicker();
  var initialActiveId = getActiveProfileId();
  var initialProfiles = loadProfiles();
  if (initialActiveId && initialProfiles.some(function (p) { return p.id === initialActiveId; })) {
    enterApp(initialActiveId);
  } else {
    renderProfileList();
  }
})();
