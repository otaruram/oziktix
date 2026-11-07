# OzikTix | Interactive Seat Ticketing & Cryptographic Check-in System
### Summarecon Mall Bandung (SMB) — Bandung Build Challenge 2026

**OzikTix** is a frontend ticketing architecture specifically engineered to eliminate ticket scalping, bot hoarders, static screenshot fraud, and double check-ins at premier entertainment venues.

---

## 🏛️ System Overview & Specifications

- **Event:** Summarecon Mall Bandung Atrium Gala 2026
- **Date & Time:** 15 Nov 2026, 19:00 WIB
- **Venue:** Main Atrium, Summarecon Mall Bandung (SMB)
- **Atrium Capacity:** 60 Designated Seats (6x10 Matrix, Rows A–F, Columns 1–10)
  - **VIP (Rows A & B, 20 Seats):** Rp 250.000 / seat
  - **Regular (Rows C & D, 20 Seats):** Rp 150.000 / seat
  - **Festival (Rows E & F, 20 Seats):** Rp 100.000 / seat

---

## 🎨 Design System (`impeccable.style` Dark Precision)

- **Canvas & Surface:** Background `#090d16` (`slate-950`), elevated surfaces `slate-900/70`, crisp `1px solid border-slate-800`.
- **Typography:** Inter for UI layout; `JetBrains Mono` (`font-mono`) for seat coordinates, 30s TOTP counters, 5-minute countdowns, and HMAC-SHA256 signatures.
- **Strict Semantic Status Colors:**
  - 🟢 **Emerald (`emerald-400`):** Seat `AVAILABLE` / Gate `VALID`
  - 🟡 **Amber (`amber-400`):** Seat `RESERVED` (5m Hold) / Gate `ALREADY USED` / Expired Screenshot
  - 🔴 **Rose (`rose-500`):** Seat `SOLD` / Gate `INVALID OR REVOKED` / Counterfeit

---

## 🛡️ QA Hardening Points & Architecture

### 1. Purchase Quota Limit (QA Point #1)
- Strict limit of **2 seats maximum** per verified Google account across active reservations and confirmed tickets.
- Attempting to pick a 3rd seat triggers the anti-scalp alert banner:
  > *"Purchase Limit Reached: Max 2 seats allowed per verified Google account to prevent scalping."*
- Features a **"Simulate Race Condition (HTTP 409 Conflict)"** button that demonstrates optimistic row locking when a concurrent buyer snatches a seat.

### 2. Anti-Scalper E-Ticket Pass Beyond HMAC-SHA256 (QA Point #2)
- Each ticket is cryptographically signed with **HMAC-SHA256** binding User ID + Masked NIK + Seat + Timestamp.
- In addition, tickets feature a **30-Second Rotating TOTP Dynamic Nonce** (RFC 6238 compliant) with a live progress bar. Screenshots shared via messaging apps expire within &lt;30s and fail at the gate scanner.
- Identity-Bound Verification Badge displays Google profile name and masked NIK (`3273************02`).

### 3. Optimal Timing Windows (QA Point #3)
- **5:00 Hold Timeout (300s TTL):** When seats are selected, an optimistic hold lock is held. If checkout is not finalized within 5:00 minutes, the hold expires and seats automatically return to `AVAILABLE`.
- **Gate Activation Window (T-2 Hours):** Features a live toggle in the top bar to preview the pre-event locked state (QR locked until T-2h) vs live gate-open state (dynamic rotating QR).

### 4. Atomic Seat Relocation / Wrong Seat Swap (QA Point #4)
- On the E-Ticket Pass view, attendees can click **"Wrong Seat? Relocate Seat (1x Free Swap)"**.
- Modal displays only currently `AVAILABLE` seats in the same tier.
- Executing the swap runs an atomic transaction:
  1. Old seat immediately turns green (`AVAILABLE`) on the seat map.
  2. New seat turns red (`SOLD`).
  3. Old QR signature is revoked.
  4. New HMAC signature is issued for the new seat coordinate.
  5. Audit entry is recorded in the Organizer Audit Log.

### 5. Physical Gate Scanner Simulation
- Real-time validator with 1-click test scenarios for judges:
  - **Tier 1 Green:** `VALID` (Ticket valid, dynamic TOTP matches live clock, identity matches).
  - **Tier 2 Yellow:** `ALREADY USED` (Double-entry detection or expired 30s screenshot token).
  - **Tier 3 Red:** `INVALID OR REVOKED` (Swapped old seat hash, refunded ticket, or forged signature).

### 6. Panitia Organizer Console & CSV Export
- Live KPIs: Gross Revenue (IDR), Occupancy Rate %, Gate Check-Ins, Active Holds.
- System Parameter Configurator: Change Max Quota per User or Hold TTL in real time.
- **1-Click Refund:** Immediately voids ticket and releases seat back to `AVAILABLE`.
- **Manifest Export (.CSV):** Generates and downloads `OzikTix_Attendees_Manifest.csv` with UTF-8 BOM for clean Indonesian name and ID rendering in Microsoft Excel.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build
```

Production build output is in `dist/`.

