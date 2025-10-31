import CyberHeader from '@/components/CyberHeader';
import LeftSidebar from '@/components/LeftSidebar';
import MainContent from '@/components/MainContent';
import RightSidebar from '@/components/RightSidebar';
import CyberFooter from '@/components/CyberFooter';
import MatrixRain from '@/components/MatrixRain';
import ParticleEffect from '@/components/ParticleEffect';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground scanlines">
      {/* Background Effects */}
      <MatrixRain />
      <ParticleEffect />
      
      {/* Main Layout */}
      <div className="relative z-10 min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-1 lg:grid-cols-[20%_60%_20%]">
        {/* Header - Full Width */}
        <header className="col-span-full">
          <CyberHeader />
        </header>

        {/* Left Sidebar */}
        <aside className="hidden lg:block">
          <LeftSidebar />
        </aside>

        {/* Main Content */}
        <main className="min-h-0">
          <MainContent />
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block">
          <RightSidebar />
        </aside>

        {/* Footer - Full Width */}
        <footer className="col-span-full">
          <CyberFooter />
        </footer>
      </div>

      {/* Mobile Layout Overlay */}
      <div className="lg:hidden fixed inset-0 bg-background/95 z-50 p-4 overflow-y-auto">
        <div className="space-y-4">
          <CyberHeader />
          <div className="grid gap-4">
            <MainContent />
            <div className="grid md:grid-cols-2 gap-4">
              <LeftSidebar />
              <RightSidebar />
            </div>
          </div>
          <CyberFooter />
        </div>
      </div>
    </div>
  );
}