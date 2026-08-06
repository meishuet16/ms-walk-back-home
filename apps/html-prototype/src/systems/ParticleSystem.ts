export type Particle = { x: number; y: number; vx: number; vy: number; size: number; phase: number; kind: "firefly" | "dust" | "rain" };

export class ParticleSystem {
  particles: Particle[];

  constructor(count = 90) {
    this.particles = Array.from({ length: count }, (_, index) => ({
      x: (index * 137) % 1536,
      y: (index * 73) % 780,
      vx: index % 3 === 0 ? 3 : -2,
      vy: index % 5 === 0 ? 18 : 1,
      size: 1 + (index % 4),
      phase: index * 0.7,
      kind: index % 6 === 0 ? "rain" : index % 2 === 0 ? "firefly" : "dust"
    }));
  }

  draw(ctx: CanvasRenderingContext2D, time: number, rain: boolean, cameraX: number, cameraY: number, scale: number): void {
    for (const particle of this.particles) {
      const x = (particle.x - cameraX + Math.sin(time / 900 + particle.phase) * 5) * scale;
      const y = (particle.y - cameraY + Math.cos(time / 1100 + particle.phase) * 3) * scale;
      if (particle.kind === "rain") {
        if (!rain) continue;
        ctx.strokeStyle = "rgba(137, 191, 219, .28)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5 * scale, y + 14 * scale);
        ctx.stroke();
      } else if (particle.kind === "firefly") {
        ctx.fillStyle = `rgba(255, 214, 90, ${0.28 + Math.sin(time / 260 + particle.phase) * 0.22})`;
        ctx.fillRect(x, y, particle.size * scale, particle.size * scale);
      } else {
        ctx.fillStyle = "rgba(228, 219, 187, .16)";
        ctx.fillRect(x, y, 1 * scale, 1 * scale);
      }
    }
  }
}
