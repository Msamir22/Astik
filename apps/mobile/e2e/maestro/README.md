# Maestro E2E Tests

End-to-end tests for the Monyvi mobile app using
[Maestro](https://maestro.mobile.dev/).

## Quick Start

```powershell
# 1. Start local Supabase from the repo root
npx supabase start

# 2. Export local E2E credentials (same terminal/session)
$env:E2E_LOCAL_JWT_SECRET="<JWT_SECRET from: npx supabase status -o env>"
$env:MAESTRO_E2E_EMAIL="e2e@monyvi.test"
$env:MAESTRO_E2E_PASSWORD="<local test password>"

# 3. Start emulator + Metro in E2E fixture mode (separate terminal)
$env:EXPO_PUBLIC_MONYVI_TEST_MODE="e2e"
$env:EXPO_PUBLIC_AI_SMS_PARSER_MODE="fixture"
$env:EXPO_PUBLIC_SUPABASE_URL="http://10.0.2.2:54321"
npm run start:android

# 4. Seed deterministic E2E data, then run a test through the wrapper
npm run e2e:seed -w @monyvi/mobile
npm run e2e:flow -w @monyvi/mobile -- e2e/maestro/transactions/create-transaction.yaml
```

The project wrapper runs an Android preflight before each `maestro test`: it
checks Metro, reverses port `8081`, opens the Monyvi dev client, and waits until
the app reaches a recognized screen.

> **First time?** See the full setup in
> [/.agent/workflows/maestro.md](/.agent/workflows/maestro.md)

## CI

GitHub Actions runs the Android E2E suite with:

```powershell
npm run e2e:ci -w @monyvi/mobile
```

The CI job uses local Supabase, a seeded test user, and the fixture SMS AI
parser by default. The runner starts Supabase locally, seeds the user and stable
financial data, then runs Maestro. To reproduce the same path locally:

```powershell
npm run e2e:local -w @monyvi/mobile
```

Remote Supabase is still available as a temporary fallback by setting
`E2E_SUPABASE_MODE=remote` plus explicit Supabase, service-role, and Maestro
credentials.

| Variable                         | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| `E2E_SUPABASE_MODE`              | `local` by default, `remote` fallback when needed  |
| `EXPO_PUBLIC_MONYVI_TEST_MODE`   | Set to `e2e` for deterministic app test behavior   |
| `EXPO_PUBLIC_AI_SMS_PARSER_MODE` | Set to `fixture` to avoid live AI parsing in E2E   |
| `MAESTRO_E2E_EMAIL`              | Seeded E2E test account email                      |
| `MAESTRO_E2E_PASSWORD`           | Seeded E2E test account password                   |
| `E2E_LOCAL_JWT_SECRET`           | Local Supabase JWT secret for generated local keys |
| `SUPABASE_SERVICE_ROLE_KEY`      | Seed/reset access; local mode has a safe local key |

By default the CI suite runs live SMS journeys `01` through `14`. Journey `15`
needs a release/preview APK with an embedded JS bundle, so keep it in the
release-specific path until that build is reliable in CI. Override the set with
`E2E_CI_LIVE_SMS_JOURNEYS=01,02,...` when debugging a smaller slice.

## Test Layout

| Folder                | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `helpers/`            | Shared setup and deep-link helper flows     |
| `transactions/`       | Transaction create/edit/delete/search flows |
| `sms-sync/`           | SMS sync permission and recovery flows      |
| `live-sms-detection/` | Live SMS detection journeys and helpers     |

## Transaction Flows

| Flow                                    | Description                              | Preconditions            |
| --------------------------------------- | ---------------------------------------- | ------------------------ |
| `helpers/setup.yaml`                    | Shared: launches app -> Transactions tab | -                        |
| `transactions/create-transaction.yaml`  | Create expense via FAB                   | Account exists           |
| `transactions/edit-transaction.yaml`    | Edit transaction amount                  | Transaction exists       |
| `transactions/edit-category-quick.yaml` | Quick-edit category from card            | Transaction exists       |
| `transactions/edit-amount-quick.yaml`   | Quick-edit amount from card              | Transaction exists       |
| `transactions/swap-account.yaml`        | Change account on edit screen            | 2+ accounts, transaction |
| `transactions/change-type.yaml`         | Change type Expense -> Income            | Expense exists           |
| `transactions/delete-transaction.yaml`  | Delete with confirmation                 | Transaction exists       |
| `transactions/search-filter.yaml`       | Search + type filter                     | Multiple transactions    |

## testID Reference

| testID                  | Component                           |
| ----------------------- | ----------------------------------- |
| `fab-button`            | Main FAB button                     |
| `fab-transaction`       | "Add Transaction" action            |
| `transaction-card-{id}` | Transaction card                    |
| `card-category-{id}`    | Category icon on card               |
| `card-amount-{id}`      | Amount area on card                 |
| `type-tab-{VALUE}`      | Type tabs (EXPENSE/INCOME/TRANSFER) |
| `header-save`           | Save button                         |
| `header-delete`         | Delete button                       |
| `header-back`           | Back button                         |
| `modal-confirm`         | Confirm button                      |
| `modal-cancel`          | Cancel button                       |
| `search-input`          | Search input                        |
| `filter-period`         | Period filter                       |
| `filter-type`           | Type filter                         |

## Live SMS Permission Flows

| Flow                                                                             | Description                                                       | Preconditions                |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `helpers/open-settings.yaml`                                                     | Shared helper: opens Settings via deep link                       | Authenticated/onboarded user |
| `sms-sync/sms-sync-permission-requestable.yaml`                                  | SMS sync custom permission modal before the OS prompt             | Authenticated/onboarded user |
| `live-sms-detection/live-sms-detection-sms-permission-requestable.yaml`          | Live SMS custom SMS permission modal                              | Authenticated/onboarded user |
| `live-sms-detection/live-sms-detection-notification-permission-requestable.yaml` | Live SMS notification permission modal                            | Authenticated/onboarded user |
| `live-sms-detection/live-sms-detection-enable-disable.yaml`                      | Enable/disable live SMS when permissions are granted              | Authenticated/onboarded user |
| `live-sms-detection/live-sms-detection-auto-disable-revoked-notifications.yaml`  | Auto-disable live SMS after notification permission is revoked    | Authenticated/onboarded user |
| `live-sms-detection/live-sms-journey-14-background-confirm-real-sms.yaml`        | Real SMS while app is backgrounded, Confirm notification action   | Authenticated/onboarded user |
| `live-sms-detection/live-sms-journey-15-killed-app-confirm-real-sms.yaml`        | Real SMS after app process is killed, Confirm notification action | Authenticated/onboarded user |

Additional live SMS testIDs:

| testID                      | Component                                |
| --------------------------- | ---------------------------------------- |
| `live-sms-detection-switch` | Settings live SMS detection switch       |
| `permission-modal-primary`  | Permission recovery modal primary action |
| `permission-modal-cancel`   | Permission recovery modal cancel action  |
