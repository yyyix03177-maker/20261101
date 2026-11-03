// ==========================================
// 樂風探索家：消失的旋律 - 圖鑑文字排版修復版 sketch.js
// ==========================================

let gameState = "START"; 
let currentLevel = 0; 
let score = 0; 
let correctCount = 0; 
let wrongCount = 0; 
let selectedOption = -1; 
let answerSubmitted = false; 

// 音訊變數
let audioFiles = {}; 
let audioLoaded = {}; 
let currentActiveTrack = null; 
let isSynthPlaying = false; 
let synthInterval = null; 

let gameOsc, gameEnv;
let floatingNotes = [];
let confettiParticles = [];
let scanAnimationAngle = 0;

// 原始六大關卡資料庫
const originalLevelsData = [
  {
    id: "classical",
    title: "古典樂（Classical）",
    files: ["assets/classical_1.mp3", "assets/classical_2.mp3"],
    clues: [
      "1. 常見樂器編制：鋼琴、小提琴及大型管弦樂團。",
      "2. 結構嚴謹，具有豐富的聲部堆疊與演奏技巧。",
      "3. 旋律優雅典雅，歷史悠久且富有情緒起伏。"
    ],
    options: ["爵士樂 (Jazz)", "古典樂 (Classical)", "搖滾樂 (Rock)", "流行樂 (Pop)"],
    correctText: "古典樂 (Classical)",
    knowledge: "【古典樂】強調複雜而精密的配器法，常見鋼琴、小提琴與管弦樂團協奏，注重嚴謹結構與聲部和聲。"
  },
  {
    id: "jazz",
    title: "爵士樂（Jazz）",
    files: ["assets/jazz_1.mp3", "assets/jazz_2.mp3"],
    clues: [
      "1. 常見樂器：薩克斯風、鋼琴、低音提琴與爵士鼓。",
      "2. 具有強烈的即興演奏（Improvisation）精神。",
      "3. 節奏具有切分音與獨特的搖擺感（Swing）。"
    ],
    options: ["嘻哈 (Hip-hop)", "電子音樂 (Electronic)", "爵士樂 (Jazz)", "古典樂 (Classical)"],
    correctText: "爵士樂 (Jazz)",
    knowledge: "【爵士樂】起源於紐奧良，強調音樂家現場即興發揮、切分節奏（Syncopation）與搖擺樂風（Swing）。"
  },
  {
    id: "rock",
    title: "搖滾樂（Rock）",
    files: ["assets/rock_1.mp3", "assets/rock_2.mp3"],
    clues: [
      "1. 核心樂器：電吉他、電貝斯、爵士鼓與強烈人聲。",
      "2. 節奏鮮明強烈，充滿爆發力與能量。",
      "3. 常採用四四拍強烈重音與破音吉他音效。"
    ],
    options: ["搖滾樂 (Rock)", "流行樂 (Pop)", "爵士樂 (Jazz)", "電子音樂 (Electronic)"],
    correctText: "搖滾樂 (Rock)",
    knowledge: "【搖滾樂】發展於 1950 年代，以電吉他破音（Overdrive）與強勁重拍為核心，展現強烈情緒與個人風格。"
  },
  {
    id: "pop",
    title: "流行樂（Pop）",
    files: ["assets/pop_1.mp3", "assets/pop_2.mp3"],
    clues: [
      "1. 旋律洗腦親切，易於大眾哼唱與記憶。",
      "2. 具有明確的主歌（Verse）與副歌（Chorus）結構。",
      "3. 融合多元樂器與電子錄音技術，具廣泛傳播性。"
    ],
    options: ["古典樂 (Classical)", "流行樂 (Pop)", "嘻哈 (Hip-hop)", "搖滾樂 (Rock)"],
    correctText: "流行樂 (Pop)",
    knowledge: "【流行樂】為廣泛商業傳播而設計，結構通常包含前奏、主歌、副歌與過門，著重於動聽且記憶點極高的旋律。"
  },
  {
    id: "hiphop",
    title: "嘻哈（Hip-hop）",
    files: ["assets/hiphop_1.mp3", "assets/hiphop_2.mp3"],
    clues: [
      "1. 特色元素：節奏饒舌（Rap）、人聲節奏口技（Beatbox）。",
      "2. 常使用經典樂曲取樣（Sampling）與刮盤（Scratch）。",
      "3. 低音重拍節奏感極強，展現街頭文化。"
    ],
    options: ["爵士樂 (Jazz)", "電子音樂 (Electronic)", "嘻哈 (Hip-hop)", "流行樂 (Pop)"],
    correctText: "嘻哈 (Hip-hop)",
    knowledge: "【嘻哈】源自紐約布朗克斯區，結合饒舌、DJ 取樣節拍、街舞與塗鴉，是強烈展現節奏與韻律的文化音樂。"
  },
  {
    id: "electronic",
    title: "電子音樂（Electronic）",
    files: ["assets/electronic_1.mp3", "assets/electronic_2.mp3"],
    clues: [
      "1. 使用樂器：電子合成器（Synthesizer）、數位音效處理。",
      "2. 採用電腦編曲與電子節拍機產生的精確節奏。",
      "3. 充滿未來感音色與規律重複的舞曲動感。"
    ],
    options: ["電子音樂 (Electronic)", "搖滾樂 (Rock)", "古典樂 (Classical)", "嘻哈 (Hip-hop)"],
    correctText: "電子音樂 (Electronic)",
    knowledge: "【電子音樂】利用電子樂器與數位音訊工作站（DAW）創作，運用各式合成器、濾波器與效果器營造多變音色。"
  }
];

