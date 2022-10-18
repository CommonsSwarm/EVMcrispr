import { SymbolTable } from 'jsymbol';

import { ErrorException } from './errors';
import type { Binding, RelativeBinding } from './types';
import { BindingsSpace } from './types';

type AllBindingsOpts = {
  onlyLocal?: boolean;
  spaceFilters?: BindingsSpace[];
};

const defaultOpts: AllBindingsOpts = {
  onlyLocal: false,
  spaceFilters: [],
};

const SCOPE_MODULE_IDENTIFIER = 'scopeModule';

export const isSpaceBinding =
  <BSpace extends BindingsSpace>(space: BSpace) =>
  (b: Binding): b is RelativeBinding<BSpace> =>
    b.type === space;

export class BindingsManager {
  #bindings: SymbolTable<Binding>;

  constructor(initialBindings: Binding[] = []) {
    this.#bindings = new SymbolTable<Binding>((b) => b.identifier);
    initialBindings.forEach((b) => {
      this.setBinding(b.identifier, b.value, b.type, false);
    });
  }

  enterScope(scopeModule?: string): void {
    const scopeModuleValue =
      scopeModule ??
      // Use parent's scope module when none was provided
      this.getBindingValue(SCOPE_MODULE_IDENTIFIER, BindingsSpace.OTHER) ??
      'std';

    this.#bindings.enterScope();

    const b: Binding = {
      identifier: SCOPE_MODULE_IDENTIFIER,
      value: scopeModuleValue,
      type: BindingsSpace.OTHER,
    };

    this.#setBinding(b, false);
  }

  exitScope(): void {
    this.#bindings.exitScope();
  }

  getBindingValue<BSpace extends BindingsSpace>(
    name: string,
    space: BSpace,
  ): RelativeBinding<BSpace>['value'] | undefined {
    return this.#getBinding(name, space);
  }

  getBinding<BSpace extends BindingsSpace>(
    identifier: string,
    type: BSpace,
  ): RelativeBinding<BSpace> | undefined {
    const binding = this.#bindings.lookup(identifier, type);
    return binding?.length
      ? (binding[0] as RelativeBinding<BSpace>)
      : undefined;
  }

  getAllBindings({
    onlyLocal = false,
    spaceFilters: spaces = [],
  }: AllBindingsOpts = defaultOpts): Binding[] {
    const allBindingsMapping = new Map<string, Binding[]>();
    let currentBindings: SymbolTable<Binding> | undefined = this.#bindings;

    do {
      currentBindings.symbols.forEach((bindings, identifier) => {
        if (allBindingsMapping.has(identifier)) {
          return;
        }

        let filteredBindings = bindings;
        if (spaces.length) {
          filteredBindings = bindings.filter((b) => spaces.includes(b.type));
        }

        allBindingsMapping.set(identifier, filteredBindings);
      });
      currentBindings = currentBindings.parent;
    } while (!onlyLocal && currentBindings);

    return [...allBindingsMapping.values()].flat();
  }

  getAllBindingIdentifiers(
    opts: AllBindingsOpts = defaultOpts,
  ): Binding['identifier'][] {
    return this.getAllBindings(opts).map((b) => b.identifier);
  }

  getAllBindingValues(opts: AllBindingsOpts = defaultOpts): Binding['value'][] {
    return this.getAllBindings(opts).map((b) => b.value);
  }

  getParentScope(): SymbolTable<Binding> | undefined {
    return this.#bindings.parent;
  }

  getScopeModule(): string | undefined {
    return this.#getBinding(SCOPE_MODULE_IDENTIFIER, BindingsSpace.OTHER);
  }

  setBinding<BSpace extends BindingsSpace>(
    name: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    value: RelativeBinding<BSpace>['value'],
    memSpace: BSpace,
    isGlobal = false,
    parent?: RelativeBinding<BSpace>,
  ): void {
    this.#setBinding(
      {
        identifier: name,
        value,
        type: memSpace,
        parent,
      } as Binding,
      isGlobal,
    );
  }

  setBindings(bindingOrbindings: Binding | Binding[], isGlobal = false): void {
    if (Array.isArray(bindingOrbindings)) {
      bindingOrbindings.forEach((b) => {
        this.#setBinding(b, isGlobal);
      });
    } else {
      this.#setBinding(bindingOrbindings, isGlobal);
    }
  }

  mergeBindings(bindings: Binding[]): void {
    bindings.forEach((b) => {
      if (!this.hasBinding(b.identifier, b.type)) {
        this.#bindings.add(b);
      }
    });
  }

  #setBinding(binding: Binding, isGlobal: boolean): void {
    try {
      if (isGlobal) {
        this.#bindings.addToGlobalScope(binding);
      } else {
        this.#bindings.add(binding);
      }
    } catch (err) {
      throw new ErrorException(
        `${isGlobal ? 'global' : ''} binding ${
          binding.identifier
        } already exists on current scope of ${binding.type} memory space`,
      );
    }
  }

  #getBinding<BSpace extends BindingsSpace>(
    identifier: string,
    type: BSpace,
  ): RelativeBinding<BSpace>['value'] | undefined {
    const binding = this.#bindings.lookup(identifier, type);

    return binding && binding.length ? binding[0].value : undefined;
  }

  hasBinding(name: string, memSpace: BindingsSpace): boolean {
    return !!this.#getBinding(name, memSpace);
  }
}
