// In-Game AI Combat Mentor & Chatbot: "Master Ken (마스터 켄)"

class CombatChatbot {
  constructor() {
    this.messages = [];
    this.apiKey = localStorage.getItem('blade_clash_gemini_key') || '';
    this.isOpen = false;
    this.lastReactionTime = 0;

    // Knowledge base for offline intelligent dialogue engine
    this.knowledgeBase = [
      {
        keywords: ['조작', '키', '어떻게', '버튼', '움직'],
        response: '기본 조작법을 알려주지!\n• 이동: A / D (2P는 좌/우 방향키)\n• 점프: W (2P는 위쪽 방향키)\n• 막기(가드): S (2P는 아래쪽 방향키)\n• 약공격: J (2P는 Num 1)\n• 강공격: K (2P는 Num 2)\n• 대시: L (2P는 Num 3)\n\n상단의 [⌨️ 키 설정] 메뉴에서 언제든 원하는 키로 바꿀 수 있네!'
      },
      {
        keywords: ['패링', '퍼펙트', '카운터', '쳐내'],
        response: '퍼펙트 패링(Perfect Parry)은 상대 칼날이 닿기 직전(0.14초 이내)에 정확히 막기(S키)를 누르면 발동한다네! 성공하면 적이 큰 경직에 빠지니, 즉시 강공격(K)으로 치명적인 반격을 날리게!'
      },
      {
        keywords: ['막기', '가드', '방어', '방패'],
        response: '막기(S키)를 유지하면 받는 피해의 85%를 흡수할 수 있네. 다만 막을 때마다 머리 위의 푸른색 [가드 게이지]가 깎이지. 게이지가 0이 되면 2초간 기절(가드 브레이크)하므로 계속 막고만 있으면 위험하다네!'
      },
      {
        keywords: ['점프', '공중', '높이'],
        response: '점프(W) 중에 공격(J 또는 K)을 누르면 공중 베기가 발동하네! 상대가 하단 가드를 올리고 있을 때 뛰어넘어 뒤를 노리는 전술을 써보게.'
      },
      {
        keywords: ['콤보', '연타', '기술', '연계'],
        response: '기본 공격(J)을 적중시키는 도중에 다시 J를 누르면 2단 연계 베기가 이어지네! 상대의 가드가 열려 있다면 2단 베기 후 곧바로 강베기(K)나 대시(L)로 압박하는 것이 정석이지.'
      },
      {
        keywords: ['화면', '줌', '축소', '확대', '마우스'],
        response: '마우스 휠을 위아래로 굴리면 전장을 자유롭게 줌인/줌아웃할 수 있네! 멀리서 전체 흐름을 보고 싶다면 휠을 아래로 굴려 축소해보게. 우클릭 드래그로 화면 시점도 옮길 수 있지.'
      },
      {
        keywords: ['스킨', '칼', '꾸미', '무기', '이펙트'],
        response: '상단의 [🎨 칼 스킨] 버튼을 누르면 나만의 검을 만들 수 있네! 카타나, 대검, 광선검, 레이피어 등 형태를 고르고 화염, 번개, 벚꽃, 공허 등의 검기 궤적을 둘러보게. 검의 색상과 발광도 마음대로 바꿀 수 있다네!'
      },
      {
        keywords: ['ai', '인공지능', '어려워', '이기', '공략', '팁'],
        response: '전투 AI를 쓰러뜨리는 팁을 주마! AI는 공격 직전에 약간 틈을 보이는데, 이때 퍼펙트 패링을 노리거나 AI가 가드를 올렸을 때 방어를 부수는 [강공격(K)]을 적중시켜 가드 브레이크를 유도하게!'
      },
      {
        keywords: ['안녕', '반가', '하이', '누구'],
        response: '반갑네, 젊은 검사여! 나는 이 도장의 수석 사범이자 자네의 전투 AI 코치 마스터 켄이라네. 전투에 대해 궁금한 점이 있다면 무엇이든 물어보게나.'
      }
    ];

    this.defaultGreeting = '반갑네! 나는 검술 사범 마스터 켄이라네. 전투 팁이나 조작법, 패링 요령 등 무엇이든 물어보게나! (예: "패링 팁 알려줘", "조작키 뭐 있어?")';
  }

