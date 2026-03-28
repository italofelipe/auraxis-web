import type { Meta, StoryObj } from "@storybook/vue3";
import PortfolioTable from "./PortfolioTable.vue";
import type { WalletEntryDto } from "../../contracts/portfolio.dto";
import { MOCK_WALLET_ENTRIES } from "../../mock/portfolio.mock";

const meta: Meta<typeof PortfolioTable> = {
  title: "Features/Portfolio/PortfolioTable",
  component: PortfolioTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Data table displaying portfolio wallet entries with asset type tags, formatted currency values, and percent change indicators. Uses NDataTable with custom render functions.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PortfolioTable>;

export const Default: Story = {
  args: {
    entries: MOCK_WALLET_ENTRIES,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    entries: MOCK_WALLET_ENTRIES,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    loading: false,
  },
};

export const WithMixedAssets: Story = {
  name: "Mixed assets (stocks, FIIs, crypto, fixed income)",
  args: {
    entries: [
      {
        id: "mix-1",
        name: "Itaú Unibanco",
        ticker: "ITUB4",
        quantity: 300,
        current_value: 9600,
        cost_basis: 8500,
        register_date: "2023-06-10",
        change_percent: 2.18,
        asset_type: "stock",
      } satisfies WalletEntryDto,
      {
        id: "mix-2",
        name: "Kinea Renda Imobiliária",
        ticker: "KNRI11",
        quantity: 50,
        current_value: 7650,
        cost_basis: 7200,
        register_date: "2023-08-01",
        change_percent: -0.45,
        asset_type: "fii",
      } satisfies WalletEntryDto,
      {
        id: "mix-3",
        name: "Ethereum",
        ticker: "ETH",
        quantity: 1.5,
        current_value: 18900,
        cost_basis: 12000,
        register_date: "2024-01-15",
        change_percent: 4.02,
        asset_type: "crypto",
      } satisfies WalletEntryDto,
      {
        id: "mix-4",
        name: "Tesouro Selic 2029",
        ticker: null,
        quantity: null,
        current_value: 22000,
        cost_basis: 20000,
        register_date: "2024-02-28",
        change_percent: null,
        asset_type: "fixed_income",
      } satisfies WalletEntryDto,
    ],
    loading: false,
  },
};
