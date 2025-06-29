# Marketplace Payment & Escrow Components

This directory contains React components for handling secure payments and escrow functionality in the AI marketplace. The components integrate with the deployed EscrowManager smart contract on Avalanche Fuji testnet.

## Components Overview

### 🔧 `useEscrow.ts` - React Hook
Central hook for all escrow-related functionality:
- **Contract Integration**: Connects to deployed EscrowManager contract
- **State Management**: Manages escrow and dispute state
- **Real-time Updates**: Listens to contract events for live updates
- **Error Handling**: Comprehensive error handling and user notifications

**Key Features:**
- Create ETH and USDC escrows
- Confirm delivery and create disputes
- Real-time event listening
- Automatic countdown timers
- Balance checks and validations

### 💳 `PaymentModal.tsx` - Payment Interface
Modal component for secure product purchases:
- **Multi-Currency Support**: ETH and USDC payments
- **Real-time Price Display**: Live ETH/USD conversion
- **Escrow Creation**: Automatic escrow setup on payment
- **Security Features**: Transaction confirmation and progress tracking

**Key Features:**
- Payment method selection (ETH/USDC)
- Real-time price calculations
- Platform fee display (2.5%)
- USDC approval handling
- Transaction progress tracking

### 📊 `EscrowStatus.tsx` - Escrow Management
Comprehensive escrow status and management interface:
- **Status Tracking**: Visual progress indicators
- **Auto-release Timer**: 7-day countdown display
- **Action Buttons**: Delivery confirmation and dispute creation
- **Role-based UI**: Different views for buyers/sellers

**Key Features:**
- Real-time status updates
- Progress bar visualization
- Countdown timer with auto-release
- Role-based action buttons
- Dispute creation interface

### ⚖️ `DisputeResolution.tsx` - Dispute Management
Advanced dispute resolution interface with AI analysis:
- **Evidence Submission**: Text and image evidence upload
- **AI Analysis Display**: Real-time AI-powered dispute analysis
- **Arbitrator Tracking**: Status of assigned arbitrators
- **Resolution Tracking**: Vote counting and outcome display

**Key Features:**
- Evidence submission (text/images)
- AI analysis with confidence scores
- Arbitrator assignment status
- Real-time resolution tracking
- Outcome visualization

## Smart Contract Integration

### Deployed Contracts (Avalanche Fuji)
- **EscrowManager**: `0x959591Bab069599cAbb2A72AA371503ba2d042FF`
- **ProductRegistry**: `0x09e9F0D5EfCb521Bf76B94E4Fa3c6499985E2878`
- **USDC Token**: `0x5425890298aed601595a70AB815c96711a31Bc65`

### Contract Features
- **Secure Escrow**: Funds held in smart contract
- **Auto-release**: 7-day automatic release to seller
- **Dispute Resolution**: AI + arbitrator voting system
- **Multi-token Support**: ETH and USDC payments
- **Platform Fees**: 2.5% platform fee collection

## Usage Examples

### Basic Escrow Creation
```tsx
import { useEscrow } from "~~/hooks/useEscrow";
import PaymentModal from "~~/components/marketplace/PaymentModal";

const ProductPage = () => {
  const { createEscrowETH } = useEscrow();
  
  const handlePurchase = async (productId: bigint) => {
    try {
      const escrowId = await createEscrowETH(productId, parseEther("0.1"));
      console.log("Escrow created:", escrowId);
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };
};
```

### Escrow Status Monitoring
```tsx
import EscrowStatus from "~~/components/marketplace/EscrowStatus";

const EscrowPage = () => {
  const escrowId = 1n; // From your escrow creation
  
  return (
    <div>
      <EscrowStatus escrowId={escrowId} />
    </div>
  );
};
```

### Dispute Management
```tsx
import DisputeResolution from "~~/components/marketplace/DisputeResolution";

const DisputePage = () => {
  const disputeId = 1n; // From dispute creation
  
  return (
    <div>
      <DisputeResolution disputeId={disputeId} />
    </div>
  );
};
```

## Event Handling

The components automatically listen to contract events:

### Escrow Events
- `EscrowCreated`: New escrow created
- `EscrowDelivered`: Delivery confirmed
- `FundsReleased`: Funds released to recipient
- `AutoReleaseExecuted`: Automatic release after 7 days

### Dispute Events
- `DisputeCreated`: New dispute initiated
- `DisputeResolved`: Dispute resolution complete
- `ArbitratorsSelected`: Arbitrators assigned via VRF

## Security Features

### Payment Security
- **Escrow Protection**: Funds held until delivery confirmation
- **Auto-release**: Automatic release after 7 days if no disputes
- **Platform Fees**: Transparent 2.5% platform fee
- **Multi-sig Protection**: Contract access controls

### Dispute Security
- **AI Analysis**: Chainlink Functions for dispute analysis
- **Random Arbitrators**: VRF for fair arbitrator selection
- **Evidence Tracking**: Immutable evidence submission
- **Vote Transparency**: On-chain arbitrator voting

## Error Handling

The components include comprehensive error handling:

### Network Errors
- Connection timeouts
- Transaction failures
- Insufficient funds
- Gas estimation failures

### Contract Errors
- Invalid escrow states
- Unauthorized actions
- Insufficient balances
- Failed approvals

### User Errors
- Wallet not connected
- Wrong network
- Insufficient permissions
- Invalid inputs

## Styling & Theming

Components use DaisyUI classes for consistent styling:
- **Theme Support**: Automatic dark/light theme
- **Responsive Design**: Mobile-first approach
- **Component Library**: Consistent button/card styles
- **Loading States**: Built-in loading indicators

## Testing

### Local Testing
1. Start local hardhat node
2. Deploy contracts locally
3. Update contract addresses in hook
4. Test payment flows

### Testnet Testing
1. Connect to Avalanche Fuji
2. Get testnet AVAX from faucet
3. Get testnet USDC for testing
4. Test full escrow lifecycle

## Integration Checklist

- [ ] Connect wagmi/viem configuration
- [ ] Update contract addresses for your network
- [ ] Configure Chainlink subscription IDs
- [ ] Set up USDC token for testing
- [ ] Test payment flows end-to-end
- [ ] Configure event listening
- [ ] Test dispute resolution
- [ ] Implement error boundaries
- [ ] Add analytics tracking
- [ ] Deploy to production

## Support

For questions or issues:
1. Check contract deployment status
2. Verify network configuration
3. Test with small amounts first
4. Monitor transaction status
5. Check event logs for debugging

## Security Notes

⚠️ **Important Security Considerations:**
- Always test with small amounts first
- Verify contract addresses before use
- Monitor for contract upgrades
- Keep private keys secure
- Use hardware wallets for production
- Implement proper error boundaries
- Add transaction monitoring
- Consider insurance for large amounts