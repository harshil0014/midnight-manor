export function canvasGraphics(g) {
  const color = (c) => "#" + c.toString(16).padStart(6, "0");
  const api = {
    fillStyle(c) {
      g.fillStyle = color(c);
      return api;
    },
    fillRect(x, y, w, h) {
      g.fillRect(x, y, w, h);
      return api;
    },
    lineStyle(w, c) {
      g.lineWidth = w;
      g.strokeStyle = color(c);
      return api;
    },
    beginPath() {
      g.beginPath();
      return api;
    },
    moveTo(x, y) {
      g.moveTo(x, y);
      return api;
    },
    lineTo(x, y) {
      g.lineTo(x, y);
      return api;
    },
    strokePath() {
      g.stroke();
      return api;
    },
    strokeCircle(x, y, r) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.stroke();
      return api;
    },
    strokeRect(x, y, w, h) {
      g.strokeRect(x, y, w, h);
      return api;
    },
    strokeEllipse(x, y, w, h) {
      g.beginPath();
      g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.stroke();
      return api;
    },
  };
  return api;
}
