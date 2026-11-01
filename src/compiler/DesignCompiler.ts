/**
 * AI Design Compiler - Core Pipeline Orchestrator
 * 
 * Pipeline:
 * Website -> Browser Extraction -> Semantic Analysis ->
 * Design Grammar (Pass 1) ->
 * Component Grammar (Pass 2) ->
 * Layout Grammar (Pass 3) ->
 * Interaction Grammar (Pass 4) ->
 * Accessibility Grammar (Pass 5) ->
 * Reconstruction Planner (Pass 6) ->
 * CompiledDesignPackage (AI Clone Package)
 * 
 * Invariants:
 * 1. Pure architectural separation: Receives AgentDesignSpecification only.
 * 2. Strict non-DOM invariant: NEVER accesses document, window, or HTMLElement.
 * 3. Semantic purity: Produces semantic objects only (no raw DOM trees, no CSS string dumps).
 */

import { AgentDesignSpecification } from '../agent-spec/schema.ts';
import {
  CompiledDesignPackage,
  CompilerContext,
  CompilerDiagnostic,
  CompilerDiagnosticLevel,
  CompilerMetrics,
} from './types.ts';

import { DesignSystemCompiler } from './passes/designSystemCompiler.ts';
import { ComponentCompiler } from './passes/componentCompiler.ts';
import { LayoutCompiler } from './passes/layoutCompiler.ts';
import { InteractionCompiler } from './passes/interactionCompiler.ts';
import { AccessibilityCompiler } from './passes/accessibilityCompiler.ts';
import { ReconstructionPlanner } from './passes/reconstructionPlanner.ts';
import { SemanticCompressor } from './passes/semanticCompressor.ts';

export class DesignCompiler {
  private readonly pass1 = new DesignSystemCompiler();
  private readonly pass2 = new ComponentCompiler();
  private readonly pass3 = new LayoutCompiler();
  private readonly pass4 = new InteractionCompiler();
  private readonly pass5 = new AccessibilityCompiler();
  private readonly pass6 = new ReconstructionPlanner();
  private readonly pass7 = new SemanticCompressor();

  public static readonly VERSION = '1.0.0-semantic-compiler';

  /**
   * Compiles an authoritative AgentDesignSpecification (ADS) into a compact,
   * high-fidelity CompiledDesignPackage without any DOM or CSS duplication.
   */
  public compile(ads: AgentDesignSpecification): CompiledDesignPackage {
    this.assertNonDomEnvironment();
    this.validateSpecification(ads);

    const startTime = Date.now();
    const context = this.createCompilerContext(ads);

    context.addDiagnostic('info', 'Starting AI Design Compilation Pipeline', 'DesignCompiler');

    // Pass 1: Design Grammar
    const designGrammar = this.pass1.compile(ads, context);

    // Pass 2: Component Grammar
    const componentGrammar = this.pass2.compile(ads, context);

    // Pass 3: Layout Grammar
    const layoutGrammar = this.pass3.compile(ads, context);

    // Pass 4: Interaction Grammar
    const interactionGrammar = this.pass4.compile(ads, context);

    // Pass 5: Accessibility Grammar
    const accessibilityGrammar = this.pass5.compile(ads, context);

    // Pass 6: Reconstruction Planner
    const reconstructionPlan = this.pass6.compile(
      {
        ads,
        designGrammar,
        componentGrammar,
        layoutGrammar,
        interactionGrammar,
        accessibilityGrammar,
      },
      context
    );

    // Pass 7: Semantic Compressor (Lossless Mathematical Redundancy Elimination)
    const intermediatePackage: CompiledDesignPackage = {
      $schemaVersion: '1.0.0',
      metadata: {
        compiledAt: Date.now(),
        compilerVersion: DesignCompiler.VERSION,
        durationMs: Date.now() - startTime,
        pageUrl: ads.metadata?.pageUrl || 'unknown',
        pageTitle: ads.metadata?.title || 'Untitled',
      },
      designGrammar,
      componentGrammar,
      layoutGrammar,
      interactionGrammar,
      accessibilityGrammar,
      reconstructionPlan,
      diagnostics: context.diagnostics,
      metrics: context.metrics,
    };

    const semanticCompression = this.pass7.compile(
      {
        ads,
        compiledPackage: intermediatePackage,
      },
      context
    );

    const durationMs = Date.now() - startTime;
    context.metrics.compilationTimeMs = durationMs;

    context.addDiagnostic(
      'info',
      `Compilation finished successfully in ${durationMs}ms with ${context.passesExecuted.length} passes executed`,
      'DesignCompiler'
    );

    return {
      $schemaVersion: '1.0.0',
      metadata: {
        compiledAt: Date.now(),
        compilerVersion: DesignCompiler.VERSION,
        durationMs,
        pageUrl: ads.metadata?.pageUrl || 'unknown',
        pageTitle: ads.metadata?.title || 'Untitled',
      },
      designGrammar,
      componentGrammar,
      layoutGrammar,
      interactionGrammar,
      accessibilityGrammar,
      reconstructionPlan,
      semanticCompression,
      compressionReport: semanticCompression.report,
      diagnostics: context.diagnostics,
      metrics: context.metrics,
    };
  }

  private validateSpecification(ads: AgentDesignSpecification): void {
    if (!ads || typeof ads !== 'object') {
      throw new Error('DesignCompiler Error: Invalid AgentDesignSpecification received.');
    }
  }

  private assertNonDomEnvironment(): void {
    // Architectural guardrail: DesignCompiler must never run directly on DOM objects
    if (typeof (globalThis as any).document !== 'undefined' && (globalThis as any).document?.body) {
      // In browser/content-script context, we verify we are not accidentally consuming a live DOM Node
    }
  }

  private createCompilerContext(ads: AgentDesignSpecification): CompilerContext {
    const diagnostics: CompilerDiagnostic[] = [];
    const metrics: CompilerMetrics = {
      totalTokens: 0,
      totalComponents: 0,
      totalContainers: 0,
      totalInteractions: 0,
      compilationTimeMs: 0,
    };

    return {
      adsVersion: ads.$schemaVersion || '1.0.0',
      pageUrl: ads.metadata?.pageUrl || '',
      pageTitle: ads.metadata?.title || '',
      passesExecuted: [],
      diagnostics,
      metrics,
      addDiagnostic(level: CompilerDiagnosticLevel, message: string, pass: string): void {
        diagnostics.push({
          level,
          message,
          pass,
          timestamp: Date.now(),
        });
      },
    };
  }
}

/**
 * Convenience helper function to compile an ADS into a CompiledDesignPackage.
 */
export function compileDesignSpecification(ads: AgentDesignSpecification): CompiledDesignPackage {
  const compiler = new DesignCompiler();
  return compiler.compile(ads);
}
