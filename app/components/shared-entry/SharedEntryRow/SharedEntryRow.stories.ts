import type { Meta, StoryObj } from "@storybook/vue3";
import SharedEntryRow from "./SharedEntryRow.vue";
import type { SharedEntryDto } from "~/features/shared-entries/contracts/shared-entry.dto";

const meta: Meta<typeof SharedEntryRow> = {
  title: "Features/SharedEntries/SharedEntryRow",
  component: SharedEntryRow,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Row component for a shared transaction entry. Shows title, status, split type, email, amounts, and optionally a revoke button.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SharedEntryRow>;

const pendingEntry: SharedEntryDto = {
  id: "se-001",
  transaction_id: "txn-001",
  transaction_title: "Jantar no restaurante",
  transaction_amount: 320,
  split_type: "equal",
  my_share: 160,
  other_party_email: "carlos@exemplo.com",
  created_at: "2026-03-20T19:30:00Z",
  status: "pending",
};

export const ByMePending: Story = {
  name: "By Me — Pending (shows revoke button)",
  args: {
    entry: pendingEntry,
    mode: "by-me",
  },
};

export const ByMeAccepted: Story = {
  name: "By Me — Accepted (no revoke)",
  args: {
    entry: {
      id: "se-002",
      transaction_id: "txn-002",
      transaction_title: "Aluguel de temporada",
      transaction_amount: 1800,
      split_type: "percentage",
      my_share: 900,
      other_party_email: "ana@exemplo.com",
      created_at: "2026-03-15T10:00:00Z",
      status: "accepted",
    } satisfies SharedEntryDto,
    mode: "by-me",
  },
};

export const WithMePending: Story = {
  name: "With Me — Pending (no revoke button)",
  args: {
    entry: {
      id: "se-with-001",
      transaction_id: "txn-101",
      transaction_title: "Churrasco de aniversário",
      transaction_amount: 800,
      split_type: "equal",
      my_share: 200,
      other_party_email: "pedro@exemplo.com",
      created_at: "2026-03-22T17:00:00Z",
      status: "pending",
    } satisfies SharedEntryDto,
    mode: "with-me",
  },
};

export const WithMeDeclined: Story = {
  name: "With Me — Declined",
  args: {
    entry: {
      id: "se-with-003",
      transaction_id: "txn-103",
      transaction_title: "Presente coletivo",
      transaction_amount: 350,
      split_type: "custom",
      my_share: 87.5,
      other_party_email: "rafael@exemplo.com",
      created_at: "2026-03-12T11:30:00Z",
      status: "declined",
    } satisfies SharedEntryDto,
    mode: "with-me",
  },
};
