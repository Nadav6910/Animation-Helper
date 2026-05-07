import { ControlsPanel } from '@/components/controls/ControlsPanel';
import { PreviewStage } from '@/components/preview/PreviewStage';
import { CodePanel } from '@/components/code/CodePanel';

export function DesktopGrid() {
  return (
    <div className="grid h-full grid-cols-12 gap-4 p-4 sm:p-6">
      <aside className="col-span-12 lg:col-span-4 xl:col-span-3 overflow-y-auto scrollbar-thin pr-1">
        <ControlsPanel />
      </aside>
      <section className="col-span-12 lg:col-span-5 xl:col-span-6">
        <PreviewStage />
      </section>
      <section className="col-span-12 lg:col-span-3">
        <CodePanel />
      </section>
    </div>
  );
}
