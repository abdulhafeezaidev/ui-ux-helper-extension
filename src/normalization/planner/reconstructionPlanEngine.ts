import {
  AnalyzePageResponseData,
  ReconstructionPlanSpecification,
  BuildPhaseId,
} from '../../types/index.ts';
import { BuildDependencyGraphEngine } from './buildDependencyGraphEngine.ts';
import { ComponentDependencyGraphEngine } from './componentDependencyGraphEngine.ts';

export class ReconstructionPlanEngine {
  private buildGraphEngine = new BuildDependencyGraphEngine();
  private componentGraphEngine = new ComponentDependencyGraphEngine();

  public normalize(data: AnalyzePageResponseData): ReconstructionPlanSpecification {
    const title = data.title || 'Web Application';
    const url = data.pageUrl || '';

    const buildGraph = this.buildGraphEngine.normalize(data);
    const componentGraph = this.componentGraphEngine.normalize(data);

    const phases = buildGraph.phases;

    const steps: ReconstructionPlanSpecification['steps'] = [
      {
        step: 1,
        phaseId: 'tokens' as BuildPhaseId,
        title: 'Phase 1: Create Design Tokens',
        description: phases.tokens.description,
        targetFiles: ['styles/tokens.css', 'styles/tailwind.config.js', 'styles/theme.json'],
        prerequisites: phases.tokens.prerequisites,
        codeSnippets: [
          ':root {\n  --color-primary: #c45536;\n  --color-surface: #faf9f5;\n  --radius-pill: 999px;\n  --spacing-xl: 24px;\n}',
        ],
        validationChecklist: phases.tokens.validationChecklist,
      },
      {
        step: 2,
        phaseId: 'typography' as BuildPhaseId,
        title: 'Phase 2: Create Typography System',
        description: phases.typography.description,
        targetFiles: ['styles/typography.css', 'components/Typography/Text.tsx'],
        prerequisites: phases.typography.prerequisites,
        codeSnippets: [
          '.font-display-hero {\n  font-size: 48px;\n  font-weight: 700;\n  line-height: 1.15;\n  letter-spacing: -0.02em;\n}',
        ],
        validationChecklist: phases.typography.validationChecklist,
      },
      {
        step: 3,
        phaseId: 'containers' as BuildPhaseId,
        title: 'Phase 3: Create Layout Containers',
        description: phases.containers.description,
        targetFiles: ['components/layout/FlexRow.tsx', 'components/layout/GridContainer.tsx', 'components/layout/SectionContainer.tsx'],
        prerequisites: phases.containers.prerequisites,
        codeSnippets: [
          'export const GridContainer = ({ columns = 4, gap = "24px", children }) => (\n  <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>{children}</div>\n);',
        ],
        validationChecklist: phases.containers.validationChecklist,
      },
      {
        step: 4,
        phaseId: 'components' as BuildPhaseId,
        title: 'Phase 4: Create Shared Components',
        description: phases.components.description,
        targetFiles: ['components/Button/Button.tsx', 'components/Card/Card.tsx', 'components/Badge/Badge.tsx'],
        prerequisites: phases.components.prerequisites,
        codeSnippets: [
          'export const Button = ({ variant = "primary", shape = "pill", children, ...props }) => (\n  <button className={`btn btn-${variant} btn-${shape}`} {...props}>{children}</button>\n);',
        ],
        validationChecklist: phases.components.validationChecklist,
      },
      {
        step: 5,
        phaseId: 'variants' as BuildPhaseId,
        title: 'Phase 5: Create Component Variants',
        description: phases.variants.description,
        targetFiles: ['components/Button/buttonVariants.ts', 'components/Card/cardVariants.ts'],
        prerequisites: phases.variants.prerequisites,
        codeSnippets: [
          'export const buttonVariants = cva("base-btn inline-flex items-center justify-center font-medium transition-all", {\n  variants: { variant: { primary: "bg-primary text-white", secondary: "bg-surface text-foreground" } }\n});',
        ],
        validationChecklist: phases.variants.validationChecklist,
      },
      {
        step: 6,
        phaseId: 'sections' as BuildPhaseId,
        title: 'Phase 6: Assemble Sections',
        description: phases.sections.description,
        targetFiles: ['sections/Header.tsx', 'sections/Hero.tsx', 'sections/ProductGrid.tsx', 'sections/Footer.tsx'],
        prerequisites: phases.sections.prerequisites,
        codeSnippets: [
          'export const HeroSection = ({ title, ctaText, onCtaClick }) => (\n  <SectionContainer padding="80px 32px" alignment="center">\n    <h1 className="font-display-hero">{title}</h1>\n    <div className="mt-6"><Button shape="pill" onClick={onCtaClick}>{ctaText}</Button></div>\n  </SectionContainer>\n);',
        ],
        validationChecklist: phases.sections.validationChecklist,
      },
      {
        step: 7,
        phaseId: 'pages' as BuildPhaseId,
        title: 'Phase 7: Build Pages',
        description: phases.pages.description,
        targetFiles: ['pages/index.tsx', 'app/layout.tsx'],
        prerequisites: phases.pages.prerequisites,
        codeSnippets: [
          'export default function Page() {\n  return (\n    <main className="min-h-screen">\n      <Header />\n      <HeroSection />\n      <ProductGridSection />\n      <Footer />\n    </main>\n  );\n}',
        ],
        validationChecklist: phases.pages.validationChecklist,
      },
      {
        step: 8,
        phaseId: 'interactions' as BuildPhaseId,
        title: 'Phase 8: Connect Interactions & Motion',
        description: phases.interactions.description,
        targetFiles: ['hooks/useModal.ts', 'motion/transitions.ts'],
        prerequisites: phases.interactions.prerequisites,
        codeSnippets: [
          'export const cardHoverTransition = {\n  scale: 1.02,\n  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",\n  transition: { duration: 0.2, ease: "easeOut" }\n};',
        ],
        validationChecklist: phases.interactions.validationChecklist,
      },
      {
        step: 9,
        phaseId: 'responsive' as BuildPhaseId,
        title: 'Phase 9: Optimize Responsive Layout',
        description: phases.responsive.description,
        targetFiles: ['styles/responsive.css', 'components/layout/MobileDrawer.tsx'],
        prerequisites: phases.responsive.prerequisites,
        codeSnippets: [
          '@media (max-width: 768px) {\n  .catalog-grid { grid-template-columns: repeat(1, 1fr) !important; }\n  .hero-section { padding: 48px 16px !important; }\n}',
        ],
        validationChecklist: phases.responsive.validationChecklist,
      },
      {
        step: 10,
        phaseId: 'accessibility' as BuildPhaseId,
        title: 'Phase 10: Accessibility & Quality Pass',
        description: phases.accessibility.description,
        targetFiles: ['tests/a11y.test.ts', 'components/A11y/SkipLink.tsx'],
        prerequisites: phases.accessibility.prerequisites,
        codeSnippets: [
          '// Contrast Check: primary #c45536 on white #ffffff -> 4.85:1 (WCAG AA Pass)\n// Focus Rings: focus-visible:outline-2 focus-visible:outline-offset-2',
        ],
        validationChecklist: phases.accessibility.validationChecklist,
      },
    ];

    const markdown = this.generateMarkdown(title, url, steps, componentGraph.summary.topologicalOrder);

    return {
      title,
      url,
      totalSteps: steps.length,
      steps,
      markdown,
    };
  }

