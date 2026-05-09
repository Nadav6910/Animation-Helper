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
  Sparkles,
  Box,
  Route,
  PenLine,
} from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { Section } from './Section';
import { TargetPicker } from './TargetPicker';
import { TransformSection } from './TransformSection';
import { Transform3DSection } from './Transform3DSection';
import { TimingControls } from './TimingControls';
import { EasingPicker } from './EasingPicker';
import { ColorFilterSection } from './ColorFilterSection';
import { StaggerControls } from './StaggerControls';
import { TextEffectsPicker } from './TextEffectsPicker';
import { KeyframeTimeline } from './KeyframeTimeline';
import { PresetGallery } from './PresetGallery';
import { OffsetPathSection } from './OffsetPathSection';
import { PathDrawControls } from './PathDrawControls';

export function ControlsPanel() {
  const target = useAnimationStore((s) => s.config.target);

  return (
    <div className="flex flex-col gap-3">
      <Section
        title="Target"
        description="What gets animated"
        icon={<Target size={16} />}
        defaultOpen
      >
        <TargetPicker />
      </Section>

      <div data-tour-anchor="presets">
        <Section
          title="Presets"
          description="Start from a curated animation"
          icon={<Sparkles size={16} />}
          defaultOpen={false}
        >
          <PresetGallery />
        </Section>
      </div>

      <div data-tour-anchor="keyframes">
        <Section
          title="Keyframes"
          description="From → through → to"
          icon={<Wand2 size={16} />}
        >
          <KeyframeTimeline />
        </Section>
      </div>

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
        title="3D · Z, perspective, rotate3d"
        description="True 3D transforms"
        icon={<Box size={16} />}
        defaultOpen={false}
      >
        <Transform3DSection />
      </Section>

      <Section
        title="Path motion"
        description="Move along an SVG path with offset-path"
        icon={<Route size={16} />}
        defaultOpen={false}
      >
        <OffsetPathSection />
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
          title="Text effects & stagger"
          description="Bundled letter recipes + per-letter delay"
          icon={<Type size={16} />}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-4">
            <TextEffectsPicker />
            <StaggerControls />
          </div>
        </Section>
      )}

      {target === 'svg' && (
        <Section
          title="Path draw"
          description="Layer stroke draw on top of transforms & filters"
          icon={<PenLine size={16} />}
        >
          <PathDrawControls />
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