let levelsData = []; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");

  gameEnv = new p5.Envelope();
  gameEnv.setADSR(0.01, 0.1, 0.2, 0.3);
  gameEnv.setRange(0.5, 0.0);
  gameOsc = new p5.Oscillator('sine');
  gameOsc.amp(gameEnv);

  for (let lvl of originalLevelsData) {
    audioFiles[lvl.id] = [];
    audioLoaded[lvl.id] = false;
    for (let filePath of lvl.files) {
      let snd = loadSound(filePath, () => { audioLoaded[lvl.id] = true; }, () => {});
      audioFiles[lvl.id].push(snd);
    }
  }

  for (let i = 0; i < 25; i++) {
    floatingNotes.push({
      x: random(width), y: random(height),
      size: random(18, 36), speedY: random(0.5, 1.5),
      symbol: random(["♪", "♫", "♩", "♬"]), alpha: random(80, 180)
    });
  }

  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x: random(width), y: random(-height, 0),
      size: random(8, 14), speedY: random(2, 5), speedX: random(-1, 1),
      color: color(random(150, 255), random(150, 255), random(150, 255))
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(235, 243, 246);

  switch (gameState) {
    case "START": drawStartScreen(); break;
    case "INTRO": drawIntroScreen(); break;
    case "PLAY":
    case "FEEDBACK": drawGameScreen(); break;
    case "RESULT": drawResultScreen(); break;
    case "ENCYCLOPEDIA": drawEncyclopediaScreen(); break;
  }
}

function playSFX(type) {
  try {
    userStartAudio();
    gameOsc.stop();
    if (type === "START") {
      gameOsc.setType('sine'); gameOsc.freq(300); gameOsc.start(); gameEnv.play(); gameOsc.freq(600, 0.2);
    } else if (type === "CLICK") {
      gameOsc.setType('triangle'); gameOsc.freq(880); gameOsc.start(); gameEnv.play();
    } else if (type === "CORRECT") {
      gameOsc.setType('sine'); gameOsc.freq(523.25); gameOsc.start(); gameEnv.play();
      setTimeout(() => { gameOsc.freq(659.25); }, 100);
      setTimeout(() => { gameOsc.freq(783.99); }, 200);
    } else if (type === "WRONG") {
      gameOsc.setType('sawtooth'); gameOsc.freq(220); gameOsc.start(); gameEnv.play(); gameOsc.freq(180, 0.2);
    } else if (type === "VICTORY") {
      gameOsc.setType('triangle');
      gameOsc.freq(523.25); gameOsc.start(); gameEnv.play();
      setTimeout(() => { gameOsc.freq(659.25); gameEnv.play(); }, 120);
      setTimeout(() => { gameOsc.freq(783.99); gameEnv.play(); }, 240);
      setTimeout(() => { gameOsc.freq(1046.50); gameEnv.play(); }, 360);
    }
  } catch (e) {}
}

function startSynthMelody(genreId) {
  stopAllTracks();
  isSynthPlaying = true;
  userStartAudio();

  let notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  if (genreId === "jazz") notes = [220, 261.63, 311.13, 392.00, 466.16];
  if (genreId === "rock") notes = [164.81, 196.00, 220.00, 246.94, 329.63];
  if (genreId === "electronic") notes = [300, 450, 600, 750, 900];

  synthInterval = setInterval(() => {
    if (!isSynthPlaying) return;
    let n = random(notes);
    gameOsc.setType(genreId === "rock" ? "sawtooth" : (genreId === "electronic" ? "square" : "sine"));
    gameOsc.freq(n);
    gameOsc.start();
    gameEnv.play();
  }, 250);
}

