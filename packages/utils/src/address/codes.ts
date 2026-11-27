/**
 * Address validation result codes. Client-safe so the UI can map messages.
 */
export type AddressErrorCode =
  | "STATE_REQUIRED"
  | "STATE_INVALID"
  | "COUNTRY_UNSUPPORTED"
  | "POSTAL_REQUIRED"
  | "POSTAL_FORMAT"
  | "POSTAL_NOT_USED"
  | "POSTAL_NOT_FOUND"
  | "POSTAL_STATE_MISMATCH"
  | "CITY_REQUIRED"
  | "CITY_INVALID"
  | "ADDRESS_REQUIRED"
  | "ADDRESS_INVALID"
  | "AE_CITY_MISMATCH"
  | "MILITARY_NOT_SUPPORTED"
  | "TERRITORY_NOT_SUPPORTED"
  | "PO_BOX_NOT_SUPPORTED";

/** Accepted but recorded on the order (addressFlags) for review/analytics. */
export type AddressFlag =
  | "POSTAL_UNKNOWN"
  | "AE_CITY_UNKNOWN"
  | "PO_BOX"
  | "PHONE_COUNTRY_MISMATCH"
  | "SHADOW_WOULD_REJECT";

export type AddressField = "address" | "city" | "state" | "postalCode";

export interface AddressIssue {
  code: AddressErrorCode;
  field: AddressField;
  message: string;
}
