import React, { useState, useEffect, useMemo } from 'react';

// تعريف قائمة المستويات المتدرجة بالكامل مع الدقائق الخاصة بكل مستوى
const LEVELS = [
  { id: 1, title: "الساعة بالضبط", offset: 0, desc: "تعليم قراءة الساعة عندما يكون عقرب الدقائق الأحمر عند الرقم 12 بالضبط.", rule: "الدقائق دائماً :00" },
  { id: 2, title: "وربع ساعة", offset: 15, desc: "نضيف ربع ساعة (15 دقيقة) ويكون العقرب الأحمر عند الرقم 3.", rule: "الدقائق دائماً :15" },
  { id: 3, title: "ونصف ساعة", offset: 30, desc: "نضيف نصف ساعة (30 دقيقة) ويكون العقرب الأحمر عند الرقم 6.", rule: "الدقائق دائماً :30" },
  { id: 4, title: "إلا ربع ساعة", offset: 45, desc: "نضيف خمس وأربعين دقيقة (إلا ربع) ويكون العقرب الأحمر عند الرقم 9.", rule: "الدقائق دائماً :45" },
  { id: 5, title: "وخمس دقائق", offset: 5, desc: "نضيف 5 دقائق ويكون العقرب الأحمر عند الرقم 1.", rule: "الدقائق دائماً :05" },
  { id: 6, title: "وعشر دقائق", offset: 10, desc: "نضيف 10 دقائق ويكون العقرب الأحمر عند الرقم 2.", rule: "الدقائق دائماً :10" },
  { id: 7, title: "وثلث (٢٠ دقيقة)", offset: 20, desc: "نضيف 20 دقيقة ويكون العقرب الأحمر عند الرقم 4.", rule: "الدقائق دائماً :20" },
  { id: 8, title: "ونصف إلا خمسة (٢٥ دقيقة)", offset: 25, desc: "نضيف 25 دقيقة ويكون العقرب الأحمر عند الرقم 5.", rule: "الدقائق دائماً :25" },
  { id: 9, title: "ونصف وخمسة (٣٥ دقيقة)", offset: 35, desc: "نضيف 35 دقيقة ويكون العقرب الأحمر عند الرقم 7.", rule: "الدقائق دائماً :35" },
  { id: 10, title: "إلا ثلث (٤٠ دقيقة)", offset: 40, desc: "نضيف 40 دقيقة ويكون العقرب الأحمر عند الرقم 8.", rule: "الدقائق دائماً :40" },
  { id: 11, title: "إلا عشر دقائق (٥٠ دقيقة)", offset: 50, desc: "نضيف 50 دقيقة ويكون العقرب الأحمر عند الرقم 10.", rule: "الدقائق دائماً :50" },
  { id: 12, title: "إلا خمس دقائق (٥٥ دقيقة)", offset: 55, desc: "نضيف 55 دقيقة ويكون العقرب الأحمر عند الرقم 11.", rule: "الدقائق دائماً :55" }
];

const HOURS_ARABIC = [
  "الثانية عشرة", "الواحدة", "الثانية", "الثالثة", "الرابعة", 
  "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة", "الحادية عشرة"
];