function drawStartScreen() {
  drawFloatingNotes();
  fill(255, 255, 255, 220);
  rectMode(CENTER);
  stroke(180, 200, 220);
  strokeWeight(3);
  rect(width / 2, height / 2 - 20, min(width * 0.85, 550), 320, 20);

  noStroke();
  fill(70, 90, 120);
  textAlign(CENTER, CENTER);
  textSize(min(width * 0.07, 36));
  textStyle(BOLD);
  text("樂風探索家", width / 2, height / 2 - 110);

  fill(130, 110, 160);
  textSize(min(width * 0.045, 22));
  textStyle(NORMAL);
  text("── 消失的旋律 ──", width / 2, height / 2 - 60);

  fill(90, 100, 110);
  textSize(min(width * 0.035, 16));
  text("音樂城市的六種旋律失去了身分！\n化身音樂偵探，透過聽覺與線索找回聲音吧！", width / 2, height / 2 + 10);

  drawCustomButton("開始調查 🔍", width / 2, height / 2 + 90, 180, 50, color(140, 170, 210), color(255));
}

function drawIntroScreen() {
  drawFloatingNotes();
  fill(255, 255, 255, 230);
  rectMode(CENTER);
  stroke(180, 200, 220);
  strokeWeight(2);
  rect(width / 2, height / 2, min(width * 0.9, 600), 400, 20);

  noStroke();
  fill(70, 90, 120);
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(BOLD);
  text("🕵️‍♂️ 偵探任務說明", width / 2, height / 2 - 150);

  textAlign(LEFT, CENTER);
  textSize(16);
  textStyle(NORMAL);
  fill(80, 80, 90);
  let introText = 
    "1. 本次任務共有 6 個隨機音樂案件待破解。\n" +
    "2. 點擊「播放音樂」聆聽曲風片段。\n" +
    "3. 仔細閱讀畫面上的音樂特色線索。\n" +
    "4. 從四個選項中選出正確的樂風並「提交線索」。\n" +
    "5. 每題答對可得 16.67 分，答錯會顯示正確答案與解析！\n\n" +
    "準備好開始辦案了嗎？";
  text(introText, width / 2 - min(width * 0.38, 240), height / 2 - 20);

  drawCustomButton("接受任務，出發！ 🚀", width / 2, height / 2 + 140, 220, 50, color(150, 140, 190), color(255));
}

