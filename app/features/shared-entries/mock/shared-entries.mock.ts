import type { SharedEntryDto } from "../contracts/shared-entry.dto";

/**
 * Mock shared entries sent BY the current user to others.
 * Contains 4 entries with varied statuses and split types.
 */
export const MOCK_SHARED_BY_ME: SharedEntryDto[] = [
  {
    id: "se-by-001",
    owner_id: "user-current-001",
    transaction_id: "txn-001",
    transaction_title: "Jantar no restaurante",
    transaction_amount: 320,
    my_share: 160,
    other_party_email: "carlos@exemplo.com",
    split_type: "equal",
    status: "pending",
    created_at: "2026-03-20T19:30:00Z",
    updated_at: "2026-03-20T19:30:00Z",
  },
  {
    id: "se-by-002",
    owner_id: "user-current-001",
    transaction_id: "txn-002",
    transaction_title: "Aluguel de temporada",
    transaction_amount: 1800,
    my_share: 900,
    other_party_email: "ana@exemplo.com",
    split_type: "percentage",
    status: "accepted",
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-16T08:00:00Z",
  },
  {
    id: "se-by-003",
    owner_id: "user-current-001",
    transaction_id: "txn-003",
    transaction_title: "Compras de supermercado",
    transaction_amount: 540,
    my_share: 300,
    other_party_email: "marcos@exemplo.com",
    split_type: "custom",
    status: "declined",
    created_at: "2026-03-10T14:00:00Z",
    updated_at: "2026-03-11T09:00:00Z",
  },
  {
    id: "se-by-004",
    owner_id: "user-current-001",
    transaction_id: "txn-004",
    transaction_title: "Conta de internet compartilhada",
    transaction_amount: 180,
    my_share: 90,
    other_party_email: "julia@exemplo.com",
    split_type: "equal",
    status: "pending",
    created_at: "2026-03-25T08:00:00Z",
    updated_at: "2026-03-25T08:00:00Z",
  },
];

/**
 * Mock shared entries sent TO the current user by others.
 * Contains 4 entries with varied statuses and split types.
 */
export const MOCK_SHARED_WITH_ME: SharedEntryDto[] = [
  {
    id: "se-with-001",
    owner_id: "user-pedro-001",
    transaction_id: "txn-101",
    transaction_title: "Churrasco de aniversário",
    transaction_amount: 800,
    my_share: 200,
    other_party_email: "pedro@exemplo.com",
    split_type: "equal",
    status: "pending",
    created_at: "2026-03-22T17:00:00Z",
    updated_at: "2026-03-22T17:00:00Z",
  },
  {
    id: "se-with-002",
    owner_id: "user-fernanda-001",
    transaction_id: "txn-102",
    transaction_title: "Viagem de fim de semana",
    transaction_amount: 1200,
    my_share: 400,
    other_party_email: "fernanda@exemplo.com",
    split_type: "custom",
    status: "accepted",
    created_at: "2026-03-18T09:00:00Z",
    updated_at: "2026-03-19T10:00:00Z",
  },
  {
    id: "se-with-003",
    owner_id: "user-rafael-001",
    transaction_id: "txn-103",
    transaction_title: "Presente coletivo",
    transaction_amount: 350,
    my_share: 87.5,
    other_party_email: "rafael@exemplo.com",
    split_type: "percentage",
    status: "declined",
    created_at: "2026-03-12T11:30:00Z",
    updated_at: "2026-03-13T08:00:00Z",
  },
  {
    id: "se-with-004",
    owner_id: "user-beatriz-001",
    transaction_id: "txn-104",
    transaction_title: "Conserto do carro compartilhado",
    transaction_amount: 2400,
    my_share: 1200,
    other_party_email: "beatriz@exemplo.com",
    split_type: "equal",
    status: "pending",
    created_at: "2026-03-26T15:00:00Z",
    updated_at: "2026-03-26T15:00:00Z",
  },
];
