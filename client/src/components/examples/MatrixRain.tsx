import MatrixRain from '../MatrixRain';

export default function MatrixRainExample() {
  return (
    <div className="h-screen bg-background relative">
      <MatrixRain />
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-cyber cyber-glow">Matrix Rain Effect</h1>
          <p className="text-muted-foreground font-mono mt-2">Background animation active</p>
        </div>
      </div>
    </div>
  );
}