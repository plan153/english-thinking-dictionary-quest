/**
 * Generate situation-fit Q&A matrices for expressions that lack curated entries.
 * Browser: window.QaMatrixGenerate
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.QaMatrixGenerate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function stripEnd(text) {
    return String(text || '').replace(/[.?!…]+$/u, '').trim();
  }

  function ensurePeriod(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    if (/[.?!]$/.test(value)) return value;
    return `${value}.`;
  }

  function ensureQuestion(text) {
    const value = stripEnd(text);
    if (!value) return '';
    return `${value}?`;
  }

  function enOf(expression) {
    return String(expression?.english || expression?.en || expression?.audioText || '')
      .replace(/[’‘ʻʼ]/g, "'")
      .trim();
  }

  function koOf(expression) {
    return String(expression?.naturalKorean || expression?.ko || expression?.literalMeaning || '').trim();
  }

  function verbWord(expression, verbs = []) {
    const fromId = String(expression?.coreVerbId || '').replace(/^v_/, '');
    const found = (verbs || []).find(verb => verb.id === expression?.coreVerbId);
    return String(found?.word || fromId || 'do').toLowerCase();
  }

  function isQuestionEn(en) {
    const text = stripEnd(en);
    if (/\?$/.test(String(en || '').trim())) return true;
    if (/^(do|does|did|are|is|am|was|were|can|could|will|would|should|may|might)\b/i.test(text)) return true;
    // "Have you ...?" is a question; "Have a good day." is not.
    if (/^(have|has|had)\s+(you|we|they|i|he|she|it)\b/i.test(text)) return true;
    return false;
  }

  function isLetsEn(en) {
    return /^let'?s\b/i.test(stripEnd(en));
  }

  function isAlreadyNegativeEn(en) {
    return /\b(don't|do not|doesn't|does not|didn't|did not|won't|will not|can't|cannot|isn't|is not|aren't|are not|no time|never)\b/i.test(en);
  }

  function isPastEn(en) {
    return /\b(got|made|went|came|took|had|felt|found|kept|gave|put|did|was|were)\b/i.test(stripEnd(en))
      && !/\b(getting|making|going|coming|taking|having|feeling|finding|keeping|giving)\b/i.test(en);
  }

  function isImperativeEn(en) {
    const text = stripEnd(en);
    if (!text) return false;
    if (isLetsEn(text)) return false;
    if (/^(i|i'm|i am|we|we're|we are|you|you're|you are|they|they're|they are|he|she|it|this|that)\b/i.test(text)) {
      return false;
    }
    return /^(please\s+)?(take|have|get|make|keep|give|come|go|put|find|do|be|feel|let|try|stay|call|open|hold|wait|look|listen|say|tell|ask|use|start|stop|leave|help)\b/i.test(text);
  }

  function isProgressiveEn(en) {
    return /\b(i'm|i am|you're|you are|we're|we are|they're|they are|he's|she's|it's)\b/i.test(en)
      && /\b\w+ing\b/i.test(en);
  }

  function subjectAuxFromQuestion(questionEn) {
    const text = stripEnd(questionEn);
    const match = text.match(/^(do|does|did|are|is|am|was|were|can|could|will|would|have|has|had)\s+(\w+)\b/i);
    if (!match) {
      return { aux: 'do', subject: 'you', shortYes: 'Yes, I do.', shortNo: "No, I don't." };
    }
    const aux = match[1].toLowerCase();
    const subject = match[2].toLowerCase();
    if (aux === 'does') return { aux, subject, shortYes: 'Yes, it does.', shortNo: "No, it doesn't.", statementSubject: subject === 'that' ? 'That' : 'It' };
    if (aux === 'do' && subject === 'you') return { aux, subject, shortYes: 'Yes, I do.', shortNo: "No, I don't.", statementSubject: 'I' };
    if (aux === 'do' && subject === 'we') return { aux, subject, shortYes: 'Yes, we do.', shortNo: "No, we don't.", statementSubject: 'We' };
    if (aux === 'did') return { aux, subject, shortYes: 'Yes, I did.', shortNo: "No, I didn't.", statementSubject: 'I' };
    if (aux === 'are' && subject === 'you') return { aux, subject, shortYes: 'Yes, I am.', shortNo: "No, I'm not.", statementSubject: "I'm" };
    if (aux === 'is') return { aux, subject, shortYes: 'Yes, it is.', shortNo: "No, it isn't.", statementSubject: 'It' };
    if (aux === 'can' && subject === 'i') return { aux, subject, shortYes: 'Yes, you can.', shortNo: "No, you can't.", statementSubject: 'I' };
    if (aux === 'can') return { aux, subject, shortYes: 'Yes, I can.', shortNo: "No, I can't.", statementSubject: 'I' };
    if (aux === 'will') return { aux, subject, shortYes: 'Yes, I will.', shortNo: "No, I won't.", statementSubject: 'I' };
    if (aux === 'should') return { aux, subject, shortYes: 'Yes, we should.', shortNo: "No, let's not.", statementSubject: 'We' };
    if (aux === 'have' && subject === 'you') return { aux, subject, shortYes: 'Yes, I have.', shortNo: "No, I haven't.", statementSubject: 'I' };
    return { aux, subject, shortYes: 'Yes, I do.', shortNo: "No, I don't.", statementSubject: 'I' };
  }

  function questionToStatement(questionEn) {
    const text = stripEnd(questionEn);
    const info = subjectAuxFromQuestion(text);
    // Do you have time? -> I have time.
    let rest = text.replace(/^(do|does|did|are|is|am|was|were|can|could|will|would|have|has|had)\s+\w+\s+/i, '');
    if (/^(are|is|am)\b/i.test(text)) {
      // Are you getting tired? -> I'm getting tired.
      rest = text.replace(/^are\s+you\s+/i, '').replace(/^is\s+\w+\s+/i, '');
      return ensurePeriod(`I'm ${rest}`);
    }
    if (/^can\s+i\b/i.test(text)) {
      rest = text.replace(/^can\s+i\s+/i, '');
      return ensurePeriod(`I can ${rest}`);
    }
    if (/^can\s+you\b/i.test(text)) {
      rest = text.replace(/^can\s+you\s+/i, '');
      return ensurePeriod(`I can ${rest}`);
    }
    if (/^will\s+you\b/i.test(text)) {
      rest = text.replace(/^will\s+you\s+/i, '');
      return ensurePeriod(`I will ${rest}`);
    }
    if (info.aux === 'does') {
      // Does it take time? -> It takes time. (approx)
      return ensurePeriod(`It ${rest}`.replace(/\bget\b/i, 'gets').replace(/\btake\b/i, 'takes').replace(/\bneed\b/i, 'needs').replace(/\bhave\b/i, 'has'));
    }
    return ensurePeriod(`${info.statementSubject || 'I'} ${rest}`);
  }

  function statementToQuestion(statementEn) {
    const text = stripEnd(statementEn);
    if (isLetsEn(text)) {
      const rest = text.replace(/^let'?s\s+/i, '');
      return ensureQuestion(`Should we ${rest}`);
    }
    if (isAlreadyNegativeEn(text)) {
      if (/\bhave no\b/i.test(text)) {
        const rest = text.replace(/^(i|we|you|they)\s+have no\s+/i, 'have ');
        return ensureQuestion(`Do you ${rest}`.replace(/\s+/g, ' ').trim());
      }
      // I don't get it. -> Do you get it?
      const rest = text
        .replace(/^(i|we|you|they)\s+(don't|do not)\s+/i, '')
        .replace(/^(it)\s+(doesn't|does not)\s+/i, '');
      if (/^it\b/i.test(text) && /\b(doesn't|does not)\b/i.test(text)) {
        return ensureQuestion(`Does it ${rest}`.replace(/\s+/g, ' ').trim());
      }
      return ensureQuestion(`Do you ${rest}`.replace(/\s+/g, ' ').trim());
    }
    if (isProgressiveEn(text)) {
      if (/^(it's|it is)\b/i.test(text)) {
        const rest = text.replace(/^(it's|it is)\s+/i, '');
        return ensureQuestion(`Is it ${rest}`);
      }
      const rest = text
        .replace(/^(i'm|i am)\s+/i, '')
        .replace(/^(you're|you are)\s+/i, '')
        .replace(/^(we're|we are)\s+/i, '')
        .replace(/^(they're|they are)\s+/i, '');
      return ensureQuestion(`Are you ${rest}`);
    }
    if (/^that\s+/i.test(text)) {
      const rest = text.replace(/^that\s+/i, '')
        .replace(/\bmakes\b/i, 'make')
        .replace(/\bmade\b/i, 'make');
      return ensureQuestion(`Does that ${rest}`);
    }
    if (/^it\s+/i.test(text)) {
      if (isPastEn(text)) {
        const rest = text.replace(/^it\s+/i, '')
          .replace(/\bwent\b/i, 'go')
          .replace(/\bgot\b/i, 'get')
          .replace(/\bmade\b/i, 'make')
          .replace(/\btook\b/i, 'take');
        return ensureQuestion(`Did it ${rest}`);
      }
      const rest = text.replace(/^it\s+/i, '')
        .replace(/\btakes\b/i, 'take')
        .replace(/\bneeds\b/i, 'need')
        .replace(/\bhas\b/i, 'have')
        .replace(/\bgets\b/i, 'get')
        .replace(/\bgoes\b/i, 'go')
        .replace(/\bmakes\b/i, 'make')
        .replace(/\bkeeps\b/i, 'keep')
        .replace(/\bfeels\b/i, 'feel');
      return ensureQuestion(`Does it ${rest}`);
    }
    if (isPastEn(text)) {
      const rest = text
        .replace(/^(i|we|you|they)\s+/i, '')
        .replace(/\bgot\b/i, 'get')
        .replace(/\bmade\b/i, 'make')
        .replace(/\bwent\b/i, 'go')
        .replace(/\bcame\b/i, 'come')
        .replace(/\btook\b/i, 'take')
        .replace(/\bhad\b/i, 'have')
        .replace(/\bfelt\b/i, 'feel')
        .replace(/\bfound\b/i, 'find')
        .replace(/\bkept\b/i, 'keep')
        .replace(/\bgave\b/i, 'give');
      return ensureQuestion(`Did you ${rest}`);
    }
    if (/^(we|they)\s+/i.test(text)) {
      const rest = text.replace(/^(we|they)\s+/i, '');
      return ensureQuestion(`Do you ${rest}`);
    }
    if (/^you\s+/i.test(text)) {
      const rest = text.replace(/^you\s+/i, '');
      return ensureQuestion(`Do you ${rest}`);
    }
    // I have / I need / I want / I get ...
    const rest = text.replace(/^(i|i'm|i am)\s+/i, '');
    return ensureQuestion(`Do you ${rest}`);
  }

  function statementToNegative(statementEn) {
    const text = stripEnd(statementEn);
    if (isAlreadyNegativeEn(text)) return ensurePeriod(text);
    if (isLetsEn(text)) {
      const rest = text.replace(/^let'?s\s+/i, '');
      return ensurePeriod(`Let's not ${rest}`);
    }
    if (isProgressiveEn(text)) {
      if (/^(it's|it is)\b/i.test(text)) {
        return ensurePeriod(text.replace(/^(it's|it is)\b/i, "It isn't"));
      }
      if (/^(i'm|i am)\b/i.test(text)) {
        return ensurePeriod(text.replace(/^(i'm|i am)\b/i, "I'm not"));
      }
      if (/^(you're|you are)\b/i.test(text)) {
        return ensurePeriod(text.replace(/^(you're|you are)\b/i, "You're not"));
      }
      return ensurePeriod(`I'm not ${text.replace(/^(we're|we are|they're|they are)\s+/i, '')}`);
    }
    if (/^that\s+/i.test(text)) {
      const rest = text.replace(/^that\s+/i, '')
        .replace(/\bmakes\b/i, 'make')
        .replace(/\bmade\b/i, 'make');
      return ensurePeriod(`That doesn't ${rest}`);
    }
    if (/^it\s+/i.test(text)) {
      if (isPastEn(text)) {
        const rest = text.replace(/^it\s+/i, '')
          .replace(/\bwent\b/i, 'go')
          .replace(/\bgot\b/i, 'get')
          .replace(/\bmade\b/i, 'make');
        return ensurePeriod(`It didn't ${rest}`);
      }
      const rest = text.replace(/^it\s+/i, '')
        .replace(/\btakes\b/i, 'take')
        .replace(/\bneeds\b/i, 'need')
        .replace(/\bhas\b/i, 'have')
        .replace(/\bgets\b/i, 'get');
      return ensurePeriod(`It doesn't ${rest}`);
    }
    if (isPastEn(text)) {
      const rest = text
        .replace(/^(i|we|you|they)\s+/i, '')
        .replace(/\bgot\b/i, 'get')
        .replace(/\bmade\b/i, 'make')
        .replace(/\bwent\b/i, 'go')
        .replace(/\bcame\b/i, 'come')
        .replace(/\btook\b/i, 'take')
        .replace(/\bhad\b/i, 'have')
        .replace(/\bfelt\b/i, 'feel');
      return ensurePeriod(`I didn't ${rest}`);
    }
    if (/^i\s+can\b/i.test(text)) return ensurePeriod(text.replace(/^i\s+can\b/i, "I can't"));
    if (/^i\s+will\b/i.test(text)) return ensurePeriod(text.replace(/^i\s+will\b/i, "I won't"));
    if (/^i\s+don't\b/i.test(text) || /^i\s+do\s+not\b/i.test(text)) return ensurePeriod(text);
    if (/^i\s+have to\b/i.test(text)) return ensurePeriod(text.replace(/^i\s+have to\b/i, "I don't have to"));
    if (/^i\s+have no\b/i.test(text)) return ensurePeriod(text); // already negative sense
    if (/^i\s+/i.test(text)) return ensurePeriod(`I don't ${text.replace(/^i\s+/i, '')}`);
    if (/^we\s+/i.test(text)) return ensurePeriod(`We don't ${text.replace(/^we\s+/i, '')}`);
    if (/^you\s+/i.test(text)) return ensurePeriod(`You don't ${text.replace(/^you\s+/i, '')}`);
    return ensurePeriod(`I don't ${text}`);
  }

  function shortAnswersFor(questionEn) {
    const info = subjectAuxFromQuestion(questionEn);
    return {
      yes: { en: info.shortYes, ko: '네.' },
      no: { en: info.shortNo, ko: '아니요.', acceptedAnswers: info.shortNo.includes("n't") ? [info.shortNo.replace("n't", ' not')] : [] },
    };
  }

  function imperativeMatrix(en, ko, expression) {
    const base = stripEnd(en);
    const lower = base.toLowerCase();
    // Situation-fit follow-ups for common imperatives / blessings.
    const specials = {
      'have a good day': {
        statement: 'Have a good day.',
        statementKo: '좋은 하루 보내세요.',
        question: 'Are you having a good day?',
        questionKo: '좋은 하루 보내고 있어요?',
        negative: "I'm not having a good day.",
        negativeKo: '좋은 하루는 아니에요.',
        shortYes: { en: 'Yes, I am.', ko: '네, 보내고 있어요.' },
        shortNo: { en: "No, I'm not.", ko: '아니요.' },
      },
      'have fun': {
        statement: 'Have fun.',
        statementKo: '재미있게 보내요.',
        question: 'Are you having fun?',
        questionKo: '재미있어요?',
        negative: "I'm not having fun.",
        negativeKo: '재미없아요.',
        shortYes: { en: 'Yes, I am.', ko: '네, 재미있어요.' },
        shortNo: { en: "No, I'm not.", ko: '아니요.' },
      },
      'have some water': {
        statement: 'Have some water.',
        statementKo: '물 좀 마셔요.',
        question: 'Do you want some water?',
        questionKo: '물 좀 마실래요?',
        negative: "I don't want water.",
        negativeKo: '물은 괜찮아요.',
        shortYes: { en: 'Yes, I do.', ko: '네, 주세요.' },
        shortNo: { en: "No, I don't.", ko: '아니요, 괜찮아요.' },
      },
      'feel free to ask': {
        statement: 'Feel free to ask.',
        statementKo: '편하게 물어보세요.',
        question: 'Can I feel free to ask?',
        questionKo: '편하게 물어봐도 될까요?',
        negative: "Don't ask now.",
        negativeKo: '지금은 묻지 마세요.',
        shortYes: { en: 'Yes, you can.', ko: '네, 물어보세요.' },
        shortNo: { en: 'No, wait.', ko: '아니요, 기다려요.' },
      },
      'keep trying': {
        statement: 'Keep trying.',
        statementKo: '계속 해보세요.',
        question: 'Should I keep trying?',
        questionKo: '계속 해볼까요?',
        negative: "Don't keep trying.",
        negativeKo: '그만하세요.',
        shortYes: { en: 'Yes, keep trying.', ko: '네, 계속하세요.' },
        shortNo: { en: 'No, stop.', ko: '아니요, 멈추세요.' },
      },
      "let's have lunch": {
        statement: "Let's have lunch.",
        statementKo: '점심 먹어요.',
        question: 'Should we have lunch?',
        questionKo: '점심 먹을까요?',
        negative: "Let's not have lunch now.",
        negativeKo: '지금은 점심 말고.',
        shortYes: { en: "Yes, let's.", ko: '네, 먹어요.', acceptedAnswers: ["Yes, let's.", 'Yes, we should.'] },
        shortNo: { en: "No, let's wait.", ko: '아니요, 나중에요.' },
      },
      "let's go there": {
        statement: "Let's go there.",
        statementKo: '거기로 가요.',
        question: 'Should we go there?',
        questionKo: '거기로 갈까요?',
        negative: "Let's not go there.",
        negativeKo: '거기는 가지 말아요.',
        shortYes: { en: "Yes, let's.", ko: '네, 가요.', acceptedAnswers: ["Yes, let's.", 'Yes, we should.'] },
        shortNo: { en: "No, let's stay.", ko: '아니요, 있어요.' },
      },
      'take your time': {
        statement: 'Take your time.',
        statementKo: '천천히 하세요.',
        question: 'Can I take my time?',
        questionKo: '천천히 해도 될까요?',
        negative: "Don't rush.",
        negativeKo: '서두르지 마세요.',
        shortYes: { en: 'Yes, you can.', ko: '네, 천천히 하세요.' },
        shortNo: { en: 'No, please hurry.', ko: '아니요, 서둘러 주세요.', acceptedAnswers: ['No, hurry up.'] },
      },
      'get some rest': {
        statement: 'Get some rest.',
        statementKo: '좀 쉬세요.',
        question: 'Do you need some rest?',
        questionKo: '좀 쉬어야 해요?',
        negative: "I don't need rest now.",
        negativeKo: '지금은 안 쉬어도 돼요.',
        shortYes: { en: 'Yes, I do.', ko: '네, 필요해요.' },
        shortNo: { en: "No, I don't.", ko: '아니요, 괜찮아요.' },
      },
      'take a break': {
        statement: 'Take a break.',
        statementKo: '잠깐 쉬세요.',
        question: 'Do you want to take a break?',
        questionKo: '잠깐 쉴래요?',
        negative: "I don't want a break.",
        negativeKo: '쉴 필요는 없어요.',
        shortYes: { en: 'Yes, I do.', ko: '네, 쉴래요.' },
        shortNo: { en: "No, I don't.", ko: '아니요, 괜찮아요.' },
      },
      'take a look': {
        statement: 'Take a look.',
        statementKo: '한번 보세요.',
        question: 'Can you take a look?',
        questionKo: '한번 볼 수 있어요?',
        negative: "I can't take a look now.",
        negativeKo: '지금은 못 봐요.',
        shortYes: { en: 'Yes, I can.', ko: '네, 볼게요.' },
        shortNo: { en: "No, I can't.", ko: '아니요, 어려워요.' },
      },
      'take care': {
        statement: 'Take care.',
        statementKo: '조심해요.',
        question: 'Will you take care?',
        questionKo: '조심할 거죠?',
        negative: "I won't be careful.",
        negativeKo: '조심하지 않을게요.',
        shortYes: { en: 'Yes, I will.', ko: '네, 조심할게요.' },
        shortNo: { en: "No, I won't.", ko: '아니요.' },
      },
      'take the train': {
        statement: 'Take the train.',
        statementKo: '기차를 타세요.',
        question: 'Should I take the train?',
        questionKo: '기차를 탈까요?',
        negative: "Don't take the train.",
        negativeKo: '기차는 타지 마세요.',
        shortYes: { en: 'Yes, you should.', ko: '네, 타세요.' },
        shortNo: { en: 'No, take a bus.', ko: '아니요, 버스를 타세요.', acceptedAnswers: ["No, don't."] },
      },
      'keep going': {
        statement: 'Keep going.',
        statementKo: '계속 해보세요.',
        question: 'Should I keep going?',
        questionKo: '계속할까요?',
        negative: "Don't keep going.",
        negativeKo: '그만하세요.',
        shortYes: { en: 'Yes, keep going.', ko: '네, 계속하세요.' },
        shortNo: { en: 'No, stop.', ko: '아니요, 멈추세요.' },
      },
      'keep it simple': {
        statement: 'Keep it simple.',
        statementKo: '간단하게 유지하세요.',
        question: 'Should I keep it simple?',
        questionKo: '간단하게 할까요?',
        negative: "Don't make it simple.",
        negativeKo: '너무 단순하진 않게요.',
        shortYes: { en: 'Yes, keep it simple.', ko: '네, 간단하게요.' },
        shortNo: { en: 'No, add more.', ko: '아니요, 더 넣어요.' },
      },
      'keep in touch': {
        statement: 'Keep in touch.',
        statementKo: '연락하고 지내요.',
        question: 'Will you keep in touch?',
        questionKo: '연락하고 지낼까요?',
        negative: "I won't keep in touch.",
        negativeKo: '연락은 안 할 거예요.',
        shortYes: { en: 'Yes, I will.', ko: '네, 할게요.' },
        shortNo: { en: "No, I won't.", ko: '아니요.' },
      },
      'keep the door open': {
        statement: 'Keep the door open.',
        statementKo: '문을 열어 두세요.',
        question: 'Should I keep the door open?',
        questionKo: '문 열어 둘까요?',
        negative: 'Keep the door closed.',
        negativeKo: '문은 닫아 두세요.',
        shortYes: { en: 'Yes, please.', ko: '네, 열어 두세요.' },
        shortNo: { en: 'No, close it.', ko: '아니요, 닫아요.' },
      },
      'make yourself at home': {
        statement: 'Make yourself at home.',
        statementKo: '편하게 있어요.',
        question: 'Can I make myself at home?',
        questionKo: '편하게 있어도 될까요?',
        negative: "Don't make yourself at home.",
        negativeKo: '너무 편하게 있진 마세요.',
        shortYes: { en: 'Yes, you can.', ko: '네, 편하게 있어요.' },
        shortNo: { en: "No, you can't.", ko: '아니요.' },
      },
      "let's make a decision": {
        statement: "Let's make a decision.",
        statementKo: '결정합시다.',
        question: 'Should we make a decision?',
        questionKo: '결정할까요?',
        negative: "Let's not decide yet.",
        negativeKo: '아직은 결정하지 말아요.',
        shortYes: { en: "Yes, let's.", ko: '네, 해요.', acceptedAnswers: ["Yes, let's.", 'Yes, we should.'] },
        shortNo: { en: "No, let's wait.", ko: '아니요, 기다려요.', acceptedAnswers: ['No, wait.'] },
      },
    };

    const hit = specials[lower];
    if (hit) {
      return {
        statement: hit.statement,
        statementKo: hit.statementKo || ko,
        question: hit.question,
        questionKo: hit.questionKo || `${ko}?`,
        negative: hit.negative,
        negativeKo: hit.negativeKo || '',
        shortYes: hit.shortYes,
        shortNo: hit.shortNo,
      };
    }

    if (/^let'?s\b/i.test(base)) {
      const rest = base.replace(/^let'?s\s+/i, '');
      return {
        statement: ensurePeriod(base),
        statementKo: ko,
        question: ensureQuestion(`Should we ${rest}`),
        questionKo: `${stripEnd(ko)}?`,
        negative: ensurePeriod(`Let's not ${rest}`),
        negativeKo: `${stripEnd(ko)} (말아요)`,
        shortYes: { en: "Yes, let's.", ko: '네.', acceptedAnswers: ["Yes, let's.", 'Yes, we should.'] },
        shortNo: { en: "No, let's not.", ko: '아니요.' },
      };
    }

    return {
      statement: ensurePeriod(base),
      statementKo: ko,
      question: ensureQuestion(`Can you ${base.charAt(0).toLowerCase()}${base.slice(1)}`),
      questionKo: `${ko}?`,
      negative: ensurePeriod(`Don't ${base.charAt(0).toLowerCase()}${base.slice(1)}`),
      negativeKo: `${ko} (말고)`,
      shortYes: { en: 'Yes, I can.', ko: '네.' },
      shortNo: { en: "No, I can't.", ko: '아니요.' },
    };
  }

  function buildForms(parts) {
    const shortNoAccepted = parts.shortNo.acceptedAnswers || (
      parts.shortNo.en.includes("n't") ? [parts.shortNo.en.replace("n't", ' not')] : []
    );
    const negativeAccepted = [];
    if (/\bdon't\b/i.test(parts.negative)) negativeAccepted.push(parts.negative.replace(/\bdon't\b/i, 'do not'));
    if (/\bdoesn't\b/i.test(parts.negative)) negativeAccepted.push(parts.negative.replace(/\bdoesn't\b/i, 'does not'));
    if (/\bwon't\b/i.test(parts.negative)) negativeAccepted.push(parts.negative.replace(/\bwon't\b/i, 'will not'));
    if (/\bcan't\b/i.test(parts.negative)) negativeAccepted.push(parts.negative.replace(/\bcan't\b/i, 'cannot'));

    return [
      {
        id: 'statement',
        label: '평서',
        en: parts.statement,
        ko: parts.statementKo,
        cue: '평서문으로 말해 보세요',
      },
      {
        id: 'question',
        label: '의문',
        en: parts.question,
        ko: parts.questionKo,
        cue: '의문문으로 바꿔 보세요',
        baseFormId: 'statement',
      },
      {
        id: 'negative',
        label: '부정',
        en: parts.negative,
        ko: parts.negativeKo || parts.statementKo,
        cue: '부정문으로 바꿔 보세요',
        baseFormId: 'statement',
        acceptedAnswers: negativeAccepted,
      },
      {
        id: 'shortYes',
        label: '짧은 답',
        en: parts.shortYes.en,
        ko: parts.shortYes.ko,
        cue: '짧게 긍정으로 답해 보세요',
        baseFormId: 'question',
        acceptedAnswers: parts.shortYes.acceptedAnswers || [],
      },
      {
        id: 'shortNo',
        label: '짧은 답',
        en: parts.shortNo.en,
        ko: parts.shortNo.ko,
        cue: '짧게 부정으로 답해 보세요',
        baseFormId: 'question',
        acceptedAnswers: shortNoAccepted,
      },
    ];
  }

  function labelFromExpression(expression, verb) {
    const en = stripEnd(enOf(expression));
    const tail = en.replace(/^(i|i'm|i am|we|you|they|it|do you|does it|can i|can you|will you)\s+/i, '');
    return `${verb} · ${tail || en}`.slice(0, 48);
  }

  function fromExpression(expression, options = {}) {
    if (!expression || !expression.id) return null;
    const en = enOf(expression);
    const ko = koOf(expression);
    if (!en) return null;
    const verb = verbWord(expression, options.verbs || []);
    let parts;

    if (isQuestionEn(en)) {
      const statement = questionToStatement(en);
      const shorts = shortAnswersFor(en);
      parts = {
        statement,
        statementKo: ko.replace(/\?$/, '') || ko,
        question: ensureQuestion(stripEnd(en)),
        questionKo: ko.includes('?') ? ko : ensureQuestion(ko),
        negative: statementToNegative(statement),
        negativeKo: `${ko.replace(/\?$/, '')} (아니에요)`,
        shortYes: shorts.yes,
        shortNo: shorts.no,
      };
    } else if (isImperativeEn(en) || isLetsEn(en)) {
      parts = imperativeMatrix(en, ko, expression);
    } else {
      const statement = ensurePeriod(en);
      const question = statementToQuestion(en);
      const shorts = shortAnswersFor(question);
      parts = {
        statement,
        statementKo: ko,
        question,
        questionKo: ko.includes('?') ? ko : `${stripEnd(ko)}?`,
        negative: statementToNegative(en),
        negativeKo: `${stripEnd(ko)} 아니에요.`,
        shortYes: shorts.yes,
        shortNo: shorts.no,
      };
    }

    return {
      id: `m_gen_${expression.id}`,
      baseExpressionId: expression.id,
      coreVerbId: expression.coreVerbId || `v_${verb}`,
      label: labelFromExpression(expression, verb),
      thinkingFrame: `${ko || en} · 묻기·답하기`,
      generated: true,
      forms: buildForms(parts),
    };
  }

  function ensureMatrix(expression, existingMatrices = [], options = {}) {
    if (!expression?.id) return null;
    const found = (existingMatrices || []).find(
      matrix => matrix.baseExpressionId === expression.id || matrix.id === expression.id
    );
    if (found) return found;
    return fromExpression(expression, options);
  }

  return {
    fromExpression,
    ensureMatrix,
    isQuestionEn,
    isImperativeEn,
    statementToQuestion,
    questionToStatement,
  };
});
