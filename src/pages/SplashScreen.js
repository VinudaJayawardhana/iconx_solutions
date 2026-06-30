import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import iconxLogo from "../assets/iconx-logo.jpg";

export default function SplashScreen() {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => navigate("/home", { replace: true }), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 90 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.8 + 0.3,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
      hue:   Math.random() > 0.5 ? "45,136,224" : "26,58,110",
    }));

    let tick = 0;
    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const pulse = Math.sin(tick * 0.018 + p.x * 0.01) * 0.2 + 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.alpha * pulse})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45,136,224,${(1 - dist / 110) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="sx-root">

        <canvas className="sx-canvas" ref={canvasRef} />
        <div className="sx-grid" />
        <div className="sx-scan" />
        <div className="sx-glow" />
        <div className="sx-orb sx-orb-1" />
        <div className="sx-orb sx-orb-2" />
        <div className="sx-orb sx-orb-3" />

        <div className="sx-corner sx-tl">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(45,136,224,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-tr">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(45,136,224,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-bl">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(45,136,224,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-br">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(45,136,224,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        <div className="sx-center">
          <div className="sx-logo-wrap">
            <div className="sx-ring-a" />
            <div className="sx-ring-b" />
            <div className="sx-ring-c" />
            <img src={iconxLogo} alt="iconX" className="sx-logo-img" />
          </div>
          <div className="sx-progress-wrap">
            <div className="sx-progress-bar" />
          </div>
        </div>

      </div>
    </>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.sx-root {
  position: fixed; inset: 0;
  background: linear-gradient(145deg, #f0f4f8 0%, #dce8f5 25%, #c8daf0 55%, #a8c4e0 80%, #8aafd0 100%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  animation: sxFadeOut 0.6s ease 3.4s both;
}
@keyframes sxFadeOut {
  to { opacity: 0; pointer-events: none; }
}

.sx-canvas {
  position: absolute; inset: 0; z-index: 0;
}

.sx-grid {
  position: absolute; inset: 0; z-index: 1;
  background-image:
    linear-gradient(rgba(26,58,110,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26,58,110,0.06) 1px, transparent 1px);
  background-size: 64px 64px;
  animation: sxGridIn 1.4s ease 0.1s both;
}
@keyframes sxGridIn { from { opacity:0; } to { opacity:1; } }

.sx-scan {
  position: absolute; left: 0; right: 0; height: 1.5px;
  background: linear-gradient(90deg, transparent 0%, rgba(45,136,224,0.8) 50%, transparent 100%);
  z-index: 2; top: 0;
  animation: sxScan 2.8s ease-in-out 0.6s infinite;
}
@keyframes sxScan {
  0%   { top: 0;    opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 0.7; }
  100% { top: 100%; opacity: 0; }
}

.sx-glow {
  position: absolute; z-index: 1;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(45,136,224,0.2) 0%, rgba(26,58,110,0.08) 50%, transparent 70%);
  animation: sxGlowPulse 3s ease-in-out infinite;
}
@keyframes sxGlowPulse {
  0%, 100% { transform: scale(1);   opacity: 0.8; }
  50%       { transform: scale(1.2); opacity: 1;   }
}

.sx-orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); pointer-events: none; z-index: 1;
}
.sx-orb-1 {
  width: 420px; height: 420px;
  top: -120px; right: -80px;
  background: radial-gradient(circle, rgba(45,136,224,0.3), transparent 70%);
  animation: sxOrbFloat 7s ease-in-out infinite;
}
.sx-orb-2 {
  width: 320px; height: 320px;
  bottom: -100px; left: -60px;
  background: radial-gradient(circle, rgba(26,58,110,0.25), transparent 70%);
  animation: sxOrbFloat 9s ease-in-out 1s infinite reverse;
}
.sx-orb-3 {
  width: 250px; height: 250px;
  top: 40%; left: -80px;
  background: radial-gradient(circle, rgba(74,159,212,0.2), transparent 70%);
  animation: sxOrbFloat 11s ease-in-out 2s infinite;
}
@keyframes sxOrbFloat {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(20px, -25px); }
}

