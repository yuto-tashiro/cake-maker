import { ingredients, type Counts } from '../game/engine';
export function Cake({ counts = {}, hero = false }: { counts?: Counts; hero?: boolean }) {
  const pieces = ingredients.flatMap(i => Array.from({ length: counts[i.id] ?? 0 }, (_, n) => ({ ...i, key: `${i.id}-${n}` })));
  return <div className={`cake-art ${hero ? 'hero-cake' : ''}`} role="img" aria-label={`ケーキ。${pieces.length ? ingredients.filter(i => counts[i.id]).map(i => `${i.name}${counts[i.id]}こ`).join('、') : 'まだ なにも のっていないよ'}`}>
    <svg viewBox="0 0 440 300" aria-hidden="true">
      <defs><linearGradient id="sponge" x2="0" y2="1"><stop stopColor="#f4d8a7"/><stop offset="1" stopColor="#e6ba83"/></linearGradient><linearGradient id="icing" x2="0" y2="1"><stop stopColor="#fffdf7"/><stop offset="1" stopColor="#fff1dd"/></linearGradient></defs>
      <ellipse cx="220" cy="259" rx="185" ry="27" fill="#c8b4a3" opacity=".12"/>
      <ellipse cx="220" cy="242" rx="187" ry="36" fill="#a7c4bb"/>
      <ellipse cx="220" cy="234" rx="187" ry="36" fill="#dcebe3" stroke="#c0d6cb" strokeWidth="2"/>
      <ellipse cx="220" cy="231" rx="158" ry="26" fill="#edf4ed"/>
      <path d="M72 133 L72 213 C72 258 368 258 368 213 L368 133Z" fill="url(#sponge)"/>
      <path d="M72 174 C110 213 330 213 368 174 L368 190 C324 231 112 228 72 190Z" fill="#fff7e9"/>
      <path d="M73 180 C120 216 322 216 367 180" fill="none" stroke="#f0a5a5" strokeWidth="7"/>
      <path d="M72 131 C72 176 368 176 368 131 L368 155 Q363 180 351 170 L347 157 Q336 153 331 174 Q322 193 313 176 L310 163 Q298 158 293 185 Q284 200 275 183 L272 171 Q258 165 251 188 Q242 205 234 183 Q223 169 213 189 Q201 208 192 183 Q183 166 172 183 Q158 200 151 179 Q145 164 133 176 Q120 187 113 166 Q108 154 99 166 Q79 181 72 155Z" fill="url(#icing)"/>
      <ellipse cx="220" cy="130" rx="148" ry="53" fill="#fffcf3" stroke="#f3e5ce" strokeWidth="2"/>
      {Array.from({length: 12}, (_, i) => { const a = i * Math.PI * 2 / 12; const x = 220 + Math.cos(a) * 132; const y = 129 + Math.sin(a) * 43; return <g key={i} transform={`translate(${x} ${y})`}><path d="M-10 3 Q-15 -3 -7 -9 Q-2 -11 0 -19 Q4 -11 9 -8 Q16 2 10 5 Q0 11 -10 3" fill="#fffefa" stroke="#f0e3d2" strokeWidth="1.5"/></g>; })}
    </svg>
    <div className="toppings">{pieces.map((piece, index) => <span className="topping" key={piece.key} style={{ left: `${14 + (index % 5) * 18}%`, top: `${8 + Math.floor(index / 5) * 23}%`, transform: `rotate(${index % 2 ? 12 : -9}deg)` }}>{piece.emoji}</span>)}</div>
    {!pieces.length && !hero && <span className="cake-placeholder">なにを のせよう？</span>}
  </div>;
}