function drawGameScreen() {
  let lvl = levelsData[currentLevel];

  fill(255, 255, 255, 200);
  rectMode(CORNER);
  noStroke();
  rect(0, 0, width, 60);

  fill(70, 90, 120);
  textSize(min(width * 0.04, 20));
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text(`🔍 隨機搜查中：第 ${currentLevel + 1} 關 / 共 6 關`, 20, 30);

  textAlign(RIGHT, CENTER);
  fill(130, 110, 160);
  text(`目前得分: ${floor(score)} 分`, width - 20, 30);

  scanAnimationAngle += 0.03;
  let scanX = width / 2 + cos(scanAnimationAngle) * (width * 0.35);
  fill(200, 220, 245, 40);
  noStroke();
  ellipse(scanX, 120, 180, 80);

  fill(255);
  stroke(190, 210, 230);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, 145, min(width * 0.9, 650), 110, 15);

  let isPlaying = (currentActiveTrack && currentActiveTrack.isPlaying()) || isSynthPlaying;
  drawWaveformAnimation(width / 2 - 60, 145, min(width * 0.45, 300), 60, isPlaying);

  let playBtnText = isPlaying ? "⏸️ 暫停音樂" : "▶️ 播放音樂";
  drawCustomButton(playBtnText, width / 2 + min(width * 0.3, 190), 125, 110, 38, color(140, 170, 210), color(255));
  drawCustomButton("🔄 重頭播放", width / 2 + min(width * 0.3, 190), 170, 110, 32, color(220, 225, 230), color(80));

  fill(255, 255, 255, 220);
  stroke(200, 210, 225);
  rect(width / 2, 275, min(width * 0.9, 650), 120, 15);

  fill(80, 100, 120);
  noStroke();
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("💡 案件線索 (Clues)：", width / 2 - min(width * 0.42, 300), 232);

  textSize(14);
  textStyle(NORMAL);
  fill(70, 70, 80);
  for (let i = 0; i < lvl.clues.length; i++) {
    text(lvl.clues[i], width / 2 - min(width * 0.42, 300), 258 + i * 22);
  }

  let btnW = min(width * 0.42, 300);
  let btnH = 48;
  let gapX = 20;
  let gapY = 15;
  let startX = width / 2 - btnW / 2 - gapX / 2;
  let endX = width / 2 + btnW / 2 + gapX / 2;
  let startY = 375;

  let optionPositions = [
    { x: startX, y: startY },
    { x: endX, y: startY },
    { x: startX, y: startY + btnH + gapY },
    { x: endX, y: startY + btnH + gapY }
  ];

  for (let i = 0; i < 4; i++) {
    let pos = optionPositions[i];
    let btnColor = color(255);
    let textColor = color(70, 80, 90);

    if (selectedOption === i) {
      btnColor = color(190, 180, 220);
      textColor = color(255);
    }

    if (answerSubmitted) {
      if (lvl.options[i] === lvl.correctText) {
        btnColor = color(140, 200, 160);
        textColor = color(255);
      } else if (selectedOption === i && lvl.options[i] !== lvl.correctText) {
        btnColor = color(230, 150, 150);
        textColor = color(255);
      }
    }

    drawCustomButton(`${String.fromCharCode(65 + i)}. ${lvl.options[i]}`, pos.x, pos.y, btnW, btnH, btnColor, textColor);
  }

  let bottomY = startY + (btnH + gapY) * 2 + 10;
  if (!answerSubmitted) {
    let submitColor = (selectedOption !== -1) ? color(140, 170, 210) : color(200, 205, 210);
    drawCustomButton("提交線索 📩", width / 2, bottomY, 200, 48, submitColor, color(255));
  } else {
    fill(245, 248, 252);
    stroke(180, 200, 220);
    rect(width / 2, bottomY + 35, min(width * 0.9, 650), 70, 12);

    noStroke();
    fill(60, 80, 100);
    textSize(13);
    textAlign(CENTER, CENTER);
    let feedbackMsg = (selectedOption !== -1 && lvl.options[selectedOption] === lvl.correctText) 
      ? `答對了！ ${lvl.knowledge}` 
      : `❌ 答錯囉！正確答案是：【${lvl.correctText}】\n${lvl.knowledge}`;
    text(feedbackMsg, width / 2, bottomY + 35, min(width * 0.85, 620), 65);

    let nextText = (currentLevel < levelsData.length - 1) ? "解鎖徽章，下一關 ➡️" : "查看調查結果 🏆";
    drawCustomButton(nextText, width / 2, bottomY + 115, 260, 50, color(150, 140, 190), color(255));
  }
}

function drawResultScreen() {
  if (score >= 60) {
    drawConfettiAnimation();
  }

  fill(255, 255, 255, 235);
  rectMode(CENTER);
  stroke(180, 200, 220);
  strokeWeight(2);
  rect(width / 2, height / 2, min(width * 0.88, 550), 450, 20);

  noStroke();
  fill(70, 90, 120);
  textAlign(CENTER, CENTER);
  textSize(26);
  textStyle(BOLD);
  text("🕵️‍♂️ 結案調查報告", width / 2, height / 2 - 170);

  textSize(48);
  fill(130, 110, 160);
  text(`${floor(score)} 分`, width / 2, height / 2 - 100);

  textSize(16);
  fill(90, 100, 110);
  textStyle(NORMAL);
  text(`答對案件：${correctCount} 題  |  答錯案件：${wrongCount} 題`, width / 2, height / 2 - 50);

  text("已解鎖偵探徽章：", width / 2, height / 2 - 15);
  let badges = ["🎻", "🎷", "🎸", "🎤", "🎧", "🎹"];
  textSize(28);
  let badgeStr = "";
  for (let i = 0; i < originalLevelsData.length; i++) {
    badgeStr += (i < correctCount) ? badges[i] + " " : "🔒 ";
  }
  text(badgeStr, width / 2, height / 2 + 20);

  textSize(16);
  fill(70, 90, 110);
  let comment = score >= 60 ? "🎉 太棒了！你獲得了音樂大偵探榮譽徽章！" : "💪 還差一點點！再試一次找回所有旋律吧！";
  text(comment, width / 2, height / 2 + 65);

  drawCustomButton("🔄 重新調查", width / 2 - 110, height / 2 + 140, 180, 48, color(220, 225, 230), color(70));
  drawCustomButton("📖 音樂圖鑑", width / 2 + 110, height / 2 + 140, 180, 48, color(140, 170, 210), color(255));
}

