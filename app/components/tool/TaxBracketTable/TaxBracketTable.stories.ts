import type { Meta, StoryObj } from "@storybook/vue3";
import TaxBracketTable, { type TaxBracketRow } from "./TaxBracketTable.vue";

const meta: Meta<typeof TaxBracketTable> = {
  title: "Features/Tools/TaxBracketTable",
  component: TaxBracketTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Displays progressive tax bracket breakdowns for INSS/IRRF tables. Pure presentational component.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaxBracketTable>;

const inssRows: TaxBracketRow[] = [
  { key: "1", rangeLabel: "Até R$ 1.518,00", rateLabel: "7,5%", baseLabel: "R$ 1.518,00", taxLabel: "R$ 113,85", isActive: true },
  { key: "2", rangeLabel: "R$ 1.518,01 – R$ 2.793,88", rateLabel: "9%", baseLabel: "R$ 1.275,88", taxLabel: "R$ 114,83", isActive: true },
  { key: "3", rangeLabel: "R$ 2.793,89 – R$ 4.190,83", rateLabel: "12%", baseLabel: "R$ 1.396,95", taxLabel: "R$ 167,63", isActive: true, badge: "✓ Sua faixa" },
  { key: "4", rangeLabel: "R$ 4.190,84 – R$ 8.157,41", rateLabel: "14%", baseLabel: "–", taxLabel: "–", isActive: false },
];

export const INSS: Story = {
  name: "INSS Brackets",
  args: {
    rows: inssRows,
    totalLabel: "Total INSS",
    totalValue: "R$ 396,31",
  },
};

const irrfRows: TaxBracketRow[] = [
  { key: "1", rangeLabel: "Até R$ 2.259,20", rateLabel: "Isento", baseLabel: "R$ 2.259,20", taxLabel: "–", isActive: true },
  { key: "2", rangeLabel: "R$ 2.259,21 – R$ 2.826,65", rateLabel: "7,5%", baseLabel: "R$ 567,45", taxLabel: "R$ 42,56", isActive: true, badge: "✓ Sua faixa" },
  { key: "3", rangeLabel: "R$ 2.826,66 – R$ 3.751,05", rateLabel: "15%", baseLabel: "–", taxLabel: "–", isActive: false },
  { key: "4", rangeLabel: "R$ 3.751,06 – R$ 4.664,68", rateLabel: "22,5%", baseLabel: "–", taxLabel: "–", isActive: false },
  { key: "5", rangeLabel: "Acima de R$ 4.664,68", rateLabel: "27,5%", baseLabel: "–", taxLabel: "–", isActive: false },
];

export const IRRF: Story = {
  name: "IRRF Brackets",
  args: {
    rows: irrfRows,
    totalLabel: "Total IRRF",
    totalValue: "R$ 42,56",
  },
};

export const AllInactive: Story = {
  name: "All brackets inactive",
  args: {
    rows: inssRows.map((r) => ({ ...r, isActive: false, badge: undefined })),
  },
};