export default function App() {
  // حالة التطبيق العامة
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [appMode, setAppMode] = useState('learn'); // 'learn' أو 'quiz'
  const [currentHour, setCurrentHour] = useState(11); // تبدأ افتراضياً بالحادية عشرة
  const [currentMinute, setCurrentMinute] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  
  // حالة الاختبار (Quiz)
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [answeredState, setAnsweredState] = useState(null); // { selected, correct, isCorrect }
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelToUnlock, setLevelToUnlock] = useState(null);

  // تشغيل المؤثرات الصوتية مبرمجة داخلياً (Web Audio API) لتجنب الروابط الخارجية
  const playTone = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'success') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.15);
        osc2.start(audioCtx.currentTime + 0.15);
        osc2.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'fail') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'levelup') {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + (idx * 0.1));
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + (idx * 0.1));
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (idx * 0.1) + 0.3);
          osc.start(audioCtx.currentTime + (idx * 0.1));
          osc.stop(audioCtx.currentTime + (idx * 0.1) + 0.3);
        });
      }
    } catch (e) {
      console.log("Audio feedback error or gesture required.");
    }
  };

  // دالة نطق الوقت باستخدام محرك تمثيل النص الصوتي بالمتصفح
  const speakTime = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // إلغاء أي نطق جارٍ حالياً
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.pitch = 1.2; // جعل الصوت كرتوني مبهج ومناسب للأطفال
      utterance.rate = 0.85; // إبطاء النطق قليلاً للوضوح
      window.speechSynthesis.speak(utterance);
    }
  };

  // دالة تحويل الوقت إلى لفظ عربي منسق
  const translateTimeToArabic = (hour, minute) => {
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
    const hourWord = HOURS_ARABIC[normalizedHour % 12];
    
    if (minute === 0) return `${hourWord} تماماً`;
    if (minute === 5) return `${hourWord} وخمس دقائق`;
    if (minute === 10) return `${hourWord} وعشر دقائق`;
    if (minute === 15) return `${hourWord} والربع`;
    if (minute === 20) return `${hourWord} والثلث`;
    if (minute === 25) return `${hourWord} ونصف إلا خمس دقائق`;
    if (minute === 30) return `${hourWord} والنصف`;
    if (minute === 35) return `${hourWord} ونصف وخمس دقائق`;
    if (minute === 40) return `الساعة ${HOURS_ARABIC[(normalizedHour + 1) % 12]} إلا ثلثاً`;
    if (minute === 45) return `الساعة ${HOURS_ARABIC[(normalizedHour + 1) % 12]} إلا ربعاً`;
    if (minute === 50) return `الساعة ${HOURS_ARABIC[(normalizedHour + 1) % 12]} إلا عشر دقائق`;
    if (minute === 55) return `الساعة ${HOURS_ARABIC[(normalizedHour + 1) % 12]} إلا خمس دقائق`;
    
    return `الساعة ${hourWord} و ${minute} دقيقة`;
  };

  // توليد سؤال اختبار جديد
  const generateQuizQuestion = (levelId) => {
    const targetHour = Math.floor(Math.random() * 12) + 1;
    const currentLvl = LEVELS.find(l => l.id === levelId);
    const targetMinute = currentLvl.offset;

    const correctStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const options = [correctStr];

    // توليد بقية الخيارات الـثلاثة بطريقة ذكية وغير مكررة
    while (options.length < 4) {
      const randomHour = Math.floor(Math.random() * 12) + 1;
      const randomLevelIdx = Math.floor(Math.random() * unlockedLevels.length);
      const randomMinute = LEVELS[unlockedLevels[randomLevelIdx] - 1].offset;
      const optionStr = `${String(randomHour).padStart(2, '0')}:${String(randomMinute).padStart(2, '0')}`;
      
      if (!options.includes(optionStr)) {
        options.push(optionStr);
      }
    }

    // خلط الخيارات عشوائياً
    options.sort(() => Math.random() - 0.5);

    setQuizQuestion({
      hour: targetHour,
      minute: targetMinute,
      correctOption: correctStr,
      options: options,
      arabicText: translateTimeToArabic(targetHour, targetMinute)
    });
    setAnsweredState(null);

    // تغيير عقارب الساعة التفاعلية لتطابق السؤال
    setCurrentHour(targetHour);
    setCurrentMinute(targetMinute);
  };

  // اختيار مستوى محدد
  const handleSelectLevel = (levelId) => {
    if (!unlockedLevels.includes(levelId)) return;
    setCurrentLevelId(levelId);
    const selectedLvl = LEVELS.find(l => l.id === levelId);
    
    if (appMode === 'learn') {
      setCurrentMinute(selectedLvl.offset);
    } else {
      generateQuizQuestion(levelId);
    }
  };

  // تغيير نمط التشغيل (تعلم / اختبار)
  const handleSetMode = (mode) => {
    setAppMode(mode);
    if (mode === 'quiz') {
      setQuizStreak(0);
      generateQuizQuestion(currentLevelId);
    } else {
      const activeLvl = LEVELS.find(l => l.id === currentLevelId);
      setCurrentMinute(activeLvl.offset);
    }
  };

  // الإجابة على السؤال
  const handleSubmitAnswer = (selected) => {
    if (answeredState) return; // تم الإجابة مسبقاً

    const isCorrect = selected === quizQuestion.correctOption;
    setAnsweredState({
      selected,
      correct: quizQuestion.correctOption,
      isCorrect
    });

    if (isCorrect) {
      playTone('success');
      setQuizScore(prev => prev + 10);
      setQuizStreak(prev => {
        const nextStreak = prev + 1;
        if (nextStreak >= 5) {
          // فتح المستوى القادم إذا لم يكن مفتوحاً بالفعل
          const nextLvlId = currentLevelId + 1;
          if (nextLvlId <= LEVELS.length && !unlockedLevels.includes(nextLvlId)) {
            setTimeout(() => {
              setUnlockedLevels(prevUnlocks => [...prevUnlocks, nextLvlId]);
              setLevelToUnlock(nextLvlId);
              setShowLevelUpModal(true);
              playTone('levelup');
            }, 800);
          }
          return 5; // تثبيت العداد على 5 حتى إغلاق النافذة
        }
        return nextStreak;
      });

      // الانتقال للسؤال التالي تلقائياً بعد ثانيتين
      setTimeout(() => {
        generateQuizQuestion(currentLevelId);
      }, 2000);
    } else {
      playTone('fail');
      setQuizStreak(0);
      
      // الانتقال للسؤال التالي تلقائياً بعد 3 ثوانٍ
      setTimeout(() => {
        generateQuizQuestion(currentLevelId);
      }, 3000);
    }
  };

  // تعديل الساعات يدوياً في وضع التعلم
  const handleAddHour = (val) => {
    setCurrentHour(prev => {
      let next = prev + val;
      if (next > 12) return 1;
      if (next < 1) return 12;
      return next;
    });
  };

  // التفاعل باللمس/الضغط مباشرة على أرقام الساعة لتعيين الساعة
  const handleClockNumberClick = (hourNum) => {
    if (appMode === 'learn') {
      setCurrentHour(hourNum);
    }
  };

  // حساب زوايا العقارب بالدرجات بشكل ديناميكي
  const minuteAngle = useMemo(() => currentMinute * 6, [currentMinute]);
  const hourAngle = useMemo(() => {
    const normHour = currentHour % 12;
    return (normHour * 30) + (currentMinute * 0.5);
  }, [currentHour, currentMinute]);

  // توليد علامات الدقائق الصغيرة المحيطة بالساعة
  const clockTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      if (i % 5 !== 0) {
        ticks.push(
          <line
            key={i}
            x1="0"
            y1="-130"
            x2="0"
            y2="-135"
            stroke="#94a3b8"
            strokeWidth="1"
            transform={`rotate(${i * 6})`}
          />
        );
      } else {
        ticks.push(
          <line
            key={i}
            x1="0"
            y1="-125"
            x2="0"
            y2="-135"
            stroke="#1e293b"
            strokeWidth="2.5"
            transform={`rotate(${i * 6})`}
          />
        );
      }
    }
    return ticks;
  }, []);

  // المزامنة عند تغيير المستوى في نمط التعلم
  useEffect(() => {
    if (appMode === 'learn') {
      const activeLvl = LEVELS.find(l => l.id === currentLevelId);
      setCurrentMinute(activeLvl.offset);
    }
  }, [currentLevelId, appMode]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50 to-indigo-50 text-slate-800 font-sans" dir="rtl">
      
      {/* شريط الرأس المميز */}
      <header className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-md py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full flex items-center justify-center w-12 h-12">
              <span className="text-2xl animate-bounce">🕒</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-wide">مُعلّم الساعة الذكي للرواّد الصغار ⏱️</h1>
              <p className="text-xs text-blue-100 font-bold">رحلتك الممتعة لإتقان قراءة عقارب الساعة والساعة الرقمية بدقة</p>
            </div>
          </div>
          
          {/* تبديل الأنماط */}
          <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/20">
            <button
              onClick={() => handleSetMode('learn')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                appMode === 'learn' ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-white hover:bg-white/10'
              }`}
            >
              <span>🎓</span> وضع التعلّم
            </button>
            <button
              onClick={() => handleSetMode('quiz')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                appMode === 'quiz' ? 'bg-white text-indigo-700 shadow-md scale-105' : 'text-white hover:bg-white/10'
              }`}
            >
              <span>🎮</span> وضع الاختبار واللعب
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي للمشروع */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* العمود الأيمن: قائمة مستويات التعلم الاثني عشر */}
        <section className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col h-fit lg:sticky lg:top-24">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <span>📌</span> اختر المستوى التعليمي
            </h2>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
              المستوى {currentLevelId} / 12
            </span>
          </div>
          
          {/* مستويات التعلم */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 pl-1 flex-grow">
            {LEVELS.map((lvl) => {
              const isUnlocked = unlockedLevels.includes(lvl.id);
              const isActive = lvl.id === currentLevelId;

              return (
                <button
                  key={lvl.id}
                  onClick={() => handleSelectLevel(lvl.id)}
                  disabled={!isUnlocked}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-right transition-all duration-200 border ${
                    isActive
                      ? "bg-gradient-to-l from-indigo-600 to-blue-600 text-white shadow-md border-indigo-600 scale-[1.01]"
                      : isUnlocked
                      ? "bg-slate-50 text-slate-700 hover:bg-indigo-50 border-slate-100"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                        isActive ? "bg-white text-indigo-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {lvl.id}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm">{lvl.title}</h4>
                      <span className="text-[10px] block opacity-80">{lvl.rule}</span>
                    </div>
                  </div>
                  <div>
                    {isActive ? (
                      <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">نشط</span>
                    ) : isUnlocked ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">مفتوح</span>
                    ) : (
                      <span>🔒</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* نصائح ومساعدات ذكية للأطفال */}
          <div className="mt-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-xs text-amber-800">
            <span className="text-lg animate-pulse">💡</span>
            <div>
              <strong className="block mb-0.5">مساعد ذكي للطفل:</strong>
              العقرب <span className="text-blue-600 font-bold">الأزرق القصير</span> يشير للساعات، والعقرب <span className="text-red-500 font-bold">الأحمر الطويل</span> يشير للدقائق!
            </div>
          </div>
        </section>

        {/* العمود الأيسر: ساحة الساعة التفاعلية والتحكم والمسابقات */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* لوحة تفاصيل ومعلومات المستوى الجاري */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                المستوى الحالي
              </span>
              <h3 className="text-xl font-extrabold text-slate-800 mt-2">
                {LEVELS[currentLevelId - 1].title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {LEVELS[currentLevelId - 1].desc}
              </p>
            </div>
            
            {/* مؤشر تقدم ونقاط الاختبار */}
            {appMode === 'quiz' && (
              <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-indigo-100 text-center min-w-[140px]">
                <span className="text-xs text-slate-500 block font-bold">النقاط الكلية ⭐</span>
                <span className="text-2xl font-extrabold text-indigo-600">{quizScore}</span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {quizStreak >= 5 ? "تم فك قفل المستوى بنجاح!" : `أجب صحيحاً ${5 - quizStreak} مرات للترقية!`}
                </span>
              </div>
            )}
          </div>

          {/* لوحة العرض التفاعلي الأساسية (الساعة ذات العقارب وبأسفلها الساعة الرقمية) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative">
            
            {/* إرشاد تفاعلي قصير */}
            {appMode === 'learn' && (
              <span className="text-xs font-bold text-indigo-500 mb-3 animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                💡 اضغط على الأرقام الدائرية لتغيير عقرب الساعات فوراً!
              </span>
            )}

            {/* ساعة العقارب التفاعلية المصممة بـ SVG لضمان التجاوب الفائق */}
            <div className="relative w-72 h-72 md:w-80 md:h-80 bg-slate-50 rounded-full border-[10px] border-slate-800 shadow-inner flex items-center justify-center">
              
              {/* الأرقام الدائرية للساعات - قابلة للنقر لتعيين الساعة مباشرة بذكاء */}
              <div className="absolute inset-0 w-full h-full p-5 z-20">
                <div className="relative w-full h-full text-slate-800 font-extrabold text-xl md:text-2xl">
                  <span onClick={() => handleClockNumberClick(12)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "0%", left: "50%", transform: "translate(-50%, 0%)" }}>12</span>
                  <span onClick={() => handleClockNumberClick(1)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "6.7%", right: "25%", transform: "translate(50%, -50%)" }}>1</span>
                  <span onClick={() => handleClockNumberClick(2)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "25%", right: "6.7%", transform: "translate(50%, -50%)" }}>2</span>
                  <span onClick={() => handleClockNumberClick(3)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "50%", right: "0%", transform: "translate(0%, -50%)" }}>3</span>
                  <span onClick={() => handleClockNumberClick(4)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ bottom: "25%", right: "6.7%", transform: "translate(50%, 50%)" }}>4</span>
                  <span onClick={() => handleClockNumberClick(5)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ bottom: "6.7%", right: "25%", transform: "translate(50%, 50%)" }}>5</span>
                  <span onClick={() => handleClockNumberClick(6)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ bottom: "0%", left: "50%", transform: "translate(-50%, 0%)" }}>6</span>
                  <span onClick={() => handleClockNumberClick(7)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ bottom: "6.7%", left: "25%", transform: "translate(-50%, 50%)" }}>7</span>
                  <span onClick={() => handleClockNumberClick(8)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ bottom: "25%", left: "6.7%", transform: "translate(-50%, 50%)" }}>8</span>
                  <span onClick={() => handleClockNumberClick(9)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "50%", left: "0%", transform: "translate(0%, -50%)" }}>9</span>
                  <span onClick={() => handleClockNumberClick(10)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "25%", left: "6.7%", transform: "translate(-50%, -50%)" }}>10</span>
                  <span onClick={() => handleClockNumberClick(11)} className={`absolute cursor-pointer hover:scale-125 transition-all p-1.5 rounded-full ${appMode === 'learn' ? 'hover:bg-blue-100' : ''}`} style={{ top: "6.7%", left: "25%", transform: "translate(-50%, -50%)" }}>11</span>
                </div>
              </div>

              {/* تدريجات الدقائق الصغيرة الدائرية */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0" viewBox="0 0 300 300">
                <g transform="translate(150, 150)">
                  <circle cx="0" cy="0" r="135" fill="none" stroke="#000" strokeWidth="1" />
                  {clockTicks}
                </g>
              </svg>

              {/* النقطة المركزية الفاخرة للساعة */}
              <div className="absolute w-6 h-6 bg-yellow-400 rounded-full border-4 border-slate-800 z-30 shadow-md"></div>

              {/* عقرب الساعات (أزرق عريض وقصير لسهولة التعلم) */}
              <div 
                id="hour-hand" 
                className="hand absolute bg-blue-600 rounded-full z-10" 
                style={{ 
                  width: '8px', 
                  height: '65px', 
                  bottom: '50%', 
                  transform: `rotate(${hourAngle}deg)`,
                  transformOrigin: 'bottom center'
                }}
              >
                <div className="absolute top-0 left-0 w-2 h-3 bg-blue-700 rounded-full -mt-1.5"></div>
              </div>

              {/* عقرب الدقائق (أحمر رفيع وطويل لسهولة التعلم والتمييز) */}
              <div 
                id="minute-hand" 
                className="hand absolute bg-red-500 rounded-full z-20" 
                style={{ 
                  width: '5px', 
                  height: '100px', 
                  bottom: '50%', 
                  transform: `rotate(${minuteAngle}deg)`,
                  transformOrigin: 'bottom center'
                }}
              >
                <div className="absolute top-0 left-0 w-1.5 h-3 bg-red-600 rounded-full -mt-2"></div>
              </div>
            </div>

            {/* الساعة الرقمية في الأسفل بالاتجاه اللاتيني القسري LTR لتجنب أي انعكاس */}
            <div className="mt-8 flex flex-col items-center w-full">
              <span className="text-xs text-slate-400 font-bold mb-1 tracking-wider">
                الوقت بصيغة الساعة الرقمية
              </span>
              
              {/* إخفاء الساعة الرقمية والمنطوقة في وضع الاختبار لغرض التقييم */}
              {appMode === 'learn' ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div 
                    dir="ltr" 
                    className="flex items-center gap-1.5 bg-slate-900 text-green-400 font-mono text-3xl md:text-4xl px-6 py-3 rounded-2xl shadow-xl border-2 border-slate-700 tracking-widest min-w-[180px] justify-center select-none"
                  >
                    <span>{String(currentHour).padStart(2, '0')}</span>
                    <span className="animate-pulse">:</span>
                    <span>{String(currentMinute).padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 text-indigo-800 px-5 py-1.5 rounded-full text-sm font-bold border border-indigo-100">
                      {translateTimeToArabic(currentHour, currentMinute)}
                    </div>
                    {/* زر نطق الوقت المدمج */}
                    <button
                      onClick={() => speakTime(translateTimeToArabic(currentHour, currentMinute))}
                      className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-all duration-200"
                      title="استمع لنطق الوقت"
                    >
                      🔊 استمع
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-400 font-bold px-6 py-3 rounded-2xl border-2 border-slate-200 border-dashed text-sm tracking-wide">
                  🕵️ اقرأ عقارب الساعة واكتب الجواب بالأسفل!
                </div>
              )}
            </div>
          </div>

          {/* لوحة التحكم السفلية المخصصة حسب وضع العمل الحالي */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[180px] flex items-center justify-center">
            {appMode === 'learn' ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <h4 className="text-sm font-bold text-slate-500 mb-2">
                  اضبط الساعات بنفسك لترى حركة العقارب!
                </h4>
                
                <div className="flex items-center gap-6 justify-center w-full max-w-sm">
                  <button 
                    onClick={() => handleAddHour(-1)} 
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 active:scale-95 text-blue-800 text-2xl rounded-2xl flex items-center justify-center transition-all"
                    title="ساعة للخلف"
                  >
                    ➖
                  </button>
                  <div className="text-center flex-grow">
                    <span className="text-xs text-blue-500 font-bold block">تغيير الساعات</span>
                    <span className="text-xl font-bold text-slate-700">الساعة {currentHour}</span>
                  </div>
                  <button 
                    onClick={() => handleAddHour(1)} 
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 active:scale-95 text-blue-800 text-2xl rounded-2xl flex items-center justify-center transition-all"
                    title="ساعة للأمام"
                  >
                    ➕
                  </button>
                </div>

                <div className="w-full mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs md:text-sm text-slate-600 leading-relaxed">
                  في هذا المستوى، نثبّت عقرب الدقائق عند 
                  <span className="text-red-600 font-bold mx-1">
                    {currentMinute === 0 ? 'الـ 12 تماماً' : 'الرقم ' + (currentMinute/5 || currentMinute)}
                  </span> 
                  ليطابق تحديات هذا المستوى. اضغط على أرقام الساعات في واجهة الساعة لتغيير الساعة مباشرة!
                </div>
              </div>
            ) : (
              // وضع الاختبار (Quiz) وعرض الخيارات المتعددة والنتائج
              quizQuestion && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="text-center mb-2">
                    <h4 className="text-base font-extrabold text-indigo-700">
                      🎯 ما هو التوقيت الرقمي الصحيح المطابق لعقارب الساعة؟
                    </h4>
                  </div>

                  {/* شبكة أزرار الخيارات الرقمية بلغة LTR قسرية */}
                  <div dir="ltr" className="grid grid-cols-2 gap-3 w-full max-w-md">
                    {quizQuestion.options.map((opt, idx) => {
                      let btnStyle = "bg-slate-50 border-slate-100 hover:border-indigo-200 text-slate-700 hover:bg-indigo-50";
                      
                      if (answeredState) {
                        if (opt === answeredState.correct) {
                          btnStyle = "bg-emerald-500 text-white border-emerald-500 correct-pulse";
                        } else if (opt === answeredState.selected && !answeredState.isCorrect) {
                          btnStyle = "bg-red-500 text-white border-red-500";
                        } else {
                          btnStyle = "bg-slate-50 text-slate-300 border-slate-100 opacity-50 cursor-not-allowed";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={!!answeredState}
                          onClick={() => handleSubmitAnswer(opt)}
                          className={`py-3.5 px-4 border-2 rounded-2xl text-lg font-bold tracking-wider transition-all duration-150 active:scale-95 ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* رسالة النتيجة الفورية للإجابات */}
                  {answeredState && (
                    <div 
                      className={`w-full text-center p-3 rounded-2xl text-sm font-bold border transition-all duration-300 ${
                        answeredState.isCorrect 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {answeredState.isCorrect ? (
                        <span>✨ رائع جداً وبطل متميز! إجابة صحيحة ({quizQuestion.arabicText})</span>
                      ) : (
                        <span>❌ حاول مرة أخرى! الإجابة الصحيحة هي {answeredState.correct}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

        </section>

      </main>

      {/* نافذة الترقية والاحتفال التفاعلية المبهجة بالألوان للأطفال عند فتح مستوى جديد */}
      {showLevelUpModal && levelToUnlock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-yellow-400 transform scale-100 transition-all animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-extrabold text-slate-800">إنجاز رائع وبطل حقيقي!</h3>
            <p className="text-slate-600 text-sm mt-2">لقد أثبتّ جدارتك الفائقة وتم بنجاح فتح المستوى الجديد:</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl py-3.5 px-4 my-4">
              <span className="text-xs text-yellow-700 font-bold block">المستوى الجديد {levelToUnlock}</span>
              <strong className="text-lg text-slate-800">{LEVELS[levelToUnlock - 1].title}</strong>
            </div>

            <button 
              onClick={() => {
                setShowLevelUpModal(false);
                setCurrentLevelId(levelToUnlock);
                setLevelToUnlock(null);
                setQuizStreak(0);
              }} 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl hover:shadow-lg transition-all"
            >
              ابدأ المستوى الجديد الآن 🚀
            </button>
          </div>
        </div>
      )}

      {/* تذييل الصفحة */}
      <footer className="bg-slate-800 text-slate-400 text-center py-4 text-xs border-t border-slate-700">
        <p>مُعلّم الساعة الذكي للرواّد الصغار برعاية React التفاعلية © ٢٠٢٦.</p>
      </footer>

    </div>
  );
}