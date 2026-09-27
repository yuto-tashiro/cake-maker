import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ChefHat,
  CircleHelp,
  Gift,
  Heart,
  House,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Cake } from "./components/Cake";
import {
  completeOrder,
  generateOrder,
  ingredients,
  readStats,
  STORAGE_KEY,
  validateOrder,
  type Counts,
  type Order,
} from "./game/engine";
const customers = [
  { emoji: "🐰", name: "うさぎ", color: "#f7e7e6" },
  { emoji: "🐻", name: "くま", color: "#f1e6d2" },
  { emoji: "🐱", name: "ねこ", color: "#fce8c4" },
  { emoji: "🐼", name: "パンダ", color: "#e1ece3" },
  { emoji: "🦊", name: "きつね", color: "#ffe1cf" },
];
type Screen = "home" | "game" | "result";
export default function App() {
  const [stats, setStats] = useState(readStats);
  const [screen, setScreen] = useState<Screen>("home");
  const [order, setOrder] = useState<Order>(() =>
    generateOrder(stats.level, stats.unlocked),
  );
  const [counts, setCounts] = useState<Counts>({});
  const [served, setServed] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const [sessionPerfect, setSessionPerfect] = useState(0);
  const [hint, setHint] = useState("");
  const [won, setWon] = useState(false);
  const [modal, setModal] = useState<"help" | "shop" | "leave" | null>(null);
  const [saveError, setSaveError] = useState(false);
  const startTime = useRef(Date.now());
  const submitting = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const customer = customers[served % customers.length];
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [stats]);
  useEffect(() => {
    if (modal || won) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal, won]);
  useEffect(() => {
    titleRef.current?.focus();
  }, [screen]);
  function sound(success = false) {
    if (!stats.sound) return;
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      void ctx.resume();
      (success ? [523, 659, 784, 1047] : [660]).forEach((frequency, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const time = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.09, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
        oscillator.start(time);
        oscillator.stop(time + 0.25);
      });
    } catch {
      /* Sound is optional; the game remains playable without audio. */
    }
  }
  function start() {
    setServed(0);
    setSessionPerfect(0);
    setStats((s) => ({ ...s, playCount: s.playCount + 1 }));
    newOrder();
    setScreen("game");
  }
  function newOrder() {
    setOrder(generateOrder(stats.level, stats.unlocked, order));
    setCounts({});
    setCorrections(0);
    setHint("");
    setWon(false);
    submitting.current = false;
    startTime.current = Date.now();
  }
  function change(id: (typeof ingredients)[number]["id"], delta: number) {
    if (won) return;
    setCounts((c) => ({
      ...c,
      [id]: Math.max(0, Math.min(5, (c[id] ?? 0) + delta)),
    }));
    setHint("");
    sound();
  }
  function submit() {
    if (submitting.current) return;
    const mismatch = validateOrder(order, counts);
    if (mismatch.length) {
      const { ingredient, difference, actual, wanted } = mismatch[0];
      setCorrections((n) => n + 1);
      setHint(
        `${ingredient.emoji} ${ingredient.name}は いま ${actual}こ。ちゅうもんは ${wanted}こ。${difference > 0 ? `あと ${difference}こ のせてみよう！` : `${-difference}こ へらしてみよう！`}`,
      );
      return;
    }
    submitting.current = true;
    setStats((s) =>
      completeOrder(
        s,
        order,
        corrections,
        Math.max(1, Math.round((Date.now() - startTime.current) / 1000)),
      ),
    );
    if (!corrections) setSessionPerfect((n) => n + 1);
    setWon(true);
    sound(true);
  }
  function next() {
    setWon(false);
    if (served === 4) setScreen("result");
    else {
      setServed((n) => n + 1);
      newOrder();
    }
  }
  const visibleIngredients = ingredients.filter((i) =>
    stats.unlocked.includes(i.id),
  );
  return (
    <div className="app-shell">
      <header className="header">
        <button
          className="brand"
          onClick={() =>
            screen === "game" ? setModal("leave") : setScreen("home")
          }
          aria-label="おみせにもどる"
        >
          <span className="brand-icon">
            <ChefHat size={25} />
          </span>
          <span>
            わくわく<span className="brand-small">ケーキやさん</span>
          </span>
        </button>
        <div className="header-actions">
          <span className="star-bank">
            <Star size={19} fill="currentColor" /> {stats.stars}
            <small>こ</small>
          </span>
          <button
            className="icon-button"
            onClick={() => setStats((s) => ({ ...s, sound: !s.sound }))}
            aria-label={stats.sound ? "おとを けす" : "おとを だす"}
            aria-pressed={stats.sound}
          >
            {stats.sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("help")}
            aria-label="あそびかた"
          >
            <CircleHelp size={21} />
          </button>
        </div>
      </header>
      <div className="awning" aria-hidden="true" />
      <main>
        {screen === "home" && (
          <section className="home">
            <div className="eyebrow">
              <span /> ちいさな パティシエに なろう <span />
            </div>
            <h1 ref={titleRef} tabIndex={-1}>
              かぞえて、かざって、
              <br />
              <span>みんな にっこり。</span>
            </h1>
            <p className="home-subtitle">
              あなただけの ケーキやさん、はじめよう！
            </p>
            <div className="hero-scene">
              <span className="scene-sparkle sparkle-one">✦</span>
              <span className="scene-sparkle sparkle-two">✧</span>
              <div className="speech speech-left">
                おいしい ケーキを
                <br />
                おねがいね！
                <Heart size={14} fill="currentColor" />
              </div>
              <span className="hero-bunny">🐰</span>
              <div className="hero-cake-wrap">
                <Cake hero counts={{ strawberry: 3, chocolate: 2 }} />
              </div>
              <span className="hero-bear">🐻</span>
              <div className="scene-label">
                <ChefHat size={17} /> きょうの パティシエは あなた
              </div>
            </div>
            <button className="primary open-button" onClick={start}>
              おみせを ひらく！
              <ArrowRight size={23} />
            </button>
            <p className="tiny-note">
              じかんせいげん なし。ゆっくり つくってね。
            </p>
            <div className="home-links">
              <button onClick={() => setModal("help")}>
                <CircleHelp size={19} /> あそびかた
              </button>
              <span />
              <button onClick={() => setModal("shop")}>
                <Gift size={19} /> ごほうびのおみせ
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="how-preview">
              <div>
                <span className="step-number">1</span>
                <span className="step-emoji">📋</span>
                <p>ちゅうもんを みて</p>
              </div>
              <ChevronRight className="step-arrow" />
              <div>
                <span className="step-number">2</span>
                <span className="step-emoji">🍓</span>
                <p>かぞえて のせよう</p>
              </div>
              <ChevronRight className="step-arrow" />
              <div>
                <span className="step-number">3</span>
                <span className="step-emoji">🍰</span>
                <p>できたら おとどけ！</p>
              </div>
            </div>
            {stats.cakesCompleted > 0 && (
              <p className="saved-record">
                これまでに つくった ケーキ{" "}
                <strong>{stats.cakesCompleted}こ</strong> <span>・</span> レベル{" "}
                {stats.level}
              </p>
            )}
          </section>
        )}
        {screen === "game" && (
          <section className="game">
            <div className="game-top">
              <button className="text-button" onClick={() => setModal("leave")}>
                <ArrowLeft size={18} /> おみせ
              </button>
              <div
                className="progress"
                aria-label={`${served + 1}にんめ、ぜんぶで5にん`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i < served ? "done" : i === served ? "current" : ""
                    }
                  >
                    {i < served ? <Check size={14} /> : i + 1}
                  </span>
                ))}
              </div>
              <span className="level">レベル {order.difficulty}</span>
            </div>
            <h1 className="game-title" ref={titleRef} tabIndex={-1}>
              おいしい ケーキを つくろう！
            </h1>
            <div className="workspace">
              <aside className="order-panel">
                <div
                  className="customer"
                  style={{ background: customer.color }}
                >
                  <span>{customer.emoji}</span>
                  <span className="customer-heart">♥</span>
                </div>
                <p className="customer-name">
                  {customer.name}さんの ちゅうもん
                </p>
                <div className="order-ticket">
                  <div className="ticket-title">
                    <span /> おねがいします！ <span />
                  </div>
                  {order.items.map((item) => {
                    const ingredient = ingredients.find(
                      (i) => i.id === item.ingredientId,
                    )!;
                    return (
                      <div className="order-item" key={ingredient.id}>
                        <span className="order-emoji">{ingredient.emoji}</span>
                        <div>
                          {ingredient.name}
                          <div className="quantity-dots" aria-hidden="true">
                            {Array.from({ length: item.quantity }, (_, i) => (
                              <i key={i} />
                            ))}
                          </div>
                        </div>
                        <span className="order-quantity">
                          {item.quantity}
                          <small>こ</small>
                        </span>
                      </div>
                    );
                  })}
                  <div className="ticket-bottom">
                    おいしく つくってね <Heart size={13} />
                  </div>
                </div>
                <p className="gentle-note">
                  <Heart size={14} /> あわてなくて だいじょうぶ
                </p>
              </aside>
              <div className="make-panel">
                <div className="cake-heading">
                  <span>
                    <Sparkles size={17} /> あなたの ケーキ
                  </span>
                  <span className="total-count">
                    ぜんぶで{" "}
                    <strong>
                      {Object.values(counts).reduce((s, n) => s + n, 0)}
                    </strong>
                    こ
                  </span>
                </div>
                <div className="cake-stage">
                  <span className="stage-sparkle">✧</span>
                  <Cake counts={counts} />
                  <span className="stage-dot" />
                </div>
                <p className="ingredient-instruction">
                  ざいりょうを タップして のせよう <span>↓</span>
                </p>
                <div className="ingredient-grid">
                  {visibleIngredients.map((i) => (
                    <div className={`ingredient-card ${i.color}`} key={i.id}>
                      <button
                        className="ingredient-add"
                        onClick={() => change(i.id, 1)}
                        disabled={(counts[i.id] ?? 0) >= 5 || won}
                        aria-label={`${i.name}を のせる`}
                      >
                        <span>{i.emoji}</span>
                        <small>{i.name}</small>
                      </button>
                      <div className="counter">
                        <button
                          aria-label={`${i.name}を へらす`}
                          disabled={!counts[i.id] || won}
                          onClick={() => change(i.id, -1)}
                        >
                          <Minus size={18} />
                        </button>
                        <output aria-label={`${i.name}の かず`}>
                          {counts[i.id] ?? 0}
                        </output>
                        <button
                          aria-label={`${i.name}を ふやす`}
                          disabled={(counts[i.id] ?? 0) >= 5 || won}
                          onClick={() => change(i.id, 1)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`hint ${hint ? "visible" : ""}`} role="status">
              {hint || "まちがえても だいじょうぶ。「−」で へらせるよ。"}
            </div>
            <button
              className="primary complete-button"
              disabled={won}
              onClick={submit}
            >
              <Check size={23} /> できた！
            </button>
            <p className="tiny-note">ちゅうもんと おなじに なったかな？</p>
          </section>
        )}
        {screen === "result" && (
          <section className="result">
            <div className="eyebrow">また あそびにきてね</div>
            <span className="result-icon">🏅</span>
            <h1 ref={titleRef} tabIndex={-1}>
              きょうの おしごと
              <br />
              <span>おしまい！</span>
            </h1>
            <p>みんな とっても よろこんでいたよ。</p>
            <div className="result-stats">
              <div>
                🍰
                <strong>
                  5<small>こ</small>
                </strong>
                <span>つくった ケーキ</span>
              </div>
              <div>
                ⭐
                <strong>
                  15<small>こ</small>
                </strong>
                <span>もらった スター</span>
              </div>
            </div>
            <p className="perfect-note">
              ✨ いっぱつで できた ケーキは {sessionPerfect}こ！
            </p>
            <button className="primary" onClick={start}>
              <RotateCcw size={20} /> もういちど あそぶ
            </button>
            <button className="secondary" onClick={() => setModal("shop")}>
              <Gift size={19} /> ごほうびのおみせ
            </button>
            <button className="text-button" onClick={() => setScreen("home")}>
              <House size={18} /> おみせにもどる
            </button>
          </section>
        )}
      </main>
      <footer>
        <span>
          made with <Heart size={12} fill="currentColor" /> & a little sugar
        </span>
        <span>わくわくケーキやさん</span>
      </footer>
      {saveError && (
        <p className="save-warning" role="status">
          きろくを ほぞんできません。このまま あそべますが、がめんを とじると
          きろくが きえることが あります。
        </p>
      )}
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (won) event.preventDefault();
          else setModal(null);
        }}
        aria-labelledby="dialog-title"
        className={`modal ${won ? "reward-modal" : ""}`}
      >
        {!won && (
          <button
            className="modal-close icon-button"
            onClick={() => setModal(null)}
            aria-label="とじる"
          >
            <X size={21} />
          </button>
        )}
        {won ? (
          <>
            <div className="confetti" aria-hidden="true">
              ✦ <span>✧</span> ✦ <span>✧</span> ✦
            </div>
            <span className="reward-customer">{customer.emoji}</span>
            <h2 id="dialog-title">できあがり！</h2>
            <p>ありがとう！ おいしそう！</p>
            <div className="reward-stars">⭐ ⭐ ⭐</div>
            <p className="reward-label">
              スターを <strong>3こ</strong> もらったよ
            </p>
            <button className="primary" onClick={next}>
              {served === 4
                ? "きょうの おしごとを みる"
                : "つぎの おきゃくさん"}
              <ArrowRight size={20} />
            </button>
          </>
        ) : modal === "help" ? (
          <>
            <span className="modal-emoji">🧁</span>
            <h2 id="dialog-title">あそびかた</h2>
            <div className="help-steps">
              <p>
                <b>1</b> 📋 ちゅうもんを みよう
              </p>
              <p>
                <b>2</b> 🍓 ざいりょうを タップ！
              </p>
              <p>
                <b>3</b> ➖ おおいときは へらそう
              </p>
              <p>
                <b>4</b> 🎂 できた！で おとどけ
              </p>
            </div>
            <p className="help-note">
              じかんせいげんは ないよ。
              <br />
              まちがえても、なんどでも なおせるよ。
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              わかった！
            </button>
          </>
        ) : modal === "shop" ? (
          <>
            <span className="modal-emoji">🎁</span>
            <h2 id="dialog-title">ごほうびのおみせ</h2>
            <p>スターで あたらしい ざいりょうを！</p>
            <div className="shop-balance">⭐ {stats.stars}こ もっているよ</div>
            <div className="shop-items">
              {ingredients
                .filter((i) => i.cost)
                .map((i) => (
                  <div className="shop-item" key={i.id}>
                    <span>{i.emoji}</span>
                    <strong>{i.name}</strong>
                    <button
                      className="secondary"
                      disabled={
                        stats.unlocked.includes(i.id) || stats.stars < i.cost
                      }
                      onClick={() =>
                        setStats((s) =>
                          s.unlocked.includes(i.id) || s.stars < i.cost
                            ? s
                            : {
                                ...s,
                                stars: s.stars - i.cost,
                                unlocked: [...s.unlocked, i.id],
                              },
                        )
                      }
                    >
                      {stats.unlocked.includes(i.id)
                        ? "✓ もっているよ"
                        : `⭐ ${i.cost}こで もらう`}
                    </button>
                    {!stats.unlocked.includes(i.id) && stats.stars < i.cost && (
                      <small>あと {i.cost - stats.stars}こ</small>
                    )}
                  </div>
                ))}
            </div>
          </>
        ) : modal === "leave" ? (
          <>
            <span className="modal-emoji">🏠</span>
            <h2 id="dialog-title">おみせに もどる？</h2>
            <p>
              つくりかけの ケーキは おしまいになるよ。
              <br />
              もらった スターは のこるよ。
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              つづけて つくる
            </button>
            <button
              className="secondary"
              onClick={() => {
                setModal(null);
                setScreen("home");
              }}
            >
              おみせに もどる
            </button>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
