# Saibun - BSV UTXO Splitter

<p align="center">
  <img src="/public/logo.png" alt="Saibun" width="200" />
</p>

<p align="center">
  <strong>Saibun</strong> (細分) - Japanese for "splitting into smaller parts"
</p>

<p align="center">
  A minimal, offline-capable tool for splitting UTXOs on the BSV blockchain.
</p>

---

## What is Saibun?

Saibun is a precision tool for splitting BSV UTXOs (Unspent Transaction Outputs) into multiple smaller outputs. Whether you need to create dust outputs for token protocols, prepare UTXOs for batch operations, or simply organize your wallet's UTXO set - Saibun handles it with elegance.

### Key Features

- **Fully Offline Capable** - Build and sign transactions without any network access
- **Client-Side Only** - All cryptographic operations happen in your browser. Your private keys never leave your device
- **xPub Derivation** - Send outputs to addresses derived from an extended public key with customizable derivation paths
- **QR Code Support** - Easily scan or share addresses and private keys
- **Minimal Design** - Clean, focused interface without crypto hype aesthetics

---

## Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (or npm/yarn)
- Modern browser with JavaScript enabled

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/msmrez/saibun.git
cd saibun
```

### 2. Install dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

**Important**: After installation, ensure you have the latest security patches:
```bash
pnpm update react react-dom next
```

This ensures you have React 19.2.1+ and Next.js 16.0.10+ with critical security fixes.

### 3. Run development server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## Development

### Available Scripts

- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build for production
- `pnpm start` - Start production server (requires build first)
- `pnpm lint` - Run ESLint

### Project Structure

```
saibun/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Main application page
│   ├── learn/             # Learn page
│   └── globals.css        # Global styles
├── components/
│   ├── saibun/            # Core application components
│   │   ├── key-manager.tsx
│   │   ├── utxo-fetcher.tsx
│   │   ├── split-config.tsx
│   │   └── transaction-builder.tsx
│   ├── ui/                # UI component library (shadcn/ui)
│   └── theme-toggle.tsx   # Theme switcher component
├── lib/
│   ├── bsv.ts             # BSV transaction logic
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

### Environment Variables

No environment variables required. The application runs entirely client-side.

---

## Building for Production

### Build the application

```bash
pnpm build
```

### Start production server

```bash
pnpm start
```

### Deploy

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): Connect your GitHub repository
- **Netlify**: Use the Next.js build preset
- **Self-hosted**: Run `pnpm build && pnpm start` on your server

---

## How to Use

### Online Mode

1. **Generate or Import Keys**
   - Click "Generate Key Pair" to create a new private key and address
   - Or switch to "Import" tab and paste an existing WIF (Wallet Import Format) private key
   - Your address will be displayed with a QR code for funding

2. **Fund Your Address**
   - Send BSV to the displayed address
   - Wait for the transaction to confirm (or proceed with unconfirmed for testing)

3. **Fetch UTXOs**
   - In "Online" mode, click "Fetch UTXOs" to retrieve your unspent outputs from Bitails API
   - The system will automatically fetch the raw transaction data needed for signing

4. **Configure Split**
   - Choose recipient type: Single Address or xPub Derivation
   - Set the number of UTXOs to create
   - Set satoshis per output (minimum 1 sat)
   - Adjust fee rate if needed (default 0.5 sat/byte)
   - Any remaining balance automatically returns to your source address

5. **Build & Broadcast**
   - Review the transaction details
   - Click "Broadcast Transaction" to send via Bitails API
   - Or "Download Raw Hex" to broadcast later from any BSV node

---

### Offline Mode

Saibun is designed to work completely offline. Here's how:

#### Preparation (While Online)

Before going offline, you need to gather the following data for each UTXO you want to spend:

1. **Raw Transaction Hex** - Download from:
   ```
   https://api.bitails.io/download/tx/{txid}/hex
   ```
   This is the complete transaction hex (starts with `01000000` or `02000000`)

2. **Output Index (vout)** - The index of the output you want to spend (usually 0, 1, 2, etc.)

#### Offline Operation

1. **Generate or Import Keys**
   - Generate a new key pair offline, or
   - Import your existing WIF private key

2. **Enter UTXO Data**
   - Switch to "Offline" mode in the UTXOs step
   - For each UTXO you want to spend:
     - Paste the raw transaction hex
     - Enter the output index (vout)
   - The system automatically extracts the txid and satoshi amount from the raw data

3. **Configure Split**
   - Same as online mode - configure your recipients, amounts, and fees

4. **Build Transaction**
   - The transaction is signed entirely offline using your private key
   - Download the raw transaction hex file

5. **Broadcast Later**
   - When you're back online, broadcast the raw hex using:
     - Bitails API: `POST https://api.bitails.io/tx/broadcast`
     - WhatsOnChain: `POST https://api.whatsonchain.com/v1/bsv/main/tx/raw`
     - Or any BSV node's `sendrawtransaction` RPC

---

## Technical Details

### Transaction Format

- Uses standard P2PKH (Pay-to-Public-Key-Hash) scripts
- Signatures include `SIGHASH_ALL | SIGHASH_FORKID` as required by BSV
- Fee calculation: `(inputs * 148 + outputs * 34 + 10) * feeRate`

### xPub Derivation

- Default path: `m/44'/145'/0'/0/{index}`
- Customizable derivation path via Advanced Settings
- Configurable starting index for address derivation
- Preview derived addresses before building transaction

### Dust Limit

- Minimum output: 1 satoshi (BSV has no practical dust limit)

### Dependencies

- `@bsv/sdk` - Official BSV SDK for transaction building and signing
- `next` - React framework for production
- `react` - UI library
- `qrcode.react` - QR code generation
- `next-themes` - Theme management
- `@radix-ui/*` - Accessible UI primitives

---

## API Reference

Saibun uses the [Bitails API](https://docs.bitails.io) for:

- Fetching UTXOs: `GET /address/{address}/unspent`
- Fetching raw transactions: `GET /download/tx/{txid}/hex`
- Broadcasting transactions: `POST /tx/broadcast`

---

## Security Considerations

### Application Security

- **Private keys are generated and stored only in your browser's memory**
- **No data is sent to any server except when explicitly fetching UTXOs or broadcasting**
- **For maximum security, use offline mode on an air-gapped device**
- **Always verify transaction details before broadcasting**
- **Consider using a dedicated browser profile or incognito mode**

### Dependency Security

- **React**: Requires 19.2.1+ (fixes CVE-2025-55182)
- **Next.js**: Requires 16.0.10+ (fixes CVE-2025-66478)
- **@bsv/sdk**: Uses official BSV SDK (1.10.3)
- Run `pnpm audit` regularly to check for vulnerabilities

---

## Troubleshooting

### Build fails with font errors

If you see Google Fonts errors during build, this is expected when building offline. The application uses system fonts as fallback.

### Port already in use

If port 3000 is already in use:
```bash
pnpm dev -- -p 3001
```

### TypeScript errors

Run type checking:
```bash
pnpm exec tsc --noEmit
```

---

## Support

If you find Saibun useful, consider supporting its development:

**BSV:** `12smcX7jymSNSyq35JE8AhV1s3jV45rszz`

**BTC:** `bc1q2x9hzq8tl0stlrsfyxsyehuh59m08ghcl9rwxa`

---

## Contact

- Email: msmrz@proton.me
- GitHub: [github.com/msmrez/saibun](https://github.com/msmrez/saibun)

---

## License

MIT License - Feel free to use, modify, and distribute.

---

<p align="center">
  <em>Saibun - Precision UTXO splitting</em>
</p>
