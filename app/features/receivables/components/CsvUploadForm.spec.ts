import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CsvUploadForm from "./CsvUploadForm.vue";

vi.mock("naive-ui", () => ({
  NCard: {
    template: "<div class='n-card'><slot /></div>",
  },
  NSpace: {
    template: "<div class='n-space'><slot /></div>",
  },
  NInput: {
    props: ["modelValue", "value", "placeholder", "size"],
    template: "<input class='n-input' :value='value ?? modelValue' @input=\"$emit('update:value', $event.target.value)\" />",
    emits: ["update:value"],
  },
  NButton: {
    props: ["type", "disabled", "loading"],
    template: "<button class='n-button' :disabled='disabled' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
}));

/**
 * Mocks the FileReader API so we can simulate file reads without actual file I/O.
 *
 * @param content Text content to expose via the mocked reader.
 */
const mockFileReader = (content: string): void => {
  /** Stub implementation of the FileReader Web API for unit tests. */
  class MockFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;

    /**
     * Simulates reading a text file by synchronously calling onload
     * with the pre-configured content string.
     */
    readAsText(): void {
      if (this.onload) {
        this.onload({ target: { result: content } });
      }
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);
};

describe("CsvUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("emits preview with content and column_map when button is clicked", async () => {
    const csvContent = "desc,valor,data,cat\nConsultoria,5000,2026-03-31,Dev";
    mockFileReader(csvContent);

    const wrapper = mount(CsvUploadForm);

    // Simulate file selection to trigger the FileReader mock
    const fileInput = wrapper.find("input[type='file']");
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    Object.defineProperty(fileInput.element, "files", {
      value: [file],
      configurable: true,
    });
    await fileInput.trigger("change");

    // Fill in column mapping inputs
    const inputs = wrapper.findAll("input.n-input");
    await inputs[0]!.setValue("desc");
    await inputs[1]!.setValue("valor");
    await inputs[2]!.setValue("data");
    await inputs[3]!.setValue("cat");

    await wrapper.find(".n-button").trigger("click");

    const emitted = wrapper.emitted("preview");
    expect(emitted).toBeDefined();
    expect(emitted).toHaveLength(1);

    const payload = (emitted as unknown[][])[0]![0] as {
      content: string;
      column_map: Record<string, string>;
    };
    expect(payload.content).toBe(csvContent);
    expect(payload.column_map).toEqual({
      desc: "description",
      valor: "amount",
      data: "date",
      cat: "category",
    });
  });

  it("emits preview with empty column_map when no mapping fields are filled", async () => {
    const csvContent = "colA,colB\n1,2";
    mockFileReader(csvContent);

    const wrapper = mount(CsvUploadForm);

    const fileInput = wrapper.find("input[type='file']");
    const file = new File([csvContent], "test.csv", { type: "text/csv" });
    Object.defineProperty(fileInput.element, "files", {
      value: [file],
      configurable: true,
    });
    await fileInput.trigger("change");

    await wrapper.find(".n-button").trigger("click");

    const emitted = wrapper.emitted("preview");
    expect(emitted).toBeDefined();
    expect(emitted).toHaveLength(1);

    const payload = (emitted as unknown[][])[0]![0] as {
      content: string;
      column_map: Record<string, string>;
    };
    expect(payload.column_map).toEqual({});
  });
});
