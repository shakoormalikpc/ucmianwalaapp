

## Fix: Installment Selection Logic

### Problem
When you select "1 installment" while adding a member, the system treats it as "this member will only pay 1 installment total (Rs. 1,000)." But the correct meaning is: **"This member has already paid 1 installment (Rs. 1,000 out of Rs. 6,000)."**

### Correct Business Logic
- Every installment member owes Rs. 6,000 total (same as lifetime)
- The installment dropdown means "how many installments has this member already paid"
- Selecting 1 = Rs. 1,000 paid, Rs. 5,000 remaining, 1/6 installments done
- Selecting 6 = Rs. 6,000 paid, Rs. 0 remaining, status = completed
- All installment members always have 6 total installments

### Changes

**File: `src/pages/Members.tsx`**

1. Update the installment dropdown label from "Number of Installments" to "Installments Paid" and change option labels to be clearer (e.g., "1 paid - Rs. 1,000")

2. Fix the `handleAdd` function:
   - `total_required`: always 6,000 for all members
   - `total_paid`: `selectedInstallments * 1000` for installment members
   - `paid_installments`: set to the selected number (not 0)
   - `total_installments`: always 6 for installment members
   - `status`: "completed" if 6 installments selected, otherwise "pending_payment"
   - Create a payment record for the initial paid amount

3. Update the info text below the dropdown to show: "Paid: Rs. X,000 of Rs. 6,000 -- Remaining: Rs. Y,000"

4. Update the table display to always show `paid/6 installments` for installment members

**Database: Revert trigger change**

The `set_membership_amount` trigger should always set `total_required = 6000` for life members (revert the previous conditional change), since total is always 6,000 regardless of installment selection.