  private generateMarkdown(
    title: string,
    url: string,
    steps: ReconstructionPlanSpecification['steps'],
    topologicalOrder: string[]
  ): string {
    const lines: string[] = [
      `# AI Reconstruction Plan: ${title}`,
      `> Target URL: \`${url}\`  `,
      `> Generated by **UI/UX Helper V2.0 AI Reconstruction Planner**`,
      '',
      '---',
      '',
      '## Executive Build Strategy',
      'This document defines the **deterministic 10-phase implementation sequence** for AI coding agents.',
      'To prevent hallucinations and eliminate redundant code, **always construct low-level dependencies before high-level consumers**.',
      '',
      '```',
      'Tokens ──► Typography ──► Containers ──► Shared Components ──► Variants',
      '                                                 │',
      '                                                 ▼',
      'Accessibility ◄── Responsive ◄── Interactions ◄── Pages ◄── Assemble Sections',
      '```',
      '',
      '---',
      '',
      '## Component Dependency Build Order (Bottom-Up)',
      'Follow this exact component generation order to guarantee maximum component reuse:',
      '',
      ...topologicalOrder.map((item, idx) => `${idx + 1}. \`${item}\``),
      '',
      '---',
      '',
      '## 10-Phase Implementation Roadmap',
      '',
    ];

    for (const s of steps) {
      lines.push(`### Step ${s.step}: ${s.title}`);
      lines.push(`${s.description}`);
      lines.push('');
      lines.push(`**Prerequisites**: ${s.prerequisites.length > 0 ? s.prerequisites.map((p) => `\`${p}\``).join(', ') : '*None (Root)*'}`);
      lines.push(`**Target Files**: ${s.targetFiles.map((f) => `\`${f}\``).join(', ')}`);
      lines.push('');

      if (s.codeSnippets && s.codeSnippets.length > 0) {
        lines.push('```typescript');
        lines.push(s.codeSnippets.join('\n\n'));
        lines.push('```');
        lines.push('');
      }

      lines.push('**Validation Checklist**:');
      for (const item of s.validationChecklist) {
        lines.push(`- [ ] ${item}`);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }
}
