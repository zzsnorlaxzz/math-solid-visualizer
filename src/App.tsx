import { useEffect, useRef, useState } from "react";
import {
  Box,
  ChevronRight,
  ChevronDown,
  Maximize,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Focus,
  Info,
  Check,
} from "lucide-react";
import SolidScene, { type Topic } from "./scenes/SolidScene";
import Board from "./drawing/Board";
import { coneVolume, sphereArea, sphereVolume, sections } from "./math/solids";
import { pourState, sectionAt, smooth } from "./math/animation";
const topics: {
  id: Topic;
  name: string;
  subtitle: string;
  title: string;
  description: string;
  steps: string[];
}[] = [
  {
    id: "cone",
    name: "원뿔의 부피",
    subtitle: "VOLUME OF A CONE",
    title: "원뿔 몇 번이면 원기둥이 채워질까요?",
    description: "밑면의 반지름과 높이가 같은 두 도형을 비교해 보세요.",
    steps: ["두 도형 관찰", "한 번 옮기기", "두 번 옮기기", "세 번 옮기기"],
  },
  {
    id: "area",
    name: "구의 겉넓이",
    subtitle: "SURFACE AREA OF A SPHERE",
    title: "구의 표면은 원 몇 개의 넓이일까요?",
    description: "같은 높이의 구면 띠를 넓이가 같은 직사각형과 대응해 보세요.",
    steps: ["구면 띠 관찰", "등면적 대응", "직사각형 비교", "원 4개와 비교"],
  },
  {
    id: "volume",
    name: "구의 부피",
    subtitle: "VOLUME OF A SPHERE",
    title: "같은 높이의 단면에는 어떤 관계가 있을까요?",
    description: "반구, 원기둥, 원뿔을 같은 높이에서 잘라 비교해 보세요.",
    steps: [
      "세 도형 관찰",
      "수평 단면 비교",
      "부피 관계 탐구",
      "반구 두 개 합치기",
    ],
  },
];
function Range({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  unit = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="range-field">
      <span>
        {label}
        <strong>
          {Number(value.toFixed(2))}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      className={`toggle ${value ? "on" : ""}`}
      aria-pressed={value}
      onClick={onChange}
    >
      <span>{label}</span>
      <span className="switch">
        <i />
      </span>
    </button>
  );
}
export default function App() {
  const [topic, setTopic] = useState<Topic>("cone"),
    [r, setR] = useState(2),
    [h, setH] = useState(4),
    [opacity, setOpacity] = useState(0.28),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [bands, setBands] = useState(16),
    [section, setSection] = useState(0.5),
    [dimensions, setDimensions] = useState(true),
    [formula, setFormula] = useState(false),
    [result, setResult] = useState(false),
    [compare, setCompare] = useState(true),
    [overlap, setOverlap] = useState(false),
    [cut, setCut] = useState(false),
    [settings, setSettings] = useState(false),
    [cameraKey, setCameraKey] = useState(0),
    [expanded, setExpanded] = useState<"scene" | "board" | null>("scene"),
    [focus, setFocus] = useState(false),
    [help, setHelp] = useState(false),
    [fullscreenError, setFullscreenError] = useState("");
  const current = topics.find((t) => t.id === topic)!;
  const transition = useRef(0);
  const [moving, setMoving] = useState(false);
  useEffect(() => () => cancelAnimationFrame(transition.current), []);
  const stage = Math.min(3, Math.floor(progress * 3 + 0.001));
  useEffect(() => {
    if (!playing) return;
    let prev = performance.now(),
      id = 0;
    function tick(now: number) {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      setProgress((p) => {
        const next = Math.min(1, p + (dt * speed) / 24);
        return next;
      });
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, speed]);
  useEffect(() => {
    if (progress >= 1) setPlaying(false);
    if (topic === "volume" && (playing || moving)) setSection(sectionAt(progress));
  }, [progress, topic, playing, moving]);
  function select(t: Topic) {
    cancelAnimationFrame(transition.current);
    setMoving(false);
    setTopic(t);
    setProgress(0);
    setPlaying(false);
    setFormula(false);
    setResult(false);
    setOverlap(false);
    setCut(t === "volume");
    setCameraKey((k) => k + 1);
    setSection(0.5);
  }
  function seek(v: number, animate = true) {
    cancelAnimationFrame(transition.current);
    setPlaying(false);
    const target = Math.max(0, Math.min(1, v));
    if (!animate) {
      setMoving(false);
      setProgress(target);
      if (topic === "volume") setSection(sectionAt(target));
      return;
    }
    const start = performance.now(), from = progress;
    const duration = Math.max(800, Math.abs(target - from) * 12000) / speed;
    setMoving(true);
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const value = from + (target - from) * smooth(t);
      setProgress(value);
      if (topic === "volume") setSection(sectionAt(value));
      if (t < 1) transition.current = requestAnimationFrame(tick);
      else setMoving(false);
    }
    transition.current = requestAnimationFrame(tick);
  }
  async function full() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError(
        "이 브라우저에서는 전체 화면을 사용할 수 없습니다. 영역 확대를 이용해 주세요.",
      );
    }
  }
  const s = sections(r, r * section);
  const answer =
    topic === "cone"
      ? coneVolume(r, h)
      : topic === "area"
        ? sphereArea(r)
        : sphereVolume(r);
  return (
    <div className={`app ${focus ? "focus-mode" : ""}`}>
      <header className="app-header">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <Box size={25} />
          </span>
          <span>
            도형 연구실<small>SOLID GEOMETRY LAB</small>
          </span>
        </a>
        <div className="course">
          <span>중학교 수학 1</span>
          <ChevronRight size={14} />
          <strong>입체도형의 성질</strong>
        </div>
        <div className="header-actions">
          <button
            className={focus ? "active" : ""}
            onClick={() => setFocus(!focus)}
          >
            <Focus size={17} />
            <span>집중 모드</span>
          </button>
          <button onClick={full}>
            <Maximize size={17} />
            <span>전체 화면</span>
          </button>
          <button
            className="icon-button"
            aria-label="사용 안내"
            onClick={() => setHelp(true)}
          >
            <Info size={19} />
          </button>
        </div>
      </header>
      <nav className="lesson-nav" aria-label="학습 단원">
        <div className="tabs">
          {topics.map((t, i) => (
            <button
              key={t.id}
              className={topic === t.id ? "tab active" : "tab"}
              onClick={() => select(t.id)}
              aria-current={topic === t.id ? "page" : undefined}
            >
              <span className="tab-number">0{i + 1}</span>
              {t.name}
            </button>
          ))}
        </div>
        <span className="teacher-badge">
          <span />
          교사용 시연 도구
        </span>
      </nav>
      {focus && (
        <button className="focus-exit" onClick={() => setFocus(false)}>
          <Focus size={16} />
          집중 모드 종료
        </button>
      )}
      <main className={`workspace ${expanded ? `expand-${expanded}` : ""}`}>
        <section className="simulation panel">
          <header className="panel-heading">
            <div>
              <span className="eyebrow">INTERACTIVE 3D</span>
              <h2>
                입체도형 탐구{" "}
                <span className="quiet">교사 시연 · 단계별 애니메이션</span>
              </h2>
            </div>
            <button
              className="icon-button"
              onClick={() => setExpanded(expanded === "scene" ? null : "scene")}
              aria-label={expanded === "scene" ? "2열로 복귀" : "3D 영역 확대"}
            >
              {expanded === "scene" ? (
                <Minimize2 size={18} />
              ) : (
                <Maximize2 size={18} />
              )}
            </button>
          </header>
          <div className="scene-area">
            <div className="lesson-prompt">
              <span className="lesson-kicker">{current.subtitle}</span>
              <h1>{current.title}</h1>
              <p>{current.description}</p>
            </div>
            <div className="scene-canvas">
              <SolidScene
                {...{
                  topic,
                  r,
                  h,
                  opacity,
                  progress,
                  bands,
                  section,
                  dimensions,
                  compare,
                  overlap,
                  cut,
                  cameraKey,
                }}
              />
            </div>
            <div className="scene-top-tools">
              <span className="live-label">
                <i />
                3D 시뮬레이션
              </span>
              <button
                className="icon-button glass"
                title="3D 시점 초기화"
                aria-label="3D 시점 초기화"
                onClick={() => setCameraKey((k) => k + 1)}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            <div className="scene-hint">
              <span>↔ 드래그하여 회전</span>
              <span>⊕ 두 손가락으로 확대 · 이동</span>
            </div>
            {formula && (
              <div className="formula-card">
                <span>공식 발견</span>
                <strong>
                  {topic === "cone"
                    ? "V = ⅓πr²h"
                    : topic === "area"
                      ? "S = 4πR²"
                      : "V = ⁴⁄₃πR³"}
                </strong>
                {topic === "volume" && (
                  <small>
                    카발리에리의 원리: 모든 높이에서 단면 넓이가 같으면 부피도
                    같습니다.
                    <br />
                    반구 = 원기둥 − 원뿔, 구 = 반구 × 2
                  </small>
                )}
              </div>
            )}
            {result && (
              <div className="result-card">
                {topic === "area" ? "겉넓이" : "부피"}{" "}
                <strong>
                  {answer.toFixed(2)} {topic === "area" ? "cm²" : "cm³"}
                </strong>
                {topic === "volume" && (
                  <small>
                    반구 {s.hemisphere.toFixed(2)} = 원기둥{" "}
                    {s.cylinder.toFixed(2)} − 원뿔 {s.cone.toFixed(2)} cm²
                  </small>
                )}
              </div>
            )}
          </div>
          <div className="discovery-note">
            <Info size={16} />
            <span>
              {topic === "cone"
                ? "이동 경로를 표시한 체적 모형입니다. 실제 유체 운동이나 부피 관계의 증명은 아닙니다."
                : topic === "area"
                  ? "등면적 대응입니다. 구의 표면을 왜곡 없이 펼친 실제 전개도가 아닙니다."
                  : "같은 높이에서 반구의 단면 넓이는 원기둥 − 원뿔의 단면 넓이와 같습니다."}
            </span>
          </div>
          <div className="settings">
            <button
              className="settings-heading"
              onClick={() => setSettings(!settings)}
              aria-expanded={settings}
            >
              <span>
                <SlidersHorizontal size={16} />
                탐구 설정
              </span>
              <ChevronDown
                size={17}
                style={{ transform: settings ? "" : "rotate(-90deg)" }}
              />
            </button>
            {settings && (
              <div className="settings-body">
                <div className="sliders">
                  <Range
                    label="반지름"
                    value={r}
                    min={0.5}
                    max={4}
                    onChange={setR}
                    unit=" cm"
                  />
                  {topic === "cone" ? (
                    <Range
                      label="높이"
                      value={h}
                      min={1}
                      max={7}
                      onChange={setH}
                      unit=" cm"
                    />
                  ) : topic === "area" ? (
                    <Range
                      label="구면 띠 개수"
                      value={bands}
                      min={8}
                      max={48}
                      step={8}
                      onChange={setBands}
                    />
                  ) : (
                    <Range
                      label="단면 높이 z / R"
                      value={section}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => {
                        cancelAnimationFrame(transition.current);
                        setMoving(false);
                        setSection(v);
                        setPlaying(false);
                      }}
                    />
                  )}
                  <Range
                    label="도형 불투명도"
                    value={opacity}
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    onChange={setOpacity}
                  />
                </div>
                <div className="toggles">
                  <Toggle
                    label="치수 표시"
                    value={dimensions}
                    onChange={() => setDimensions(!dimensions)}
                  />
                  <Toggle
                    label="비교 도형"
                    value={compare}
                    onChange={() => setCompare(!compare)}
                  />
                  <Toggle
                    label="공식 표시"
                    value={formula}
                    onChange={() => setFormula(!formula)}
                  />
                  <Toggle
                    label="계산 결과"
                    value={result}
                    onChange={() => setResult(!result)}
                  />
                  <Toggle
                    label="단면 표시"
                    value={cut}
                    onChange={() => setCut(!cut)}
                  />
                  {topic === "cone" ? (
                    <Toggle
                      label="도형 겹치기"
                      value={overlap}
                      onChange={() => setOverlap(!overlap)}
                    />
                  ) : topic === "volume" ? (
                    <>
                      <button
                        className="subtle-button"
                        onClick={() => setR((v) => v * 2)}
                        disabled={r > 2}
                      >
                        반지름 2배 · 부피 8배
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
          <div className="animation">
            <div className="demonstration-caption">
              <span>{moving || playing ? "시연 중" : "설명하며 멈추기"} · {current.steps[stage]}</span>
              <strong>{topic === "cone"
                ? `원기둥 채움 ${(pourState(progress).filled * 100).toFixed(0)}% · 원뿔 ${(pourState(progress).filled * 3).toFixed(1)}개 분량`
                : topic === "area"
                  ? progress < 1 / 3 ? "구면 띠 → 같은 높이의 원기둥 띠" : progress <= 2 / 3 ? "원기둥 띠를 열어 직사각형으로" : "가로 2πR × 세로 2R · 원 4개 넓이와 비교"
                  : progress > 2 / 3 ? "같은 반구 두 개를 합쳐 구로" : "같은 높이에서 파란 단면 = 원기둥 단면 − 원뿔 단면"}</strong>
            </div>
            <div className="steps">
              {current.steps.map((s, i) => (
                <button
                  key={s}
                  className={`${stage === i ? "current" : ""} ${stage > i ? "done" : ""}`}
                  onClick={() => seek(i / 3)}
                >
                  <span>{stage > i ? <Check size={12} /> : i + 1}</span>
                  {s}
                </button>
              ))}
            </div>
            <div className="playback">
              <button
                className="icon-button"
                aria-label="처음으로"
                onClick={() => seek(0)}
              >
                <RotateCcw size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="이전 단계"
                onClick={() => seek((Math.ceil(progress * 3) - 1) / 3)}
              >
                <SkipBack size={19} />
              </button>
              <button
                className="play-button"
                onClick={() => {
                  cancelAnimationFrame(transition.current);
                  setMoving(false);
                  if (moving) return;
                  if (progress >= 1) setProgress(0);
                  setPlaying(!playing);
                }}
              >
                {playing || moving ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {playing || moving ? "일시정지" : "전체 시연"}
              </button>
              <button
                className="icon-button"
                aria-label="다음 단계"
                onClick={() => seek((Math.floor(progress * 3 + 0.001) + 1) / 3)}
              >
                <SkipForward size={19} />
              </button>
              <input
                aria-label="애니메이션 진행도"
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(e) => seek(+e.target.value, false)}
              />
              <span className="progress-text">
                {Math.round(progress * 100)}%
              </span>
              <select
                aria-label="재생 속도"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1× 속도</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
            </div>
            {topic === "cone" && (
              <button
                className="fill-button"
                onClick={() =>
                  seek(Math.min(1, (Math.floor(progress * 3 + 0.001) + 1) / 3))
                }
              >
                물 한 번 채우기 <ChevronRight size={14} />
              </button>
            )}
          </div>
        </section>
        <Board
          expanded={expanded === "board"}
          onExpand={() => setExpanded(expanded === "board" ? null : "board")}
        />
      </main>
      <footer className="app-footer">
        <span>
          <Box size={13} /> 도형을 관찰하고, 관계를 발견하고, 생각을 기록하세요.
        </span>
        <span>
          모든 판서는 이 브라우저에만 저장됩니다{" "}
          <span className="footer-dot">·</span> GEOMETRY LAB
        </span>
      </footer>
      {(help || fullscreenError) && (
        <div className="dialog-backdrop">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="사용 안내"
          >
            <h2>도형 연구실 사용 안내</h2>
            {fullscreenError ? (
              <p>{fullscreenError}</p>
            ) : (
              <>
                <p>
                  3D 영역: 한 손가락이나 S Pen으로 회전하고, 두 손가락으로
                  확대·이동합니다. 재생 중에도 시점을 바꿀 수 있습니다.
                </p>
                <p>
                  판서: S Pen과 마우스 입력을 허용합니다. 손바닥 오입력을 줄이기
                  위해 손가락은 기본 차단하며, 손 모양 버튼으로 허용합니다. 실제
                  기기에서 팜 리젝션을 확인해 주세요.
                </p>
                <p>
                  공식·계산 결과는 탐구 설정에서 공개하세요. 단원 전환과 영역
                  확대에도 판서는 유지됩니다. 전체 삭제 전에 PNG로 보관할 수
                  있습니다.
                </p>
              </>
            )}
            <button
              className="primary"
              onClick={() => {
                setHelp(false);
                setFullscreenError("");
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
