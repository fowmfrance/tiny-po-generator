

## Plan: Split tax_id into VAT + SIREN, and create a supplier_contacts table

### Context
Currently, the `suppliers` table has a single `tax_id` field used for both VAT numbers and SIRET/SIREN. Some existing values are VAT numbers (e.g. `IE6364992H`, `FR75 823383260`), others look like SIRET. We need to split this into two dedicated fields and also create a proper contacts management system instead of storing a single email/phone on the supplier record.

### 1. Database migration

```sql
-- Add dedicated columns
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS siren text;

-- Migrate existing data: FR-prefixed → vat_number, others → vat_number too (manual cleanup later)
UPDATE suppliers SET vat_number = tax_id WHERE tax_id IS NOT NULL AND tax_id != '';

-- Create contacts table
CREATE TABLE supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  first_name text,
  last_name text NOT NULL,
  role text,            -- e.g. 'Comptabilité', 'Commercial', 'Direction'
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their supplier contacts"
  ON supplier_contacts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their supplier contacts"
  ON supplier_contacts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their supplier contacts"
  ON supplier_contacts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their supplier contacts"
  ON supplier_contacts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 2. Data migration (via insert tool)
- Copy `tax_id` values into `vat_number` for all existing suppliers (done in the migration above).

### 3. Update `useSuppliers` hook
- Add `vat_number` and `siren` to the `Supplier` interface.
- Remove `tax_id` references (or keep as legacy read).
- No change needed for the main query since `SELECT *` already fetches new columns.

### 4. Create `useSupplierContacts` hook
- New hook with CRUD operations for the `supplier_contacts` table.
- Query by `supplier_id`, ordered by `is_primary DESC, last_name`.

### 5. Update `EditSupplierContactDialog`
- Replace the single "N° TVA / SIRET" field with two fields: **N° TVA** (`vat_number`) and **SIREN** (`siren`).
- Remove `tax_id` from the form state.

### 6. Create `SupplierContactsSection` component
- Displayed on the VendorDetail page (overview tab).
- Lists all contacts for the supplier with name, role, email, phone.
- Inline add/edit/delete with a small dialog or expandable row.
- "Primary contact" toggle.

### 7. Update `VendorDetail` page
- Show `vat_number` and `siren` in the header card (where `tax_id` was).
- Add the contacts section below the supplier info card.

### Files to create
- `src/hooks/useSupplierContacts.ts`
- `src/components/vendors/SupplierContactsSection.tsx`

### Files to modify
- `src/hooks/useSuppliers.ts` — update interface
- `src/components/vendors/EditSupplierContactDialog.tsx` — split tax_id field
- `src/pages/VendorDetail.tsx` — display new fields + contacts section

