import ParticleEffect from '../ParticleEffect';

export default function ParticleEffectExample() {
  return (
    <div className="h-screen bg-background relative">
      <ParticleEffect />
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-cyber cyber-glow">Particle Effect</h1>
          <p className="text-muted-foreground font-mono mt-2">Move your mouse around</p>
        </div>
      </div>
    </div>
  );
}