/**
 * Runtime compatível com a API do LangGraph (StateGraph + Annotation + MemorySaver).
 */

export const START = "__start__";
export const END = "__end__";

type Reducer<T> = (left: T, right: T) => T;

export interface FieldSpec<T = any> {
  reducer?: Reducer<T>;
  default?: () => T;
}

export function annotationField<T = any>(spec?: FieldSpec<T>): FieldSpec<T> {
  return spec || {};
}

function annotationRoot<T extends Record<string, FieldSpec>>(fields: T) {
  return { fields, State: null as any };
}

export const Annotation = Object.assign(annotationField, {
  Root: annotationRoot
});

type NodeFn<S> = (state: S) => Promise<Partial<S>> | Partial<S>;
type RouterFn<S> = (state: S) => string;

/**
 * In-process checkpoint only. Durable conversation state must come from
 * ticket.flowVariables (merged as `input`/`prev` on each invoke). Do not rely
 * on MemorySaver across process restarts.
 */
export class MemorySaver {
  private store = new Map<string, any>();

  get(threadId: string) {
    return this.store.get(threadId);
  }

  set(threadId: string, state: any) {
    this.store.set(threadId, state);
  }

  delete(threadId: string) {
    this.store.delete(threadId);
  }
}

export class StateGraph<S extends Record<string, any>> {
  private nodes = new Map<string, NodeFn<S>>();
  private edges = new Map<string, string>();
  private conditionals = new Map<string, RouterFn<S>>();
  private annotation: { fields: Record<string, FieldSpec> };

  constructor(annotation: { fields: Record<string, FieldSpec>; State?: S }) {
    this.annotation = annotation;
  }

  addNode(name: string, fn: NodeFn<S>) {
    this.nodes.set(name, fn);
    return this;
  }

  addEdge(from: string, to: string) {
    this.edges.set(from, to);
    return this;
  }

  addConditionalEdges(from: string, router: RouterFn<S>) {
    this.conditionals.set(from, router);
    return this;
  }

  compile(opts?: { checkpointer?: MemorySaver }) {
    const checkpointer = opts?.checkpointer;
    const merge = (base: S, patch: Partial<S>): S => {
      const next: any = { ...base };
      for (const key of Object.keys(patch)) {
        const spec = this.annotation.fields[key] || {};
        const right = (patch as any)[key];
        if (right === undefined) continue;
        if (spec.reducer) {
          next[key] = spec.reducer(next[key], right);
        } else {
          next[key] = right;
        }
      }
      return next;
    };

    const defaults = (): S => {
      const state: any = {};
      for (const [key, spec] of Object.entries(this.annotation.fields)) {
        state[key] = spec.default ? spec.default() : undefined;
      }
      return state;
    };

    return {
      invoke: async (
        input: Partial<S>,
        config?: { configurable?: { thread_id?: string } }
      ): Promise<S> => {
        const threadId = config?.configurable?.thread_id || "default";
        let state: S = {
          ...defaults(),
          ...(checkpointer?.get(threadId) || {}),
          ...input
        } as S;

        if ("replies" in (state as any)) {
          (state as any).replies = [];
        }

        let current = this.edges.get(START) || "router";
        let guard = 0;
        while (current && current !== END && guard < 40) {
          guard += 1;
          const node = this.nodes.get(current);
          if (!node) break;
          const patch = await node(state);
          state = merge(state, patch || {});

          if (this.conditionals.has(current)) {
            current = this.conditionals.get(current)!(state);
          } else if (this.edges.has(current)) {
            current = this.edges.get(current)!;
          } else {
            current = END;
          }
        }

        if (checkpointer) {
          const toSave: any = { ...state, input: "", replies: [] };
          checkpointer.set(threadId, toSave);
        }
        return state;
      }
    };
  }
}