// 修正後的知識圖鑑排版（卡片更大、字型適中，解決文字跑掉問題）
function drawEncyclopediaScreen() {
  noStroke();
  fill(70, 90, 120);
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(BOLD);
  text("📖 音樂知識圖鑑", width / 2, 35);

  let cardW = min(width * 0.44, 340);
  let cardH = 145; // 增加卡片高度以容納完整文字
  let startX = width / 2 - cardW / 2 - 15;
  let endX = width / 2 + cardW / 2 + 15;

  // 調整三列排版的 Y 軸間距
  let positions = [
    { x: startX, y: 145 }, { x: endX, y: 145 },
    { x: startX, y: 300 }, { x: endX, y: 300 },
    { x: startX, y: 455 }, { x: endX, y: 455 }
  ];

  rectMode(CENTER);
  for (let i = 0; i < originalLevelsData.length; i++) {
    let pos = positions[i];
    let lvl = originalLevelsData[i];

    fill(255);
    stroke(190, 205, 225);
    strokeWeight(1.5);
    rect(pos.x, pos.y, cardW, cardH, 12);

    noStroke();
    textAlign(LEFT, TOP);
    fill(100, 80, 140);
    textSize(14);
    textStyle(BOLD);
    text(lvl.title, pos.x - cardW / 2 + 15, pos.y - cardH / 2 + 12);

    fill(80, 90, 100);
    textSize(11.5); // 適度縮小字體確保不溢出
    textStyle(NORMAL);
    text(lvl.knowledge, pos.x - cardW / 2 + 15, pos.y - cardH / 2 + 35, cardW - 30, cardH - 40);
  }

  drawCustomButton("返回主選單 🏠", width / 2, height - 40, 200, 40, color(150, 140, 190), color(255));
}

function drawCustomButton(label, x, y, w, h, bgColor, textColor) {
  rectMode(CENTER);
  let isHover = mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2;

  stroke(180, 195, 215);
  strokeWeight(1.5);
  fill(isHover ? lerpColor(bgColor, color(255), 0.2) : bgColor);
  rect(x, y, w, h, 12);

  noStroke();
  fill(textColor);
  textAlign(CENTER, CENTER);
  textSize(min(w * 0.1, 16));
  textStyle(BOLD);
  text(label, x, y);
}

function drawWaveformAnimation(x, y, w, h, isPlaying) {
  rectMode(CENTER);
  fill(240, 245, 250);
  stroke(200, 215, 230);
  rect(x, y, w, h, 10);

  noFill();
  stroke(120, 160, 210);
  strokeWeight(2);
  let numBars = 30;
  for (let i = 0; i < numBars; i++) {
    let barX = map(i, 0, numBars - 1, x - w / 2 + 15, x + w / 2 - 15);
    let barHeight = isPlaying ? random(5, h * 0.7) : 4;
    line(barX, y - barHeight / 2, barX, y + barHeight / 2);
  }
}

function drawFloatingNotes() {
  noStroke();
  for (let note of floatingNotes) {
    fill(140, 160, 190, note.alpha);
    textSize(note.size);
    text(note.symbol, note.x, note.y);
    note.y -= note.speedY;
    if (note.y < -30) {
      note.y = height + 20;
      note.x = random(width);
    }
  }
}

function drawConfettiAnimation() {
  noStroke();
  for (let p of confettiParticles) {
    fill(p.color);
    rect(p.x, p.y, p.size, p.size);
    p.y += p.speedY;
    p.x += p.speedX;
    if (p.y > height) {
      p.y = -10;
      p.x = random(width);
    }
  }
}

function stopAllTracks() {
  isSynthPlaying = false;
  if (synthInterval) clearInterval(synthInterval);
  if (currentActiveTrack && currentActiveTrack.isPlaying()) {
    currentActiveTrack.stop();
  }
  for (let key in audioFiles) {
    for (let snd of audioFiles[key]) {
      if (snd && snd.isPlaying()) { snd.stop(); }
    }
  }
}

