import { mount, type MountingOptions, type VueWrapper, type ComponentMountingOptions } from "@vue/test-utils";
import { type Component, defineComponent, h } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import { useNaiveTheme } from "~/composables/useNaiveTheme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/**
 * Opções extras além das MountingOptions padrão do @vue/test-utils.
 */
export interface RenderWithProvidersOptions extends MountingOptions<AnyRecord> {
  /**
   * Instância de Pinia customizada para o teste.
   * Se omitido, uma nova instância isolada é criada automaticamente.
   */
  pinia?: ReturnType<typeof createPinia>;
  /**
   * Instância de QueryClient customizada para o teste.
   * Se omitido, uma nova instância com `retry: false` e `gcTime: 0` é criada.
   */
  queryClient?: QueryClient;
}

/**
 * Monta um componente Vue com todos os providers globais do Auraxis Web:
 * - NConfigProvider (Naive UI com tema Auraxis)
 * - NMessageProvider + NDialogProvider
 * - Pinia (instância isolada por teste)
 * - VueQueryPlugin (QueryClient com retry desabilitado para testes)
 *
 * @param component - Componente Vue a ser montado.
 * @param options - Opções de montagem, incluindo pinia e queryClient customizados.
 * @returns VueWrapper com o componente montado dentro do wrapper de providers.
 * @example
 * ```ts
 * const wrapper = renderWithProviders(MyComponent, {
 *   props: { title: "Hello" },
 * })
 * expect(wrapper.text()).toContain("Hello")
 * ```
 */
export function renderWithProviders(
  component: Component,
  options: RenderWithProvidersOptions = {}
): VueWrapper {
  const { pinia: customPinia, queryClient: customQueryClient, ...mountOptions } = options;

  const pinia = customPinia ?? createPinia();
  const queryClient =
    customQueryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });

  const { theme, themeOverrides } = useNaiveTheme();

  // Wrapper que injeta todos os providers como componente pai
  const Wrapper = defineComponent({
    setup(): () => ReturnType<typeof h> {
      return (): ReturnType<typeof h> =>
        h(NConfigProvider, { theme, themeOverrides }, (): ReturnType<typeof h> =>
          h(NMessageProvider, {}, (): ReturnType<typeof h> =>
            h(NDialogProvider, {}, (): ReturnType<typeof h> =>
              h(component, (mountOptions.props ?? {}) as AnyRecord)
            )
          )
        );
    },
  });

  // Cast required: MountingOptions<AnyRecord>.slots is a looser type than
  // ComponentMountingOptions expects — safe here since Wrapper has no typed slots.
  return mount(Wrapper, {
    ...mountOptions,
    global: {
      ...mountOptions.global,
      plugins: [
        pinia,
        [VueQueryPlugin, { queryClient }],
        ...(mountOptions.global?.plugins ?? []),
      ],
    },
  } as ComponentMountingOptions<typeof Wrapper>);
}