.sx-corner {
  position: absolute; z-index: 3; width: 40px; height: 40px;
  opacity: 0;
}
.sx-tl { top: 24px; left: 24px;     animation: sxCornerIn 0.7s ease 0.3s forwards; }
.sx-tr { top: 24px; right: 24px;    animation: sxCornerInFlipX 0.7s ease 0.45s forwards; }
.sx-bl { bottom: 24px; left: 24px;  animation: sxCornerInFlipY 0.7s ease 0.5s forwards; }
.sx-br { bottom: 24px; right: 24px; animation: sxCornerInFlipXY 0.7s ease 0.6s forwards; }
@keyframes sxCornerIn    { from{opacity:0;transform:scale(0.4);}          to{opacity:1;transform:scale(1);} }
@keyframes sxCornerInFlipX  { from{opacity:0;transform:scaleX(-1) scale(0.4);} to{opacity:1;transform:scaleX(-1) scale(1);} }
@keyframes sxCornerInFlipY  { from{opacity:0;transform:scaleY(-1) scale(0.4);} to{opacity:1;transform:scaleY(-1) scale(1);} }
@keyframes sxCornerInFlipXY { from{opacity:0;transform:scale(-1,-1) scale(0.4);} to{opacity:1;transform:scale(-1,-1) scale(1);} }

.sx-center {
  position: relative; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
}

.sx-logo-wrap {
  position: relative;
  width: 140px; height: 140px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 28px;
  opacity: 0;
  animation: sxLogoIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s forwards;
}
@keyframes sxLogoIn {
  from { opacity: 0; transform: scale(0.5) translateY(-16px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);     }
}

.sx-ring-a {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1.5px solid rgba(45,136,224,0.45);
  animation: sxRingSpin 7s linear infinite;
}
.sx-ring-a::before {
  content: '';
  position: absolute; top: -4px; left: 50%;
  transform: translateX(-50%);
  width: 8px; height: 8px; border-radius: 50%;
  background: linear-gradient(135deg, #2d88e0, #1a3a6e);
  box-shadow: 0 0 14px 5px rgba(45,136,224,0.9), 0 0 28px 8px rgba(45,136,224,0.4);
}
.sx-ring-b {
  position: absolute; inset: 10px; border-radius: 50%;
  border: 1px solid rgba(26,58,110,0.25);
  animation: sxRingSpin 4.5s linear infinite reverse;
}
.sx-ring-b::before {
  content: '';
  position: absolute; bottom: -3px; left: 50%;
  transform: translateX(-50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: #1a3a6e;
  box-shadow: 0 0 10px 4px rgba(26,58,110,0.7);
}
.sx-ring-c {
  position: absolute; inset: 22px; border-radius: 50%;
  border: 1px dashed rgba(74,159,212,0.2);
  animation: sxRingSpin 12s linear infinite;
}
@keyframes sxRingSpin { to { transform: rotate(360deg); } }

.sx-logo-img {
  width: 90px; height: 90px; border-radius: 50%;
  object-fit: contain; background: #fff; padding: 7px;
  box-shadow:
    0 0 0 3px rgba(45,136,224,0.2),
    0 0 0 6px rgba(45,136,224,0.08),
    0 0 50px rgba(45,136,224,0.35),
    0 0 100px rgba(26,58,110,0.15),
    0 8px 32px rgba(0,0,0,0.15);
  animation: sxLogoGlow 2.5s ease-in-out 1s infinite;
}
@keyframes sxLogoGlow {
  0%,100% {
    box-shadow: 0 0 0 3px rgba(45,136,224,0.2), 0 0 0 6px rgba(45,136,224,0.08),
                0 0 50px rgba(45,136,224,0.35), 0 0 100px rgba(26,58,110,0.15), 0 8px 32px rgba(0,0,0,0.15);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(45,136,224,0.35), 0 0 0 10px rgba(45,136,224,0.1),
                0 0 80px rgba(45,136,224,0.55), 0 0 140px rgba(26,58,110,0.2), 0 8px 32px rgba(0,0,0,0.15);
  }
}

.sx-progress-wrap {
  width: 200px; height: 2px;
  background: rgba(26,58,110,0.12);
  border-radius: 2px; overflow: hidden;
  opacity: 0;
  animation: sxFadeUp 0.5s ease 0.6s forwards;
}
.sx-progress-bar {
  height: 100%; width: 0; border-radius: 2px;
  background: linear-gradient(90deg, #1a3a6e, #2d88e0, #4a9fd4);
  animation: sxProgress 2.2s cubic-bezier(0.4,0,0.2,1) 0.8s forwards;
}
@keyframes sxProgress {
  from { width: 0;    opacity: 0.6; }
  to   { width: 100%; opacity: 1;   }
}
@keyframes sxFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;