function mousePressed() {
  userStartAudio();

  if (gameState === "START") {
    if (dist(mouseX, mouseY, width / 2, height / 2 + 90) < 100) {
      playSFX("START");
      gameState = "INTRO";
    }
    return;
  }

  if (gameState === "INTRO") {
    if (dist(mouseX, mouseY, width / 2, height / 2 + 140) < 110) {
      playSFX("CLICK");
      resetGameData();
      gameState = "PLAY";
    }
    return;
  }

  if (gameState === "PLAY" || gameState === "FEEDBACK") {
    let lvl = levelsData[currentLevel];
    let fileList = audioFiles[lvl.id];

    let btnPlayX = width / 2 + min(width * 0.3, 190);
    if (mouseX > btnPlayX - 55 && mouseX < btnPlayX + 55 && mouseY > 106 && mouseY < 144) {
      let isPlayingNow = (currentActiveTrack && currentActiveTrack.isPlaying()) || isSynthPlaying;
      
      if (isPlayingNow) {
        stopAllTracks();
      } else {
        if (fileList && fileList.length > 0 && audioLoaded[lvl.id] && fileList[0].isLoaded()) {
          if (!currentActiveTrack || !fileList.includes(currentActiveTrack)) {
            currentActiveTrack = random(fileList);
          }
          stopAllTracks();
          currentActiveTrack.play();
        } else {
          startSynthMelody(lvl.id);
        }
      }
      return;
    }

    if (mouseX > btnPlayX - 55 && mouseX < btnPlayX + 55 && mouseY > 154 && mouseY < 186) {
      stopAllTracks();
      if (fileList && fileList.length > 0 && audioLoaded[lvl.id] && fileList[0].isLoaded()) {
        currentActiveTrack = random(fileList);
        currentActiveTrack.play();
      } else {
        startSynthMelody(lvl.id);
      }
      return;
    }

    let btnW = min(width * 0.42, 300);
    let btnH = 48;
    let gapX = 20;
    let gapY = 15;
    let startX = width / 2 - btnW / 2 - gapX / 2;
    let endX = width / 2 + btnW / 2 + gapX / 2;
    let startY = 375;

    let optionPositions = [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: startX, y: startY + btnH + gapY },
      { x: endX, y: startY + btnH + gapY }
    ];

    if (!answerSubmitted) {
      for (let i = 0; i < 4; i++) {
        let pos = optionPositions[i];
        if (mouseX > pos.x - btnW / 2 && mouseX < pos.x + btnW / 2 && mouseY > pos.y - btnH / 2 && mouseY < pos.y + btnH / 2) {
          selectedOption = i;
          playSFX("CLICK");
          return;
        }
      }

      let bottomY = startY + (btnH + gapY) * 2 + 10;
      if (mouseX > width / 2 - 120 && mouseX < width / 2 + 120 && mouseY > bottomY - 30 && mouseY < bottomY + 30) {
        if (selectedOption !== -1) {
          answerSubmitted = true;
          gameState = "FEEDBACK";
          stopAllTracks();

          if (lvl.options[selectedOption] === lvl.correctText) {
            score += 100 / levelsData.length;
            correctCount++;
            playSFX("CORRECT");
          } else {
            wrongCount++;
            playSFX("WRONG");
          }
        }
        return;
      }
    } else {
      let bottomY = startY + (btnH + gapY) * 2 + 10;
      let nextBtnY = bottomY + 115;
      
      if (mouseX > width / 2 - 160 && mouseX < width / 2 + 160 && mouseY > nextBtnY - 40 && mouseY < nextBtnY + 40) {
        if (currentLevel < levelsData.length - 1) {
          currentLevel++;
          selectedOption = -1;
          answerSubmitted = false;
          currentActiveTrack = null;
          gameState = "PLAY";
        } else {
          stopAllTracks();
          playSFX("VICTORY");
          gameState = "RESULT";
        }
        return;
      }
    }
  }

  if (gameState === "RESULT") {
    if (dist(mouseX, mouseY, width / 2 - 110, height / 2 + 140) < 90) {
      resetGameData();
      playSFX("START");
      gameState = "PLAY";
    }
    if (dist(mouseX, mouseY, width / 2 + 110, height / 2 + 140) < 90) {
      playSFX("CLICK");
      gameState = "ENCYCLOPEDIA";
    }
    return;
  }

  if (gameState === "ENCYCLOPEDIA") {
    if (dist(mouseX, mouseY, width / 2, height - 40) < 100) {
      resetGameData();
      gameState = "START";
    }
    return;
  }
}

function touchStarted() {
  mousePressed();
  return false;
}

function resetGameData() {
  stopAllTracks();
  levelsData = shuffle([...originalLevelsData]);
  currentLevel = 0;
  score = 0;
  correctCount = 0;
  wrongCount = 0;
  selectedOption = -1;
  answerSubmitted = false;
  currentActiveTrack = null;
}
