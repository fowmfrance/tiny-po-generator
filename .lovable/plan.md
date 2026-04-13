

## Plan: Fix vendor card, PDF viewer, and invoice references

### Issues identified

1. **PDF viewer broken** — The `<object>` / `<iframe>` approach for signed URLs often fails due to browser CORS/CSP restrictions on Supabase signed URLs. Replace with Google Docs viewer as fallback or use `embed` with proper headers.

2. **Invoice "Réf. BC" column always empty** — All 411 invoices have `po_number = NULL` in the database, but 383 have `purchase_order_id` populated. The overview tab and invoices tab display `inv.po_number` which is always null. Fix: join `purchase_order_id` to `purchase_orders` to retrieve the actual `po_number`.

3. **Icon next to name instead of category** — On VendorCard, the `SupplierTypeIcon` is rendered in the same row as the name (line 49-51). Move it next to the category text (line 53).

4. **YTD and N-1 amounts on vendor card** — Add two computed values: total PO amount for current year and previous year. Requires fetching `purchase_orders.total_amount` and `created_at` per supplier.

---

### Changes

**File: `src/components/vendors/VendorCard.tsx`**
- Move `SupplierTypeIcon` from the name row to next to `vendor.category`
- Add YTD amount and N-1 amount display (two compact lines with `TrendingUp` icon)
- Remove `businessVolume` display (replaced by computed YTD)

**File: `src/types/vendor.ts`**
- Add `ytdAmount` and `prevYearAmount` to `Vendor` interface

**File: `src/pages/Vendors.tsx`** (supplierToVendor mapping)
- Map new `ytdAmount` / `prevYearAmount` from supplier data

**File: `src/hooks/useSuppliers.ts`**
- Enhance PO query to fetch `total_amount` and `created_at` per supplier
- Compute YTD (current year) and N-1 (previous year) sums per supplier
- Add `ytd_amount` and `prev_year_amount` to returned Supplier type

**File: `src/pages/VendorDetail.tsx`** (overview tab invoices section)
- Replace `inv.po_number` with a lookup from `purchase_order_id` → PO number using the already-loaded `supplierPOs`

**File: `src/components/vendors/VendorInvoicesTab.tsx`**
- Already handles PO linking via `invoicePOLinks` and `poMap` — verify the Réf BC display uses `linkedPOs` instead of `inv.po_number`

**File: PDF viewer fix** (VendorInvoicesTab.tsx + POInvoiceSection.tsx)
- Replace `<object>` + `<iframe>` with an `<iframe>` using Google Docs viewer URL for PDFs (`https://docs.google.com/gview?url=ENCODED_URL&embedded=true`) as primary, with direct URL as fallback for images
- Add a download button always visible

### Data fix (SQL)
- Backfill `po_number` on `supplier_invoices` from `purchase_orders`:
```sql
UPDATE supplier_invoices si
SET po_number = po.po_number
FROM purchase_orders po
WHERE si.purchase_order_id = po.id
AND si.po_number IS NULL;
```

