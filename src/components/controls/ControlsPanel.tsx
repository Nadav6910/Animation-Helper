import {
  Move,
  RotateCw,
  ScalingIcon,
  Cog,
  Wand2,
  Palette,
  Target,
  Spline,
  Type,
} from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { Section } from './Section';
import { TargetPicker } from './TargetPicker';
import { TransformSection } from './TransformSection';
import { TimingControls } from './TimingControls';
import { EasingPicker } from './EasingPicker';
import { ColorFilterSection } from './ColorFilterSection';
import { StaggerControls } from './StaggerControls';
import { KeyframeTimeline } from './KeyframeTimeline';

export function ControlsPanel() {
  const target = useAnimationStore((s) => s.config.target);

  return (
    <div className="flex flex-col gap-3">
      <Section
        title="Target"
        description="What gets animated"
        icon={<Target size={16} />}
      >
        <TargetPicker />
      </Section>

      <Section
        title="Keyframes"
        description="From → through → to"
        icon={<Wand2 size={16} />}
      >
        <KeyframeTimeline />
      </Section>

      <Section title="Translate" icon={<Move size={16} />} defaultOpen>
        <TransformSection axis="translate" />
      </Section>

      <Section title="Rotate" icon={<RotateCw size={16} />} defaultOpen={false}>
        <TransformSection axis="rotate" />
      </Section>

      <Section title="Scale" icon={<ScalingIcon size={16} />} defaultOpen={false}>
        <TransformSection axis="scale" />
      </Section>

      <Section title="Skew" icon={<Spline size={16} />} defaultOpen={false}>
        <TransformSection axis="skew" />
      </Section>

      <Section
        title="Color & Filters"
        description="Per-keyframe color, opacity, blur, hue"
        icon={<Palette size={16} />}
        defaultOpen={false}
      >
        <ColorFilterSection />
      </Section>

      {target === 'text' && (
        <Section
          title="Text stagger"
          description="Animate each letter with delay"
          icon={<Type size={16} />}
          defaultOpen={false}
        >
          <StaggerControls />
        </Section>
      )}

      <Section title="Easing" icon={<Wand2 size={16} />} defaultOpen={false}>
        <EasingPicker />
      </Section>

      <Section
        title="Timing"
        description="Duration, delay, iterations, direction, fill"
        icon={<Cog size={16} />}
      >
        <TimingControls />
      </Section>
    </div>
  );
}