  init() {
    this.addMessage('ai', this.defaultGreeting);
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('blade_clash_gemini_key', this.apiKey);
  }

  addMessage(sender, text) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ sender, text, time: timeStr });
    this.renderMessages();

    // Notify unread badge if closed
    if (!this.isOpen && sender === 'ai') {
      const badge = document.getElementById('chat-badge');
      if (badge) badge.classList.add('active');
    }
  }

  // Real-time battle reactions
  onParry(fighter) {
    const now = performance.now();
    if (now - this.lastReactionTime < 4000) return; // debounce
    this.lastReactionTime = now;

    const phrases = [
      `⚡ ${fighter.name}의 기가 막힌 퍼펙트 패링! 지금 상대가 무방비다, 쳐라!`,
      `✨ 완벽한 타이밍의 쳐내기였다! 바로 강베기 카운터를 꽂아넣게!`,
      `🔥 훌륭한 검술 감각이군! 패링으로 흐름을 완전히 가져왔다네!`
    ];
    this.addMessage('ai', phrases[Math.floor(Math.random() * phrases.length)]);
  }

  onGuardBreak(fighter) {
    const now = performance.now();
    if (now - this.lastReactionTime < 4000) return;
    this.lastReactionTime = now;

    this.addMessage('ai', `💥 ${fighter.name}의 가드가 부서졌다! 2초간 기절 상태니 망설이지 말고 최대 콤보를 쏟아붓게!`);
  }

  onKO(loser, winner) {
    this.addMessage('ai', `🏆 결판이 났군! [${winner.name}]의 승리일세! 멋진 검무였네.`);
  }

  // Send user message
  async handleUserQuery(queryText) {
    const text = queryText.trim();
    if (!text) return;

    this.addMessage('user', text);

    // If Gemini API key is provided, use actual LLM
    if (this.apiKey) {
      try {
        const reply = await this.queryGeminiAPI(text);
        this.addMessage('ai', reply);
        return;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local engine:', err);
      }
    }

    // Local Intelligent Dialogue Engine
    setTimeout(() => {
      const localReply = this.generateLocalResponse(text);
      this.addMessage('ai', localReply);
    }, 300);
  }

  generateLocalResponse(text) {
    const lower = text.toLowerCase();

    for (const item of this.knowledgeBase) {
      if (item.keywords.some(k => lower.includes(k))) {
        return item.response;
      }
    }

    const genericResponses = [
      '흠, 깊이 있는 질문이로군! 검술에서 가장 중요한 것은 상대의 숨결과 칼날의 거리를 읽는 눈일세. 막기(S)와 강베기(K)의 타이밍을 번갈아 연습해보게.',
      '검의 길은 끊임없는 수련에서 비롯되지! [🎨 칼 스킨]에서 마음에 드는 검을 골라 전장에 임하면 투지가 더욱 솟구칠 것이네.',
      '조작이 손에 익지 않는다면 상단의 [⌨️ 키 설정]에서 자네에게 가장 편한 키로 재배치해보게나.',
      '궁금한 점이 있다면 "조작법", "패링 팁", "콤보", "AI 이기는 법" 등을 물어보게나!'
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  async queryGeminiAPI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const systemInstruction = '너는 2D 검술 격투 게임 "블레이드 클래시(Blade Clash)"의 AI 도장 사범 "마스터 켄"이다. 무협과 사이버펑크 감성이 섞인 지혜롭고 호쾌한 말투(~하게, ~라네, ~일세)로 플레이어의 질문에 2-3문장 내외로 명쾌하게 답하라. 게임 조작키(A/D 이동, W 점프, S 막기/패링, J 약공격, K 강공격, L 대시, 휠 줌)와 전략에 정통하다.';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n플레이어의 말: ${prompt}` }] }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = this.messages.map(m => `
      <div class="chat-bubble-row ${m.sender}">
        <div class="chat-avatar">${m.sender === 'ai' ? '🥋' : '👤'}</div>
        <div class="chat-bubble">
          <div class="chat-sender-name">${m.sender === 'ai' ? '사범 마스터 켄' : '나'} <span class="chat-time">${m.time}</span></div>
          <div class="chat-text">${m.text.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }
}

window.chatbot = new CombatChatbot();
